# Hallmark Manager Frontend

React frontend scaffold for the Django backend in this repository.

## Run locally

1. Install dependencies:
   - `npm install`
2. Create env file:
   - `copy .env.example .env`
3. Start dev server:
   - `npm run dev`

The frontend runs on `http://localhost:3000`.

## Environment

- `VITE_API_BASE_URL` defaults to `http://localhost:8000`

## Auth endpoints expected

- `POST /auth/login/`
- `POST /auth/logout/`
- `POST /auth/token/refresh/`
- `GET /auth/users/me/`

If your backend currently uses only Djoser JWT (`/auth/jwt/create/`), add the custom cookie auth endpoints first.
