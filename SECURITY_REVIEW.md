# Security review — TechAcademia

Review of the MERN app (React/Vite client, Express and MongoDB API) against the reported hypotheses and an OWASP Top 10 pass. Each item was checked in the code before it was treated as a finding. Severities describe impact on this app, including the access required to reach the bug.

The proving tests live in `server/tests/` and run with `cd server && npm test`.

## Threat model

**Assets.** Password hashes, session cookies, email and phone numbers, contact-form messages, and the ability to administer users.

**Actors.** An anonymous visitor, a signed-in user, an admin, and an attacker who can run script in a victim's browser or who has copied a cookie.

**Entry points.** `POST /api/auth/register` and `/login`, `POST /api/auth/refresh` and `/logout`, `GET /api/auth/user`, `POST /api/form/contact`, `GET /api/data/services`, and the `/api/admin` routes. The browser is the other side of that boundary.

**Trust boundaries.** The browser is untrusted. The API is the enforcement point. MongoDB is trusted only if it is not reachable from the internet and the connection string stays off the client. The JWT signing key is trusted only when it is private and at least 32 characters.

**Assumptions.** Production is served over HTTPS with `COOKIE_SECURE=true`. `TRUST_PROXY=1` is set only behind a reverse proxy this deployment controls. Admin accounts are created by setting `isAdmin` in the database, not through the profile form.

**Out of scope.** Cloud network rules, a WAF, social engineering, and a full penetration test of a deployed environment. `docker-compose.yml` is a local lab: MongoDB has no authentication and the JWT secret is a placeholder.

## Summary

| ID | Finding | Severity | Result |
|---|---|---|---|
| F1 | Admin update wrote `req.body` straight into MongoDB | High | Fixed |
| F2 | Controllers called `next` where it was not defined | Medium | Fixed |
| F3 | Current user was returned on `message`; the client read `userData` | Low | Fixed |
| F4 | Password pre-save hook re-hashed an unchanged password | Medium (latent) | Fixed |
| F5 | JWT returned to JavaScript and stored in `localStorage` | Medium | Fixed |
| F6 | Port and CORS origin were hardcoded | Low | Fixed |
| F7 | README said `require` was misspelt in the user model | Informational | Not reproduced |
| F8 | No rate limit on login or registration | Medium | Fixed |
| F9 | No security headers | Low | Fixed |
| F10 | Admin changes were not audited | Low | Fixed |
| F11 | Login errors and response time distinguished unknown users | Low | Fixed |
| F12 | Email uniqueness was only checked in the handler | Low | Fixed |
| F13 | Passwords longer than 72 bytes were silently truncated by bcrypt | Low | Fixed |
| F14 | JSON bodies had no size limit | Low | Fixed |
| F15 | Contact form accepted operator keys and unbounded text | Low | Fixed |
| F16 | Request bodies and user records were written to logs | Low | Fixed |
| F17 | A failed database connection exited with status 0 | Low | Fixed, no automated test |

## Findings

### F1 — Admin update wrote the request body into MongoDB

**Severity.** High. The route is behind the admin check, so an anonymous user cannot call it. An admin session, or any XSS that could use that session, could change any account.

**Vulnerable code.**

```js
const updatedUserData = req.body;
const updatedData = await User.updateOne(
  { _id: id },
  { $set: updatedUserData }
);
```

`updateOne` does not run the password pre-save hook, so a `password` field in the body was stored as plaintext. `isAdmin`, `tokenVersion`, and any other property were written as well. The edit form loaded the whole user document and posted it back, so the extra fields were on the wire even during a normal edit.

**Impact.** Account takeover of any user (the attacker chooses the new password and it is not hashed) and silent privilege changes.

**Fix.** The update schema is a strict Zod object of `username`, `email`, and `phone`. The handler builds a new object with only those three fields and never passes `req.body` to MongoDB. Registration already copied four named fields and forced `isAdmin: false`; it now also rejects unknown keys instead of ignoring them. Role changes still happen in the database, and the admin middleware reads `isAdmin` from the database on every request rather than from the token.

**Tests.**

- `does not persist isAdmin or password from the update body`
- `writes only username, email, and phone when the controller is called directly`
- `lets an admin update profile fields and blocks everyone else`
- `rejects registration that tries to set isAdmin`
- `checks isAdmin from the database on each request`

### F2 — Error handlers called `next` where it was not defined

**Severity.** Medium.

**Vulnerable code.** The admin handlers are declared `(req, res)` and the `catch` blocks call `next(error)`. `register` did this after it had already sent a response:

```js
} catch (error) {
  res.status(400).send({ msg: "page not found!!" });
  next(error);
}
```

The catalogue handler caught database errors, logged them, and never sent a response, so the request hung. An invalid user id on an admin route threw a `CastError`, which became a `ReferenceError` (`next is not defined`) inside an async function. On current Node.js that unhandled rejection can take the process down. The registration path needed a real database failure before it threw, so it was not an unauthenticated one-request crash, but the handler was still wrong.

**Impact.** A failed admin request or a failed registration could crash the API instead of returning an error. Catalogue failures never answered the client.

**Fix.** Handlers take `next` and forward errors with `return next(error)`. Routes are also wrapped in `asyncHandler`, so a rejected promise still reaches the error middleware. Unexpected 500s return `Internal server error` and are logged on the server. The old `"page not found!!"` body is gone. Validation failures still use status 422.

**Tests.**

- `returns JSON for an invalid user id and omits passwords from admin reads`
- `turns registration failures into an error response instead of crashing`
- `returns JSON when the catalogue query fails and serves stored courses`
- `validation errors still reach the error middleware`

### F3 — The logged-in user never loaded

**Severity.** Low. This is a broken feature, not a data leak.

**Vulnerable code.**

```js
return res.status(200).json({ message: userData });
```

The client did `setUser(data.userData)`. `userData` was undefined, and the context value did not include `user` anyway. The About greeting and the contact-form prefill that depended on it were commented out.

**Impact.** After login the UI had a token (see F5) but no profile. Prefill and any future `isAdmin` check on the client could not work.

**Fix.** `GET /api/auth/user` returns `{ userData }` with `_id`, `username`, `email`, `phone`, and `isAdmin`, and never a password. The client stores that object, shows the name on About, prefills the contact form, and shows the Admin link only when `isAdmin` is true. The admin pages are also gated in the layout. The server check remains the real control.

**Test.** `returns the current user as userData and does not put a token in the body`

### F4 — Unchanged passwords were hashed again

**Severity.** Medium, and latent. No current route calls `document.save()` after create. The admin update used `updateOne`, which skips this hook. The bug is in the hook itself: the next `save()` that does not change the password would lock the account.

**Vulnerable code.**

```js
if (!user.isModified("password")) {
  next();
}
const hash_password = await bcrypt.hash(user.password, saltRound);
user.password = hash_password;
```

There is no `return` after `next()`, so execution falls through and bcrypt hashes the existing hash. The hook is also `async` and uses `next()`, which is the combination Mongoose tells you not to use.

**Impact.** The stored password no longer matches the original, so login fails. Because the input is already a hash, the new value is a hash of a hash.

**Fix.** The hook returns immediately when `password` is not modified, and it throws instead of calling `next()`. Mongoose waits on the returned promise.

**Tests.**

- `stores a bcrypt hash and does not rehash when the password is unchanged`
- `checks isAdmin from the database on each request` (saves a user after changing only `isAdmin`, then logs in with the original password)

### F5 — JWTs were stored in localStorage

**Severity.** Medium. React does not inject HTML from user content today, but any future XSS could read `localStorage` and replay the token for 30 days. Logout could not revoke it.

**Vulnerable code.** Login and registration returned `token` in JSON. The client saved it with `localStorage.setItem("token", serverToken)` and sent `Authorization: Bearer`. `jwt.sign` used `expiresIn: "30d"` and `jwt.verify` did not pin the algorithm. The payload also carried `isAdmin`, which the middleware happened not to trust because it reloaded the user.

**Impact.** Token theft survives browser restart and cannot be revoked. A token signed with another HMAC algorithm would be accepted if the library's default algorithm list ever allowed it.

**Fix.** Login and registration set two cookies and do not return a token:

- `accessToken`: HS256 JWT, default 15 minutes, `HttpOnly`, `Path=/`
- `refreshToken`: 32 random bytes, only the SHA-256 hash is stored, default 7 days, `HttpOnly`, `Path=/api/auth`

Refresh rotates the refresh token. Replaying a rotated token revokes the rest of that user's refresh tokens. Logout revokes the presented refresh token and clears both cookies. Verification accepts only `HS256`. The access token carries `userId` and `tokenVersion`, not the role. `SameSite=None` is forced back to `Lax` unless `COOKIE_SECURE=true`.

Cookie sessions need a CSRF control. Unsafe requests that already have a `Cookie` header must send an `Origin` on `CLIENT_ORIGIN`, and the `X-CSRF-Token` header must match the `csrfToken` cookie. That cookie is not `HttpOnly`, so the page can read it on the same origin; login, refresh, and `GET /api/auth/user` also return the value for a split frontend. Browsers set `Origin` and script on another site cannot read the cookie or the token. A non-browser client that has already stolen both can still call the API.

**Residual.** `HttpOnly` stops a script from reading the token. It does not stop a script already running on this origin from calling the API. After logout, a copied access token still works until it expires (15 minutes by default). The refresh token does not.

**Tests.**

- `returns the current user as userData and does not put a token in the body`
- `rotates refresh tokens and revokes the family when a used token is replayed`
- `logout clears the session cookie`
- `rejects access tokens that are not HS256`
- `rejects an expired access token`
- `sets the secure cookie flag when COOKIE_SECURE=true and refuses SameSite=None without it`
- `rejects cookie-authenticated mutations that omit a configured origin`
- `rejects a session that omits the CSRF header`

### F6 — Port and CORS origin were hardcoded

**Severity.** Low.

**Vulnerable code.** `origin: "http://localhost:5173"` and `const PORT = 5000`. The allowed methods were a single string with stray spaces. The client called `http://localhost:5000` from every page.

**Impact.** A second frontend origin, another port, or a deployed host required a code change. A typo in the method list could drop `PUT` or `DELETE` from CORS.

**Fix.** `PORT`, `CLIENT_ORIGIN` (comma-separated), cookie flags, bcrypt cost, rate limits, and `TRUST_PROXY` come from the environment. See `server/.env.example` and `client/.env.example`. Unknown browser origins do not receive `Access-Control-Allow-Origin`. The dev server proxies `/api` to the API so the browser stays on one origin. Docker uses the same idea through nginx.

**Tests.**

- `reflects only configured CORS origins`
- `refuses to boot when the JWT secret is missing or short`

### F7 — README said `require` was misspelt

**Severity.** Informational. Not a bug.

The user schema already uses `required: true` (commit `116e849`). The README still listed the spelling fix as planned work. The note is removed. A save without the required fields still fails validation.

**Test.** `still requires username, email, phone, and password`

### F8 — Login and registration were not rate limited

**Severity.** Medium.

**Impact.** The login endpoint can be used for online password guessing. Nothing slowed repeated attempts, and a missing user returned faster than a user whose password was checked with bcrypt (see F11).

**Fix.** `express-rate-limit` is mounted on every API router. Login and registration use a tighter limiter: 10 requests per 15 minutes per IP (`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_WINDOW_MS`). Other routes use `RATE_LIMIT_API_MAX` (default 300). The contact form also has its own cap (default 20). The test suite raises the caps so the other tests can run, and a separate app mounts the same helper with `max: 2` to prove the 429.

**Tests.**

- `rate limits repeated auth attempts`
- `attaches a rate limit to the real login route`

Do not set `TRUST_PROXY=1` on a server that is exposed directly. Clients could spoof `X-Forwarded-For` and each get a fresh limit. The compose file sets it because nginx is in front, and it says so.

### F9 — No security headers

**Severity.** Low for a JSON API. Still worth setting so a browser that renders a response cannot treat it as a friendly page.

**Fix.** `helmet` is enabled, with `Cross-Origin-Resource-Policy: cross-origin` so a frontend on another origin can still read credentialed responses.

**Test.** `sends baseline security headers` (`X-Content-Type-Options: nosniff`, plus a framing control).

### F10 — Admin actions were not recorded

**Severity.** Low (OWASP A09). There was no way to see who changed or deleted a user or a message.

**Fix.** Successful user updates, user deletes, and contact deletes append an audit document: actor id and email, action, target type and id, IP, and the names of the fields that were written. Passwords, tokens, and cookie values are stripped if they are ever passed in metadata. `GET /api/admin/audit` returns the latest 100 rows to an admin, and the admin UI has an Audit page. Deleting a user also deletes that user's refresh tokens. An admin cannot delete their own account while that session is signed in.

**Tests.**

- `records user and contact deletes and refuses self-deletion`
- `strips sensitive keys before they can be stored on an audit event`
- the direct update test asserts the audit row has no password

### F11 — Login disclosed whether the email existed

**Severity.** Low.

**Vulnerable code.** An unknown email returned 400 `"Invalid Credentials"`. A known email with a bad password returned 401 `"Invalid email or password "` (trailing space included). The unknown-email path also skipped `bcrypt.compare`, so it was faster.

**Fix.** Both cases return 401 and the body `{ message: "Invalid email or password" }`. The unknown-email path still runs a compare against a dummy hash so the work is similar. Registration still returns 409 when the email is taken. That is a deliberate usability tradeoff and it remains an enumeration hint.

**Test.** `uses the same error for an unknown email and a wrong password`

### F12 — Email uniqueness raced

**Severity.** Low.

The handler checked `findOne` and then `create`. Two parallel registrations could both pass the check. The schema did not declare `unique` on `email`.

**Fix.** `email` is unique, trimmed, and stored in lower case. A duplicate key from the database becomes HTTP 409. Login accepts either casing.

**Tests.**

- `rejects a duplicate email from the API and from the unique index`
- `registers a normal user as non-admin and accepts a differently cased login`

### F13 — bcrypt silently ignored characters after the first 72 bytes

**Severity.** Low.

**Vulnerable code.** The password schema allowed up to 1024 characters. bcrypt only uses the first 72 bytes, so two different long passwords could verify as the same password, and the user would not know.

**Fix.** The schema rejects passwords longer than 72 characters. The hash cost is `BCRYPT_SALT_ROUNDS` (default 10, allowed range 4–15). Tests use 4 so the suite stays fast. That value must not be used in production.

**Test.** `rejects a password longer than 72 characters`

### F14 — JSON bodies were unbounded

**Severity.** Low.

`express.json()` with no limit will buffer a very large body. Combined with F13, a multi-megabyte password was also a CPU cost inside bcrypt.

**Fix.** The parser limit is `100kb`. Larger payloads get 413.

**Test.** `rejects oversized JSON bodies`

### F15 — Contact messages were not validated

**Severity.** Low.

`Contact.create(req.body)` relied on Mongoose's default strict mode to drop unknown fields. Keys such as `$gt` were not rejected before they reached the driver, and `message` had no maximum length. React text nodes escape the stored message, so this was not stored XSS in the current admin page. It was still an injection and storage bug.

**Fix.** A strict Zod schema allows only `username`, `email`, and `message` (message max 2,000 characters). A separate middleware rejects `$`, `.`, `__proto__`, `constructor`, and `prototype` anywhere in `body`, `query`, or `params`. The handler copies the three fields explicitly.

**Test.** `rejects operator keys on the contact form and accepts a normal message`

### F16 — Logs contained personal data and could contain passwords

**Severity.** Low.

`GET /` logged `req.body`. The admin user list logged every user. The login and registration pages logged the form state, including the password, to the browser console. The database helper logged `error.message`, which for a failed MongoDB connection can include the URI and therefore the password.

**Fix.** Those logs are gone. Connection failures log the error name and exit 1 (F17). Login is covered by a test that spies on `console.log`.

**Test.** `does not write passwords to the server log during login`

### F17 — Database failure exited successfully

**Severity.** Low.

`connectDb` called `process.exit(0)` after a failed connection, so a process supervisor would treat the crash as a clean shutdown.

**Fix.** Missing `MONGODB_URI` and a failed connection both exit with status 1, and the driver message is not printed. There is no automated test: asserting `process.exit` against the shared Mongoose connection would disturb the rest of the suite. `assertEnv()` is tested for a short JWT secret.

## Controls that already held

These were checked and left in place, with tests where a regression would be easy:

- Registration did not pass `req.body` to `User.create`. `isAdmin` could not be set by a normal signup. The schema is now strict as well.
- `/api/admin` already ran `authMiddleware` and then `adminMiddleware`. A normal user receives 403. The role is loaded from MongoDB, not from the JWT claim.
- Login and registration already ran Zod before the handlers, so email and password were strings rather than query operators.
- Admin user queries already projected `password` out. Responses now go through `publicUser` as well, and the field is `select: false`.
- The client renders contact messages and names as React text, not `dangerouslySetInnerHTML`.

## Other defects fixed with the security work

- `GET /api/admin/users ` had a trailing space, so the user table requested a path that does not exist.
- The contact admin page set `methods: "GET"` instead of `method`. Fetch still defaulted to GET, so the page worked by accident.
- An empty user or contact list returned 404, and the client then called `.map` on an error object.
- The service list is returned as `{ services, msg }` so the existing client key keeps working. The client prefers `services`.

## Dependency audit

`npm audit --audit-level=high` passes for `server/` and `client/`. Production issues that the audit reported were removed by upgrading `bcrypt` to 6 (this drops the vulnerable `tar` / `node-pre-gyp` install chain), `zod` to 4, `vite` to 8, and `react-router-dom` to 7. React Router 7 also clears open-redirect advisories in the 6.x line. The app does not pass user input to `navigate`.

Jest still depends on `deepmerge`, which has a low prototype-pollution advisory and no fix that keeps Jest 29. It is a dev dependency, it is not in the production image, and the CI audit gate fails on high and critical only. Downgrading Jest to 25 to silence it would be a worse tradeoff.

## What remains

- An XSS bug on this origin could still perform actions with the cookie. `HttpOnly` limits theft, not use.
- A stolen access token works until it expires. Logout revokes the refresh token and clears the cookies the browser will send.
- Registration returns a distinct 409 when the email exists.
- Rate limiting is per IP. A shared NAT shares one bucket. `TRUST_PROXY` must stay off unless the proxy is trusted.
- The compose stack is for a laptop. It is not a production deployment.
