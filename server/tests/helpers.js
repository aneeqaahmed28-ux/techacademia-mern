const request = require("supertest");
const User = require("../models/user-model");

const ORIGIN = "http://localhost:5173";

function cookieHeader(setCookie = []) {
  return setCookie.map((entry) => entry.split(";")[0]).join("; ");
}

function cookieValue(setCookie = [], name) {
  const entry = setCookie.find((item) => item.startsWith(`${name}=`));
  if (!entry) {
    return "";
  }
  return entry.split(";")[0].slice(name.length + 1);
}

async function createUser(overrides = {}) {
  return User.create({
    username: "regularuser",
    email: "user@example.com",
    phone: "1234567891",
    password: "userpass1",
    isAdmin: false,
    ...overrides,
  });
}

async function createAdmin(overrides = {}) {
  return User.create({
    username: "adminuser",
    email: "admin@example.com",
    phone: "1234567890",
    password: "adminpass1",
    isAdmin: true,
    ...overrides,
  });
}

async function loginAgent(app, email, password) {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .set("Origin", ORIGIN)
    .send({ email, password });
  return { agent, response };
}

module.exports = {
  ORIGIN,
  cookieHeader,
  cookieValue,
  createUser,
  createAdmin,
  loginAgent,
};
