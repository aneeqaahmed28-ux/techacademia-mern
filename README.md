# TechAcademia

A MERN stack web app with user registration and login, a contact form, a course catalogue and an admin dashboard. Built while following the "MERN Stack in Hindi" course by Thapa Technical, then extended as a secure-coding case study.

The review, with each finding, the fix, and the test that proves it, is in [SECURITY_REVIEW.md](SECURITY_REVIEW.md).

## Features

- **Registration and login** with short-lived access tokens and rotating refresh tokens, stored in `HttpOnly` cookies
- **Passwords hashed with bcrypt** before they are saved, and not hashed again when something else on the user changes
- **Input validation** on the server with Zod, including a strict allow-list on admin user edits
- **Contact form** that saves messages to MongoDB
- **Course catalogue** (Services page) that reads from the database. Each course has a name, category, level, duration and instructor
- **Admin dashboard** at `/admin`: view, edit and delete users, view and delete contact messages, and read an audit log of those changes
- **Protected admin API:** every `/api/admin` route checks the session and then checks `isAdmin` from the database

## Tech stack

| Part | Tools |
|---|---|
| Frontend | React 18, Vite, React Router, React Toastify |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Security | bcrypt, JSON Web Tokens in `HttpOnly` cookies, Zod, Helmet, express-rate-limit, CORS |
| Tests | Jest, Supertest, mongodb-memory-server |
| CI | GitHub Actions: tests, `npm audit`, CodeQL, Gitleaks |

## How it works

```text
React (localhost:5173)  →  Express API (localhost:5000)  →  MongoDB
```

In development the Vite server proxies `/api` to the API, so the browser talks to one origin and the session cookies are first-party. Set `VITE_API_URL` only if the client should call the API host directly.

| API prefix | Purpose |
|---|---|
| `/api/auth` | Register, login, refresh, logout, current user |
| `/api/form` | Contact form |
| `/api/data` | Course catalogue |
| `/api/admin` | Admin: users, contacts, and the audit log (session and admin role required) |
| `/api/health` | Process is up |

## Run it locally

Requires Node.js 22 or newer and a MongoDB database (a free MongoDB Atlas cluster works, or the Docker Compose stack below).

```bash
git clone https://github.com/aneeqaahmed28-ux/techacademia-mern.git
cd techacademia-mern

# Backend
cd server
npm install
cp .env.example .env
# set MONGODB_URI and a JWT_SECRET_KEY of at least 32 characters, then:
npm start

# Frontend (second terminal)
cd client
npm install
npm run dev
```

Open http://localhost:5173.

Generate a signing key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment variables

Server (`server/.env`, copied from `server/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | API port. Defaults to 5000. |
| `MONGODB_URI` | MongoDB connection string. Never commit it. |
| `JWT_SECRET_KEY` | Secret used to sign access tokens. At least 32 characters. Never commit it. |
| `JWT_ACCESS_EXPIRES` | Access-token lifetime, for example `15m`. |
| `JWT_REFRESH_EXPIRES_DAYS` | Refresh-token lifetime in days (1–30, default 7). |
| `CLIENT_ORIGIN` | Comma-separated browser origins allowed to call the API with cookies. |
| `COOKIE_SECURE` | `true` in production (HTTPS). |
| `COOKIE_SAMESITE` | `lax`, `strict`, or `none`. `none` requires `COOKIE_SECURE=true`. |
| `BCRYPT_SALT_ROUNDS` | Hash cost. Use 10 or more outside tests. |
| `RATE_LIMIT_WINDOW_MS` | Window for login, registration, and the contact form. |
| `RATE_LIMIT_AUTH_MAX` | Attempts allowed per IP in that window for login and registration. |
| `RATE_LIMIT_CONTACT_MAX` | Contact-form submissions per IP in that window. |
| `TRUST_PROXY` | Set to `1` only behind a reverse proxy you control. |

Client (`client/.env`, copied from `client/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Leave empty to use same-origin `/api`. Set a full origin, such as `http://localhost:5000`, to call the API directly. |

### Tests

```bash
cd server
npm test
```

The suite starts an in-memory MongoDB. It covers the admin mass-assignment fix, the password hook, cookie sessions, refresh-token reuse, rate limiting, security headers, and the error handler.

### Docker

`docker-compose.yml` builds the API and the client and starts MongoDB. It is a local lab: the database has no authentication, and the JWT secret falls back to a placeholder unless you set `JWT_SECRET_KEY` in the environment. Do not publish those ports on a public host.

```bash
export JWT_SECRET_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
docker compose up --build
```

The site is at http://localhost:8080. The API is also mapped to port 5000 for debugging.

### Creating an admin and sample courses

- Register a user in the app, then in MongoDB set that user's `isAdmin` field to `true`. Reload the app. The API reads `isAdmin` from the database on each request, so a new login is not required. Open `/admin`.
- The profile edit form cannot change `isAdmin` or the password. That is intentional.
- Add courses to the `services` collection, with the fields `name`, `category`, `level`, `duration` and `instructor`.

## Security

Sessions are `HttpOnly` cookies. The access token lasts 15 minutes by default. The refresh token is stored only as a hash, rotates on use, and is revoked on logout and on reuse. Login and registration are rate limited. Helmet sets the baseline response headers. Admin edits allow only `username`, `email`, and `phone`, and successful admin deletes and edits are written to an audit log.

Before production:

- Serve the site over HTTPS and set `COOKIE_SECURE=true`.
- Use a unique `JWT_SECRET_KEY` and a MongoDB user that is not an admin of the cluster.
- Leave `TRUST_PROXY` unset unless a reverse proxy you trust is the only way to reach the API.
- Do not commit `.env` files. Gitleaks runs in CI for that class of mistake.

Details, including what was already safe and what is still true after these changes, are in [SECURITY_REVIEW.md](SECURITY_REVIEW.md).

## Known limitations

- Not deployed yet. The app runs locally, including through Docker Compose.
- Course images are static in the React page and are not stored in the database.
- A stolen access token remains valid until it expires. Logout revokes the refresh token and clears the cookies the browser will send.
- Registration tells the user when an email is already registered.

## Licence

[Choose one if you want to add it, or remove this section.]
