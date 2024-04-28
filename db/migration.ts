import { load } from "dotenv";
import { Client } from "postgres";

const env = await load();

const client = new Client({
    user: env["POSTGRES_USER"],
    password: env["POSTGRES_PASSWORD"],
    database: env["POSTGRES_DB"],
    hostname: "localhost",
    port: 5432,
});

function parseArgs(args: string[]): string[] {
    if (args.length === 0) {
        console.error("Must specify either --up, --down, or --seed");
        Deno.exit(1);
    }

    const hasUp = args.includes("--up");
    const hasDown = args.includes("--down");
    const hasSeed = args.includes("--seed");

    if (hasUp && hasDown) {
        console.error("Cannot specify both --up and --down");
        Deno.exit(1);
    }
    if (hasDown && hasSeed) {
        console.error("Cannot specify both --down and --seed");
        Deno.exit(1);
    }

    let commands = [];
    if (hasUp) {
        commands.push("up.sql");
    }
    if (hasDown) {
        commands.push("down.sql");
    }
    if (hasSeed) {
        commands.push("seed.sql");
    }
    return commands;
}

async function runMigration(file: string) {
    await client.connect();
    try {
        const migrationQuery = await Deno.readTextFile(`db/${file}`);
        await client.queryObject(migrationQuery);
        console.log(`(${file}) - Migration completed`);
    } catch (error) {
        console.error(`Migration for ${file} failed:\n`, error);
    } finally {
        await client.end();
    }
}

try {
    for (const file of parseArgs(Deno.args)) {
        runMigration(file);
    }
} catch (e) {
    console.error(e);
    Deno.exit(1);
}
