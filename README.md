# DODOMA MAKULU SDA CHURCH

Project structure:

- `Frontend/` - React + Vite + TypeScript client
- `Backend/` - Node.js + Express + TypeScript API

Quick start:

1. Frontend:
   - `cd Frontend`
   - `npm install`
   - `npm run dev`
2. Backend:
   - `cd Backend`
   - `npm install`
   - `npm run dev`

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`

## Environment Variables

Frontend (`Frontend/.env`):

- `VITE_API_BASE_URL=` (acha tupu kama frontend/backend zipo same domain, au weka URL kamili ya backend mfano `https://api.domain.com/api`)
- `VITE_DEV_API_TARGET=http://localhost:5001` (hutumika na Vite proxy local dev)
- `VITE_SITE_URL=https://dodomamakulusda.org`

Backend (`Backend/.env`):

- `PORT=5001`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:5173`
- `FRONTEND_URLS=http://localhost:5173,https://dodomamakulusda.org` (comma-separated origins zinazoruhusiwa CORS)
- `JWT_ACCESS_SECRET=replace-with-strong-access-secret`
- `JWT_REFRESH_SECRET=replace-with-strong-refresh-secret`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `MAX_LOGIN_ATTEMPTS=5`
- `ACCOUNT_LOCK_MINUTES=15`
- `API_CACHE_TTL_MS=30000`

## Admin Login (Seed Users)

- Super Admin: `superadmin@makulu.org` / `Admin@123`
- Admin: `admin@makulu.org` / `Admin@123`
- Editor: `editor@makulu.org` / `Admin@123`

## API Overview

Auth:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Public:

- `GET /api/public/site-settings`
- `GET /api/public/announcements/active`
- `GET /api/public/departments`
- `GET /api/public/departments/:departmentId`
- `GET /api/public/leaders`
- `GET /api/public/groups`
- `GET /api/public/reports`

Admin (JWT + RBAC):

- `GET /api/admin/dashboard`
- `GET/PUT /api/admin/site-settings`
- `CRUD /api/admin/departments`
- `CRUD /api/admin/leaders`
- `CRUD /api/admin/groups`
- `CRUD /api/admin/reports` + attachments download
- `CRUD /api/admin/announcements`
- `CRUD /api/admin/users`

## Build

Frontend production build:

- `cd Frontend`
- `npm run build`

Backend production build:

- `cd Backend`
- `npm run build`
- `npm start`

## Connection Checklist (Frontend <-> Backend)

1. Local dev:
   - Backend: `http://localhost:5001`
   - Frontend: `http://localhost:5173`
   - `VITE_DEV_API_TARGET=http://localhost:5001`
   - `FRONTEND_URLS` iwe na `http://localhost:5173`
2. Production same domain/reverse proxy:
   - Acha `VITE_API_BASE_URL` tupu (frontend itatumia `/api`)
   - Hakikisha reverse proxy inapeleka `/api` na `/uploads` kwenda backend
3. Production tofauti domains:
   - Weka `VITE_API_BASE_URL=https://backend-domain/api`
   - Weka `FRONTEND_URLS=https://frontend-domain`
