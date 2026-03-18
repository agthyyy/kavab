# Kavabanga Learning Platform — Backend

Node.js + Express + TypeScript REST API for the Kavabanga Learning Platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **Language**: TypeScript 5
- **Database**: PostgreSQL 15+ via `knex`
- **Auth**: JWT (access + refresh tokens), bcryptjs
- **Media / Push**: Firebase Admin SDK (Storage + FCM)
- **Testing**: Jest + Supertest + fast-check (property-based)

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- (Optional) Firebase project with Storage and FCM enabled

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

Key variables:

| Variable | Description |
|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (min 32 chars) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name |

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE kavabanga;"
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Start development server

```bash
npm run dev
```

The server starts on `http://localhost:3000` (or `PORT` from `.env`).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with hot-reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled build |
| `npm test` | Run all tests (Jest) |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:rollback` | Rollback last migration batch |

## Running Tests

Tests use a separate database (`kavabanga_test`). Create it first:

```bash
psql -U postgres -c "CREATE DATABASE kavabanga_test;"
NODE_ENV=test npm run migrate
```

Then run:

```bash
npm test
```

Property-based tests use `fast-check` with a minimum of 100 iterations per property.

## Project Structure

```
src/
├── config/         # env, database, firebase config
├── db/
│   └── migrations/ # knex migrations (one file per table)
├── routes/         # Express routers
├── controllers/    # Request handlers
├── services/       # Business logic
├── repositories/   # DB access layer
├── middleware/     # Auth, validation, error handling
├── jobs/           # Cron jobs
├── test/           # Test setup and shared helpers
├── app.ts          # Express app factory
└── index.ts        # Server entry point
```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Storage** and **Cloud Messaging**
3. Go to Project Settings → Service Accounts → Generate new private key
4. Save the JSON file and set `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`
5. Set `FIREBASE_STORAGE_BUCKET` to your bucket name (e.g. `your-project.appspot.com`)

Alternatively, set `FIREBASE_SERVICE_ACCOUNT_BASE64` to the base64-encoded JSON content.
