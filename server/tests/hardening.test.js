const express = require("express");
const request = require("supertest");
const app = require("../app");
const User = require("../models/user-model");
const Contact = require("../models/contact-model");
const Service = require("../models/service-model");
const { createAuthLimiter } = require("../middlewares/rate-limit");
const { assertEnv } = require("../config/env");
const { connectTestDb, clearTestDb, disconnectTestDb } = require("./db");
const { ORIGIN, createAdmin, loginAgent } = require("./helpers");

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("platform hardening", () => {
  test("sends baseline security headers", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(
      response.headers["x-frame-options"] || response.headers["content-security-policy"]
    ).toBeTruthy();
  });

  test("reflects only configured CORS origins", async () => {
    const evil = await request(app).get("/api/health").set("Origin", "http://evil.example");
    expect(evil.headers["access-control-allow-origin"]).toBeUndefined();

    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("rate limits repeated auth attempts", async () => {
    const limited = express();
    limited.use(express.json());
    limited.post("/login", createAuthLimiter({ max: 2 }), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const agent = request(limited);
    expect((await agent.post("/login").send({})).status).toBe(200);
    expect((await agent.post("/login").send({})).status).toBe(200);
    const blocked = await agent.post("/login").send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many attempts/);
  });

  test("attaches a rate limit to the real login route", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(response.status).toBe(401);
    const limit =
      response.headers["ratelimit-limit"] ||
      response.headers["ratelimit-policy"] ||
      response.headers["ratelimit"];
    expect(limit).toBeDefined();
  });

  test("rejects oversized JSON bodies", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send({ email: "a@example.com", password: "p".repeat(200 * 1024) });

    expect(response.status).toBe(413);
  });

  test("rejects cookie-authenticated mutations that omit a configured origin", async () => {
    const admin = await createAdmin();
    const { agent } = await loginAgent(app, admin.email, "adminpass1");

    const response = await agent.post("/api/auth/logout");
    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/origin/i);

    const allowed = await agent.post("/api/auth/logout").set("Origin", ORIGIN);
    expect(allowed.status).toBe(200);
  });

  test("turns registration failures into an error response instead of crashing", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(User, "create").mockRejectedValueOnce(new Error("db down"));

    const response = await request(app).post("/api/auth/register").send({
      username: "newstudent",
      email: "explode@example.com",
      phone: "1234567890",
      password: "password123",
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
    expect(JSON.stringify(response.body)).not.toMatch(/page not found/i);
    expect(JSON.stringify(response.body)).not.toMatch(/db down/);
  });

  test("returns JSON when the catalogue query fails and serves stored courses", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(Service, "find").mockRejectedValueOnce(new Error("db down"));

    const failed = await request(app).get("/api/data/services");
    expect(failed.status).toBe(500);
    expect(failed.body.message).toBe("Internal server error");

    await Service.create({
      name: "React",
      category: "Web",
      level: "Beginner",
      duration: "4 weeks",
      instructor: "Ada",
    });
    const ok = await request(app).get("/api/data/services");
    expect(ok.status).toBe(200);
    expect(ok.body.services).toHaveLength(1);
    expect(ok.body.msg).toHaveLength(1);
    expect(ok.body.services[0].name).toBe("React");
  });

  test("rejects operator keys on the contact form and accepts a normal message", async () => {
    const rejected = await request(app).post("/api/form/contact").send({
      username: { $gt: "" },
      email: "ada@example.com",
      message: "hello",
    });
    expect(rejected.status).toBe(400);
    expect(await Contact.countDocuments()).toBe(0);

    const created = await request(app).post("/api/form/contact").send({
      username: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello from the form",
    });
    expect(created.status).toBe(201);
    expect(await Contact.countDocuments()).toBe(1);
  });

  test("refuses to boot when the JWT secret is missing or short", () => {
    const previousSecret = process.env.JWT_SECRET_KEY;
    const previousUri = process.env.MONGODB_URI;
    process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/techacademia";
    process.env.JWT_SECRET_KEY = "short";

    expect(() => assertEnv()).toThrow(/JWT_SECRET_KEY/);

    process.env.JWT_SECRET_KEY = previousSecret;
    if (previousUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = previousUri;
    }
  });

  test("validation errors still reach the error middleware", async () => {
    const response = await request(app).post("/api/auth/register").send({ email: "not-an-email" });
    expect(response.status).toBe(422);
    expect(response.body.message).toBe("Fill the input properly");
    expect(response.body.extraDetails).toBeTruthy();
  });
});
