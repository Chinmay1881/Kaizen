# Muliya Kaizan — Backend API

Express REST API with Prisma and PostgreSQL.

## Stack

- Node.js, Express, TypeScript
- Prisma ORM, PostgreSQL
- Clerk authentication

## Getting Started

```bash
cp .env.example .env
# Configure DATABASE_URL and Clerk keys
npm install
npm run prisma:generate
npm run dev
```

API runs at [http://localhost:4000](http://localhost:4000).

Health check: `GET /health`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |

## Project Structure

See `docs/engineering/02_FOLDER_STRUCTURE.md` in the workspace docs folder.
