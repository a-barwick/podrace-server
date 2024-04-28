import { type Application, type Router } from "oak";
import { type Client } from "postgres";
import { type Redis } from "redis";

export type User = {
    id: string;
    username: string;
    password: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type ServerConfig = {
    app: Application;
    router: Router;
    port: number;
    db: Client;
    redis: Redis;
    privateKey: CryptoKey;
};
