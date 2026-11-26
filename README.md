# Evidencija realizacije projekata - back-end

Node.js + Express + TypeScript + MySQL/MariaDB.

## Pokretanje
1. `npm install`
2. Kopiraj `.env.example` u `.env` i podesi DB podatke i `JWT_SECRET`.
3. Uvezi bazu: `mysql -u root -p < sql/schema.sql`
4. `npm run dev` (razvoj) ili `npm run build && npm start`

Front-end build (React) kopira se u folder `public/` i servira staticki.

## API (JWT: header `Authorization: Bearer <token>`)
- POST /api/auth/register, POST /api/auth/login
- GET/POST /api/projekti
- GET/POST /api/projekti/:id/clanovi
- GET/POST /api/projekti/:id/zadaci
- PATCH /api/zadaci/:id (admin), PATCH /api/zadaci/:id/status (dodeljeni clan, samo unapred)
