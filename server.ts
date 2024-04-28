import { Application, Router, isHttpError } from "oak";
import { Client } from "postgres";
import { Redis, connect } from "redis";
import * as bcrypt from "bcrypt";
import { load } from "dotenv";
import { create, verify, Payload, Header } from "djwt";
import { ServerConfig, User } from "./global.ds.ts";

const createServer = async (config: ServerConfig) => {
    const { app, router, port, db, redis, privateKey } = config;
    await db.connect();

    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            if (isHttpError(err)) {
                ctx.response.status = err.status;
            } else {
                ctx.response.status = 500;
            }
            ctx.response.body = { error: err.message };
            ctx.response.type = "json";
        }
    });

    app.use(async (ctx, next) => {
        ctx.state.db = db;
        await next();
    });

    app.use(async (ctx, next) => {
        ctx.state.redis = redis;
        await next();
    });

    app.use(async (ctx, next) => {
        if (
            ctx.request.hasBody &&
            ctx.request.headers.get("Content-Type") === "application/json"
        ) {
            try {
                const body = await ctx.request.body.json();
                ctx.state.body = body;
            } catch (error) {
                ctx.throw(400, "Invalid JSON");
            }
        }
        await next();
    });

    app.use(async (ctx, next) => {
        console.log("Starting authentication middleware...");
        const authToken = ctx.request.headers?.get("Authorization");
        if (authToken && authToken.startsWith("Bearer ")) {
            const token = authToken.split(" ")[1];
            try {
                const payload = await verify(token, privateKey);
                if (
                    payload &&
                    (!payload.exp ||
                        payload.exp >= Math.floor(Date.now() / 1000))
                ) {
                    console.log("Authenticated user");
                    ctx.state.auth = {
                        token,
                        payload,
                        isAuthenticated: true,
                    };
                } else {
                    console.log("Invalid token, clearing auth state");
                    ctx.state.auth = {
                        token: null,
                        payload: null,
                        isAuthenticated: false,
                    };
                }
            } catch (error) {
                console.error("Error verifying token");
                ctx.state.auth = {
                    token: null,
                    payload: null,
                    isAuthenticated: false,
                };
            }
        }
        await next();
    });

    router.post("/register", async (ctx) => {
        const { username, password } = ctx.state.body;
        try {
            const id = crypto.randomUUID() as string;
            const password_hash = await bcrypt.hash(password);
            const result = await db.queryObject(
                `INSERT INTO users (id, username, password) VALUES ('${id}', '${username}', '${password_hash}') RETURNING *;`
            );
            ctx.response.status = 201;
        } catch (error) {
            ctx.throw(400, "Username already exists");
        }
    });

    router.post("/login", async (ctx) => {
        if (
            !ctx.state.body ||
            !ctx.state.body.username ||
            !ctx.state.body.password
        ) {
            console.error("Missing username or password");
            ctx.throw(400, "Missing username or password");
            return;
        }
        const { username, password } = ctx.state.body;
        const result = await db.queryObject(
            `SELECT * FROM users WHERE username = '${username}'`
        );

        if (result.rowCount === 0) {
            ctx.throw(401, "Invalid username or password");
            return;
        }

        const user = result.rows[0] as User;
        console.log("User found in database:", user.id);
        if (await bcrypt.compare(password, user.password)) {
            console.log("Validated password");
            const header: Header = {
                alg: "HS256",
                typ: "JWT",
            };
            const payload: Payload = {
                iss: "your_issuer",
                sub: user.id,
                exp: Math.floor(Date.now() / 1000) + 3600,
            };
            console.log("Creating JWT");
            const jwt = await create(header, payload, privateKey);
            console.log("JWT created, saving to Redis");
            await redis.set(jwt, JSON.stringify(user));
            ctx.response.body = JSON.stringify({
                token: jwt,
            });
        } else {
            console.error("Invalid password:", password, user.password);
            ctx.throw(401, "Invalid username or password");
        }
    });

    router.get("/profile", async (ctx) => {
        if (ctx.state.auth.isAuthenticated) {
            const cacheResult = await redis.get(ctx.state.auth.token);
            if (cacheResult) {
                ctx.response.body = cacheResult;
                return;
            }
        } else {
            ctx.throw(401, "Unauthorized");
        }
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.addEventListener("listen", () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

    await app.listen({ port });
};

try {
    const env = await load();
    const port = Number(env["PORT"]) || 8000;

    const app = new Application();
    const router = new Router();

    const db = new Client({
        user: env["POSTGRES_USER"],
        password: env["POSTGRES_PASSWORD"],
        database: env["POSTGRES_DB"],
        hostname: env["POSTGRES_HOST"],
        port: env["POSTGRES_PORT"],
    });

    const redis = await connect({
        hostname: env["REDIS_HOST"],
        port: env["REDIS_PORT"],
    });

    const privateKey = await crypto.subtle.generateKey(
        { name: "HMAC", hash: "SHA-256" },
        true,
        ["sign", "verify"]
    );

    await createServer({ app, router, port, db, redis, privateKey });
} catch (error) {
    console.error("Error starting server");
}
