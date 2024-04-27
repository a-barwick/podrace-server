import { Application, Router } from "oak";
import { load } from "dotenv";

const env = await load();
const port = Number(env["PORT"]) || 8000;

const app = new Application();
const router = new Router();

// Sample data
const users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

// Middleware to parse JSON request bodies
app.use(async (ctx, next) => {
  if (ctx.request.hasBody) {
    try {
      const body = await ctx.request.body.json();
      ctx.state.body = body;
    } catch (error) {
      ctx.throw(400, "Invalid JSON");
    }
  }
  await next();
});

// GET /users - Get all users
router.get("/users", (ctx) => {
  ctx.response.body = users;
});

// GET /users/:id - Get a specific user by ID
router.get("/users/:id", (ctx) => {
  const id = parseInt(ctx.params.id);
  const user = users.find((user) => user.id === id);
  if (user) {
    ctx.response.body = user;
  } else {
    ctx.throw(404, "User not found");
  }
});

// POST /users - Create a new user
router.post("/users", (ctx) => {
  const { name, email } = ctx.state.body;
  const newUser = {
    id: users.length + 1,
    name,
    email,
  };
  users.push(newUser);
  ctx.response.status = 201;
  ctx.response.body = newUser;
});

// PUT /users/:id - Update a user by ID
router.put("/users/:id", (ctx) => {
  const id = parseInt(ctx.params.id);
  const { name, email } = ctx.state.body;
  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex !== -1) {
    users[userIndex] = {
      id,
      name,
      email,
    };
    ctx.response.body = users[userIndex];
  } else {
    ctx.throw(404, "User not found");
  }
});

// DELETE /users/:id - Delete a user by ID
router.delete("/users/:id", (ctx) => {
  const id = parseInt(ctx.params.id);
  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
    ctx.response.status = 204;
  } else {
    ctx.throw(404, "User not found");
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", () => {
  console.log("Server is running on http://localhost:8000");
});

await app.listen({ port: 8000 });
