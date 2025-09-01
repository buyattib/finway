## Run docker compose to spin up the db

-   docker compose --project-name finhub -f compose.yaml up
-   docker compose --project-name finhub -f compose.yaml up --build
-   docker compose --project-name finhub -f compose.yaml down

## Run the local dev server

-   pnpm dev

## Database

-   Push changes directly to the db (for testing): npx drizzle-kit push
-   Generate migrations: npx drizzle-kit generate
-   Migrate (apply the migrations): npx drizzle-kit migrate
