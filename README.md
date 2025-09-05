## Install dependencies

-   pnpm install

## Run the local dev server

-   pnpm dev

## Database (scripts)

There are scripts in the package.json defined to push, generate and migrate

## Database (manually)

-   Push changes directly to the db (for testing): npx drizzle-kit push
-   Generate migrations: npx drizzle-kit generate
-   Migrate (apply the migrations): npx drizzle-kit migrate

## Run db scripts

-   In the script initialize the db conection
-   Run the script with tsx: npx tsx --env-file=.env path/to/script.ts

-   Or with 'script' script: pnpm run script -- database/scripts/test.ts
