## Install dependencies

- pnpm install

## Run the local dev server

- pnpm dev

## Database (scripts)

There are scripts in the package.json defined to push, generate and migrate

## Database (manually)

- Push changes directly to the db (for testing): npx drizzle-kit push
- Generate migrations: npx drizzle-kit generate
- Migrate (apply the migrations): npx drizzle-kit migrate

## Run db scripts

- With 'script' script: pnpm run script -- database/scripts/test.ts
