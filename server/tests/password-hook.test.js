const User = require("../models/user-model");
const { connectTestDb, clearTestDb, disconnectTestDb } = require("./db");

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("password hashing", () => {
  test("stores a bcrypt hash and does not rehash when the password is unchanged", async () => {
    const password = "password123";
    const created = await User.create({
      username: "hookuser",
      email: "hook@example.com",
      phone: "1234567890",
      password,
    });

    const stored = await User.findById(created._id).select("+password");
    const originalHash = stored.password;
    expect(originalHash).not.toBe(password);
    expect(originalHash.startsWith("$2")).toBe(true);

    stored.username = "hookuserrenamed";
    await stored.save();

    const again = await User.findById(created._id).select("+password");
    expect(again.password).toBe(originalHash);
    expect(again.username).toBe("hookuserrenamed");
    await expect(again.comparePassword(password)).resolves.toBe(true);
    await expect(again.comparePassword("wrong-password")).resolves.toBe(false);
  });

  test("still requires username, email, phone, and password", async () => {
    const user = new User({ username: "abc" });
    await expect(user.save()).rejects.toThrow(/required/i);
  });
});
