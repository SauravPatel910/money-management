# Money Management App

A personal finance app for tracking accounts, income, expenses, transfers, person-to-person payments, and running balances.

## Stack

- Next.js App Router with TypeScript
- React 19
- Redux Toolkit for the current client state layer
- Prisma ORM
- PostgreSQL, intended for Neon
- Tailwind CSS
- pnpm 10.33.0

## Setup

Create `.env.local` with your Neon connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
```

Install dependencies:

```bash
pnpm install
```

Generate Prisma Client and push the schema:

```bash
pnpm prisma:generate
pnpm prisma:push
```

Run the app:

```bash
pnpm dev
```

## Scripts

- `pnpm dev` starts the Next.js development server.
- `pnpm build` creates a production build.
- `pnpm lint` runs ESLint.
- `pnpm prisma:validate` validates the Prisma schema.
- `pnpm prisma:generate` generates Prisma Client.
- `pnpm prisma:push` applies the current schema to the configured database.
