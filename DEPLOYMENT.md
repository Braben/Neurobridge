# Deployment

This repository is split into two deployable apps:

- `frontend`: Next.js app for Vercel.
- `backend`: Express, Socket.IO, Prisma, and Postgres API for Render or Railway.

## Frontend on Vercel

Create a Vercel project with `frontend` as the root directory.

- Install command: `npm ci`
- Build command: `npm run build`
- Output: Vercel detects Next.js automatically

Environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain
```

## Backend on Render

The root `render.yaml` defines a Render web service using `backend` as `rootDir`.

- Build command: `npm ci && npm run build`
- Pre-deploy command: `npm run prisma:migrate:deploy`
- Start command: `npm start`
- Health check: `/api/v1/`

Set all required variables from `backend/.env.example`.

## Backend on Railway

Create a Railway service with `backend` as the root directory. The included
`backend/railway.json` sets the build, pre-deploy migration, and start commands.

Set all required variables from `backend/.env.example`.

## Cross-Domain Auth

When the frontend and backend are deployed on different domains, set:

```env
NODE_ENV=production
COOKIE_SAME_SITE=none
FRONTEND_URL=https://your-frontend-domain
CORS_ORIGINS=https://your-frontend-domain
```

For Vercel preview deployments, add each preview origin to `CORS_ORIGINS` as a
comma-separated list.

## Database

The backend uses Prisma with Postgres. Production deploys should run:

```sh
npm run prisma:migrate:deploy
```

Use a pooled, SSL-enabled `DATABASE_URL` when your Postgres provider recommends
one for serverless or hosted Node runtimes.
