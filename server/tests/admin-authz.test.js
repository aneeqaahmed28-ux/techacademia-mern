const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/user-model");
const Contact = require("../models/contact-model");
const AuditLog = require("../models/audit-log-model");
const { scrub } = require("../utils/audit");
const { updateUserByID, getAllUsers } = require("../controllers/admin-controller");
const { connectTestDb, clearTestDb, disconnectTestDb } = require("./db");
const { ORIGIN, createUser, createAdmin, loginAgent } = require("./helpers");

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("admin authorisation and mass assignment", () => {
  test("does not persist isAdmin or password from the update body", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const { agent } = await loginAgent(app, admin.email, "adminpass1");

    const response = await agent
      .patch(`/api/admin/users/update/${user._id}`)
      .set("Origin", ORIGIN)
      .send({
        username: "shouldnotapply",
        email: user.email,
        phone: "1234567891",
        isAdmin: true,
        password: "hackedpassword",
      });

    expect(response.status).toBe(422);
    expect(response.body.extraDetails).toMatch(/isAdmin|password|Unrecognized/i);

    const stored = await User.findById(user._id).select("+password");
    expect(stored.isAdmin).toBe(false);
    expect(stored.username).toBe("regularuser");
    await expect(stored.comparePassword("userpass1")).resolves.toBe(true);
    await expect(stored.comparePassword("hackedpassword")).resolves.toBe(false);
    expect(stored.password).not.toBe("hackedpassword");
  });

  test("writes only username, email, and phone when the controller is called directly", async () => {
    const admin = await createAdmin();
    const user = await createUser({ email: "target@example.com" });
    const req = {
      params: { id: user._id.toString() },
      body: {
        username: "changedname",
        email: "target@example.com",
        phone: "1234567899",
        isAdmin: true,
        password: "hackedpassword",
        tokenVersion: 9,
      },
      user: admin,
      ip: "127.0.0.1",
    };
    const res = mockRes();
    const next = jest.fn();

    await updateUserByID(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);

    const stored = await User.findById(user._id).select("+password");
    expect(stored.username).toBe("changedname");
    expect(stored.phone).toBe("1234567899");
    expect(stored.isAdmin).toBe(false);
    expect(stored.tokenVersion).toBe(0);
    await expect(stored.comparePassword("userpass1")).resolves.toBe(true);
    expect(stored.password.startsWith("$2")).toBe(true);

    const log = await AuditLog.findOne({ action: "USER_UPDATE", targetId: user._id.toString() });
    expect(log.actorEmail).toBe(admin.email);
    expect(log.metadata.fields).toEqual(["username", "email", "phone"]);
    expect(JSON.stringify(log.metadata)).not.toMatch(/password|hackedpassword/i);
  });

  test("lets an admin update profile fields and blocks everyone else", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const { agent } = await loginAgent(app, admin.email, "adminpass1");

    const updated = await agent
      .patch(`/api/admin/users/update/${user._id}`)
      .set("Origin", ORIGIN)
      .send({
        username: "renameduser",
        email: "user@example.com",
        phone: "1234567891",
      });
    expect(updated.status).toBe(200);

    const stored = await User.findById(user._id);
    expect(stored.username).toBe("renameduser");
    expect(stored.isAdmin).toBe(false);

    const logs = await AuditLog.find({ action: "USER_UPDATE" });
    expect(logs).toHaveLength(1);

    const { agent: userAgent } = await loginAgent(app, user.email, "userpass1");
    const forbidden = await userAgent
      .patch(`/api/admin/users/update/${user._id}`)
      .set("Origin", ORIGIN)
      .send({
        username: "pwnedname",
        email: user.email,
        phone: "1234567891",
        isAdmin: true,
      });
    expect(forbidden.status).toBe(403);
    expect((await User.findById(user._id)).isAdmin).toBe(false);
    expect((await User.findById(user._id)).username).toBe("renameduser");

    const anonymous = await request(app)
      .patch(`/api/admin/users/update/${user._id}`)
      .send({
        username: "anon",
        email: user.email,
        phone: "1234567891",
        isAdmin: true,
      });
    expect(anonymous.status).toBe(401);
  });

  test("checks isAdmin from the database on each request", async () => {
    const admin = await createAdmin();
    const { agent } = await loginAgent(app, admin.email, "adminpass1");

    admin.isAdmin = false;
    await admin.save();

    const denied = await agent.get("/api/admin/users");
    expect(denied.status).toBe(403);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: admin.email, password: "adminpass1" });
    expect(login.status).toBe(200);
  });

  test("returns an empty user list instead of a 404", async () => {
    await User.deleteMany({});
    const res = mockRes();
    const next = jest.fn();
    await getAllUsers({ user: { isAdmin: true } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns JSON for an invalid user id and omits passwords from admin reads", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const { agent } = await loginAgent(app, admin.email, "adminpass1");

    const invalid = await agent.get("/api/admin/users/not-an-object-id");
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe("Invalid id");
    expect(invalid.body.stack).toBeUndefined();

    const missing = await agent.get(`/api/admin/users/${new mongoose.Types.ObjectId()}`);
    expect(missing.status).toBe(404);

    const list = await agent.get("/api/admin/users");
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.every((entry) => entry.password === undefined)).toBe(true);

    const one = await agent.get(`/api/admin/users/${user._id}`);
    expect(one.status).toBe(200);
    expect(one.body.password).toBeUndefined();
    expect(one.body.email).toBe(user.email);
  });

  test("records user and contact deletes and refuses self-deletion", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const contact = await Contact.create({
      username: "visitor",
      email: "visitor@example.com",
      message: "please call me",
    });
    const { agent } = await loginAgent(app, admin.email, "adminpass1");

    const self = await agent
      .delete(`/api/admin/users/delete/${admin._id}`)
      .set("Origin", ORIGIN);
    expect(self.status).toBe(400);
    expect(await User.findById(admin._id)).not.toBeNull();

    const removed = await agent
      .delete(`/api/admin/users/delete/${user._id}`)
      .set("Origin", ORIGIN);
    expect(removed.status).toBe(200);
    expect(await User.findById(user._id)).toBeNull();
    expect(await AuditLog.findOne({ action: "USER_DELETE", targetId: user._id.toString() })).not.toBeNull();

    const removedContact = await agent
      .delete(`/api/admin/contacts/delete/${contact._id}`)
      .set("Origin", ORIGIN);
    expect(removedContact.status).toBe(200);
    expect(
      await AuditLog.findOne({ action: "CONTACT_DELETE", targetId: contact._id.toString() })
    ).not.toBeNull();

    const audit = await agent.get("/api/admin/audit");
    expect(audit.status).toBe(200);
    expect(audit.body.length).toBeGreaterThanOrEqual(2);
  });

  test("strips sensitive keys before they can be stored on an audit event", () => {
    expect(
      scrub({
        fields: ["username"],
        password: "secret",
        nested: { accessToken: "abc", phone: "1234567890" },
      })
    ).toEqual({
      fields: ["username"],
      nested: { phone: "1234567890" },
    });
  });
});
