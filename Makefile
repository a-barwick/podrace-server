.PHONY: db-reset dev

up:
	deno run -A db/migration.ts --up

down:
	deno run -A db/migration.ts --down

seed:
	deno run -A db/migration.ts --seed

db-reset:
	@deno run -A db/migration.ts --down
	@deno run -A db/migration.ts --up
	@deno run -A db/migration.ts --seed
	@redis-cli flushall

dev:
	deno task dev