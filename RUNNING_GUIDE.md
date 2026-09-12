# Smart Notice Board - Run Guide for Another Machine

This guide explains how to run the project on a new machine using Docker.

## 1) Prerequisites

Install the following software:

- Git
- Docker Desktop or Docker Engine
- Docker Compose

Optional:

- VS Code

## 2) Clone the project

```bash
git clone <repository-url>
cd SmartNoticeBoard
```

## 3) Create the environment file

Create a file named `.env` in the project root if it does not already exist.

Use the following contents:

```env
DATABASE_URL="postgresql://neondb_owner:npg_rJCtwo3dVS9Y@ep-crimson-fire-aegriel8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_rJCtwo3dVS9Y@ep-crimson-fire-aegriel8.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET='new_secret'
NEXTAUTH_URL='http://localhost:3000'
NEXT_PUBLIC_APP_URL='http://localhost:3000'
```

Important:

- `DATABASE_URL` uses the Neon pooler host
- `DIRECT_URL` uses the direct Neon host
- `DIRECT_URL` is required by Prisma
- `NEXTAUTH_SECRET` must be a long random secret in production

## 4) Review the Docker setup

The project already contains:

- [Dockerfile](Dockerfile)
- [docker-compose.yml](docker-compose.yml)

The Docker Compose file loads environment variables from `.env`, so you do not need to hardcode the secrets into the compose file.

## 5) Build the Docker image

From the project root, run:

```bash
docker compose build --progress=plain
```

Wait until the build finishes successfully.

## 6) Start the app

Run:

```bash
docker compose up
```

Or run rebuild + start in one command:

```bash
docker compose up --build
```

## 7) Open the app

Open the browser and go to:

```text
http://localhost:3000
```

Do not open `http://0.0.0.0:3000` in the browser. Use `localhost` instead.

## 8) Stop the app

To stop it:

```bash
docker compose down
```

To rebuild from scratch:

```bash
docker compose down -v
docker compose up --build
```

## 9) View logs

If the app does not start correctly, check the logs:

```bash
docker compose logs -f app
```

## 10) Common issues

### Prisma migration error

If Prisma complains about a migration already applied, run:

```bash
npx prisma migrate resolve --applied 20260105124049_add_updated_at_to_notice
```

Then restart Docker:

```bash
docker compose up --build
```

### App not reachable in browser

Use:

```text
http://localhost:3000
```

not:

```text
http://0.0.0.0:3000
```

### Missing DIRECT_URL error

Make sure `.env` includes:

```env
DIRECT_URL=...
```

This is required because Prisma schema uses:

```prisma
directUrl = env("DIRECT_URL")
```

## 11) Recommended final workflow for a teacher

From a fresh machine:

```bash
git clone <repository-url>
cd SmartNoticeBoard
copy .env.example .env
# or create .env manually with the values above
docker compose up --build
```

Then open:

```text
http://localhost:3000
```

## Notes

- The project is configured to use Neon PostgreSQL.
- Docker Compose reads the values from `.env` automatically.
- This setup is already working in the current environment.
