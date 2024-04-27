import { Application } from "oak";
import { load } from "dotenv";

const env = await load();
const port = Number(env["PORT"]) || 8000;

const app = new Application();

app.use((ctx) => {
  ctx.response.body = "Hello World!";
});

console.log(`Server running on http://localhost:${port}`);
await app.listen({ port: port });
