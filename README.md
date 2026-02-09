# ORFS Migration Guide

## Overview

This directory contains the proposed architecture for migrating the legacy PHP/Flask system to a modern stack using NestJS, Next.js, Hono, and Cloudflare services.

## Structure

- `nest-backend/`: The main API gateway and business logic (NestJS).
- `next-frontend/`: The modern dashboard and UI (Next.js 14).
- `hono-benchmark/`: High-performance microservices for data processing (Hono).
- `db/`: Database schema and migration scripts (Drizzle ORM).

## 1. Database Migration (D1 + Drizzle)

The database schema has been ported to TypeScript/Drizzle in `db/schema.ts`.

### Steps:
1. Initialize a D1 database: `npx wrangler d1 create orfs-db`
2. Generate SQL migrations: `npx drizzle-kit generate:sqlite`
3. Apply migrations: `npx wrangler d1 migrations apply orfs-db`
4. Run the data migration script (to be created) to move data from MySQL to D1.

## 2. Backend (NestJS on Cloudflare Workers)

Located in `nest-backend/`.

- **Auth**: JWT strategy implemented in `src/auth/`.
- **Validation**: Global validation pipe enabled.
- **Deploy**: `npm run deploy` (uses Wrangler).

## 3. Frontend (Next.js 14 on Cloudflare Pages)

Located in `next-frontend/`.

- **UI**: Uses Tailwind CSS.
- **Components**: Ready for shadcn/ui.
- **Deploy**: `npm run deploy` (builds via `@cloudflare/next-on-pages`).

## 4. Microservices (Hono)

Located in `hono-benchmark/`.

- Replaces Flask microservices.
- Optimized for cold starts and edge execution.
- **Deploy**: `npm run deploy`.

## CI/CD

A GitHub Actions workflow is provided in `.github/workflows/deploy.yml` to automate deployment to Cloudflare.
