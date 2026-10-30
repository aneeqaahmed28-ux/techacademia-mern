const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../app");
const User = require("../models/user-model");
const RefreshToken = require("../models/refresh-token-model");
const { hashToken } = require("../utils/tokens");
const { accessCookieOptions } = require("../utils/cookies");
const { connectTestDb, clearTestDb, disconnectTestDb } = require("./db");
const { ORIGIN, cookieHeader, cookieValue, createUser } = require("./helpers");

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

function registration(overrides = {}) {
  return {
    username: "newstudent",
    email: "newstudent@example.com",
    phone: "1234567890",
    password: "password123",
    ...overrides,
  };
}

describe("auth sessions", () => {
  test("returns the current user as userData and does not put a token in the body", async () => {
    const password = "password123";
    const user = await createUser({ email: "profile@example.com", password });

    const login = await request(app)
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: user.email, password });

    expect(login.status).toBe(200);
    expect(login.body.token).toBeUndefined();
    expect(login.body.userData.email).toBe(user.email);
    expect(login.body.userData.password).toBeUndefined();
    const rawRefresh = cookieValue(login.headers["set-cookie"], "refreshToken");
    expect(rawRefresh).toBeTruthy();
    expect(JSON.stringify(login.body)).not.toContain(rawRefresh);

    const cookies = login.headers["set-cookie"];
    const accessCookie = cookies.find((entry) => entry.startsWith("accessToken="));
    const refreshCookie = cookies.find((entry) => entry.startsWith("refreshToken="));
    expect(accessCookie).toMatch(/HttpOnly/i);
    expect(accessCookie).toMatch(/SameSite=Lax/i);
    expect(accessCookie).toMatch(/Path=\/;/);
    expect(accessCookie).not.toMatch(/;\s*Secure/i);
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/Path=\/api\/auth/i);
    const csrfCookie = cookies.find((entry) => entry.startsWith("csrfToken="));
    expect(csrfCookie).toBeTruthy();
    expect(csrfCookie).not.toMatch(/HttpOnly/i);

    const me = await request(app)
      .get("/api/auth/user")
      .set("Cookie", cookieHeader(cookies));
    expect(me.status).toBe(200);
    expect(me.body.userData).toMatchObject({
      email: user.email,
      username: user.username,
      isAdmin: false,
    });
    expect(me.body.userData.password).toBeUndefined();
    expect(me.body.message).toBeUndefined();

    const stored = await RefreshToken.findOne({ user: user._id });
    expect(stored.tokenHash).toBe(hashToken(rawRefresh));
    expect(stored.tokenHash).not.toBe(rawRefresh);
  });

  test("rejects registration that tries to set isAdmin", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...registration(), isAdmin: true });

    expect(response.status).toBe(422);
    expect(response.body.extraDetails).toMatch(/isAdmin/);
    expect(await User.findOne({ email: "newstudent@example.com" })).toBeNull();
  });

  test("registers a normal user as non-admin and accepts a differently cased login", async () => {
    const created = await request(app)
      .post("/api/auth/register")
      .send(registration({ email: "CaseUser@Example.com" }));

    expect(created.status).toBe(201);
    expect(created.body.token).toBeUndefined();
    expect(created.body.userData.isAdmin).toBe(false);
    expect(created.headers["set-cookie"].join("")).toMatch(/HttpOnly/i);

    const stored = await User.findOne({ email: "caseuser@example.com" });
    expect(stored).not.toBeNull();
    expect(stored.isAdmin).toBe(false);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "caseuser@example.com", password: "password123" });
    expect(login.status).toBe(200);
  });

  test("uses the same error for an unknown email and a wrong password", async () => {
    await createUser({ email: "known@example.com", password: "password123" });
    const compare = jest.spyOn(bcrypt, "compare");

    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "missing@example.com", password: "password123" });
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: "known@example.com", password: "password1234" });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(unknown.body.message).toBe("Invalid email or password");
    expect(compare).toHaveBeenCalled();
  });

  test("does not write passwords to the server log during login", async () => {
    const logs = [];
    jest.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.map(String).join(" "));
    });
    await createUser({ email: "quiet@example.com", password: "password123" });

    await request(app)
      .post("/api/auth/login")
      .send({ email: "quiet@example.com", password: "password123" });

    expect(logs.join("\n")).not.toContain("password123");
  });

  test("rejects a password longer than 72 characters", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(registration({ password: "a".repeat(73) }));

    expect(response.status).toBe(422);
    expect(response.body.extraDetails).toMatch(/72/);
  });

  test("rejects a duplicate email from the API and from the unique index", async () => {
    const first = await request(app).post("/api/auth/register").send(registration());
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/auth/register").send(registration());
    expect(second.status).toBe(409);

    await expect(
      User.create({
        username: "anothername",
        email: "newstudent@example.com",
        phone: "1234567890",
        password: "password123",
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  test("rotates refresh tokens and revokes the family when a used token is replayed", async () => {
    const user = await createUser({ email: "refresh@example.com", password: "password123" });
    const login = await request(app)
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: user.email, password: "password123" });
    const firstCookies = login.headers["set-cookie"];

    const refreshed = await request(app)
      .post("/api/auth/refresh")
      .set("Origin", ORIGIN)
      .set("X-CSRF-Token", cookieValue(firstCookies, "csrfToken"))
      .set("Cookie", cookieHeader(firstCookies));
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.userData.email).toBe(user.email);

    const me = await request(app)
      .get("/api/auth/user")
      .set("Cookie", cookieHeader(refreshed.headers["set-cookie"]));
    expect(me.status).toBe(200);

    const replay = await request(app)
      .post("/api/auth/refresh")
      .set("Origin", ORIGIN)
      .set("X-CSRF-Token", cookieValue(firstCookies, "csrfToken"))
      .set("Cookie", cookieHeader(firstCookies));
    expect(replay.status).toBe(401);

    const afterReuse = await request(app)
      .post("/api/auth/refresh")
      .set("Origin", ORIGIN)
      .set("X-CSRF-Token", cookieValue(refreshed.headers["set-cookie"], "csrfToken"))
      .set("Cookie", cookieHeader(refreshed.headers["set-cookie"]));
    expect(afterReuse.status).toBe(401);
  });

  test("logout clears the session cookie", async () => {
    const user = await createUser({ email: "bye@example.com", password: "password123" });
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: user.email, password: "password123" });
    expect(login.status).toBe(200);

    const logout = await agent
      .post("/api/auth/logout")
      .set("Origin", ORIGIN)
      .set("X-CSRF-Token", cookieValue(login.headers["set-cookie"], "csrfToken"));
    expect(logout.status).toBe(200);

    const me = await agent.get("/api/auth/user");
    expect(me.status).toBe(401);
  });

  test("rejects access tokens that are not HS256", async () => {
    const user = await createUser({ email: "alg@example.com" });
    const token = jwt.sign(
      { userId: user._id.toString(), tokenVersion: 0 },
      process.env.JWT_SECRET_KEY,
      { algorithm: "HS384", expiresIn: "15m" }
    );

    const response = await request(app)
      .get("/api/auth/user")
      .set("Cookie", `accessToken=${token}`);

    expect(response.status).toBe(401);
  });

  test("rejects an expired access token", async () => {
    const user = await createUser({ email: "expired@example.com" });
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        tokenVersion: 0,
        exp: Math.floor(Date.now() / 1000) - 10,
      },
      process.env.JWT_SECRET_KEY,
      { algorithm: "HS256" }
    );

    const response = await request(app)
      .get("/api/auth/user")
      .set("Cookie", `accessToken=${token}`);

    expect(response.status).toBe(401);
  });

  test("sets the secure cookie flag when COOKIE_SECURE=true and refuses SameSite=None without it", () => {
    const previousSecure = process.env.COOKIE_SECURE;
    const previousSameSite = process.env.COOKIE_SAMESITE;

    process.env.COOKIE_SECURE = "true";
    process.env.COOKIE_SAMESITE = "none";
    expect(accessCookieOptions()).toMatchObject({ httpOnly: true, secure: true, sameSite: "none" });

    process.env.COOKIE_SECURE = "false";
    process.env.COOKIE_SAMESITE = "none";
    expect(accessCookieOptions().sameSite).toBe("lax");
    expect(accessCookieOptions().secure).toBe(false);

    process.env.COOKIE_SECURE = previousSecure;
    process.env.COOKIE_SAMESITE = previousSameSite;
  });
});
