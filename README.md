# TechAcademia

A MERN stack web app with user registration and login, a contact form, a course catalogue and an admin dashboard. Built while following the "MERN Stack in Hindi" course by Thapa Technical, then extended by me.

> **My own additions:** [Write what you changed or added beyond the tutorial, in your own words. If you added nothing yet, delete this line and say so in interviews.]

## Features

- **Registration and login** with JWT authentication (tokens last 30 days)
- **Passwords hashed with bcrypt** before they are saved
- **Input validation** on the server with zod
- **Contact form** that saves messages to MongoDB
- **Course catalogue** (Services page) that reads from the database. Each course has a name, category, level, duration and instructor.
- **Admin dashboard** at `/admin`: view, edit and delete users, and view and delete contact messages
- **Protected admin API:** every `/api/admin` route runs an authentication check and then an admin check on the server

## Tech stack

| Part | Tools |
|---|---|
| Frontend | React 18, Vite, React Router, React Toastify |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Security | bcrypt, jsonwebtoken, zod, cors |

## How it works

```text
React (localhost:5173)  →  Express API (localhost:5000)  →  MongoDB
```

| API prefix | Purpose |
|---|---|
| `/api/auth` | Register, login, current user |
| `/api/form` | Contact form |
| `/api/data` | Course catalogue |
| `/api/admin` | Admin: users and contacts (token and admin role required) |

## Run it locally

Requires Node.js 22 or newer and a MongoDB database (a free MongoDB Atlas cluster works).

```bash
git clone https://github.com/aneeqaahmed28-ux/techacademia-mern.git
cd techacademia-mern

# Backend
cd server
npm install
# create server/.env using .env.example, then:
node server.js

# Frontend (second terminal)
cd client
npm install
npm run dev
```

Open http://localhost:5173.

### Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. Never commit it. |
| `JWT_SECRET_KEY` | Secret used to sign login tokens. Never commit it. |

### Creating an admin and sample courses

- Register a user in the app, then in MongoDB set that user's `isAdmin` field to `true`. Log out and back in, then open `/admin`.
- Add courses to the `services` collection, with the fields `name`, `category`, `level`, `duration` and `instructor`.

## Known limitations and planned improvements

- Not deployed yet, so it runs locally only.
- The port (5000) and the allowed frontend address are hardcoded in the server.
- Course images are static in the React page and are not stored in the database.
- No automated tests.
- Small fixes planned in the user model (the `require` option should be spelled `required`).

## Licence

[Choose one if you want to add it, or remove this section.]
