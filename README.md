## Install dependencies

- pnpm install

## Run the local dev server

- pnpm dev

## Database view

- Browse the db with drizzle studio: pnpm run db:studio (spins a server in localhost:6001)

## Database migrations

There are scripts in the package.json defined to:

- push: applies changes to the db
- generate: generates a .sql migration file
- migrate: applies the migrations in the generated .sql file

## Run scripts

- With 'script' script: pnpm run script -- database/seed/new-user.ts

## Emails

- Resend + react-email is used
- Emails are found in app/emails/ dir
- To preview emails run: pnpm run email (spins server to preview emails in localhost:6000)
