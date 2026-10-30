const { z } = require("zod");

const emailField = z
  .string({ required_error: "Email is required" })
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email must not be more than 255 characters" })
  .transform((value) => value.toLowerCase());

const passwordField = z
  .string({ required_error: "Password is required" })
  .min(7, { message: "Password must be at least of 7 characters" })
  .max(72, { message: "Password must not be more than 72 characters" });

const usernameField = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(3, { message: "Name must be at least of 3 characters" })
  .max(255, { message: "Name must not be more than 255 characters" });

const phoneField = z
  .string({ required_error: "Phone is required" })
  .trim()
  .min(10, { message: "Phone must be at least of 10 characters" })
  .max(20, { message: "Phone must not be more than 20 characters" });

const loginSchema = z
  .object({
    email: emailField,
    password: passwordField,
  })
  .strict();

const signupSchema = z
  .object({
    username: usernameField,
    email: emailField,
    phone: phoneField,
    password: passwordField,
  })
  .strict();

const updateUserSchema = z
  .object({
    username: usernameField,
    email: emailField,
    phone: phoneField,
  })
  .strict();

const contactSchema = z
  .object({
    username: usernameField,
    email: emailField,
    message: z
      .string({ required_error: "Message is required" })
      .trim()
      .min(1, { message: "Message is required" })
      .max(2000, { message: "Message must not be more than 2000 characters" }),
  })
  .strict();

module.exports = { loginSchema, signupSchema, updateUserSchema, contactSchema };
