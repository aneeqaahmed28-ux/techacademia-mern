require("dotenv").config();

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const authRoute = require("./router/auth-router");
const contactRoute = require("./router/contact-router");
const serviceRoute = require("./router/service-router");
const adminRoute = require("./router/admin-router");
const errorMiddleware = require("./middlewares/error-middleware");
const originMiddleware = require("./middlewares/origin-middleware");
const sanitizeMiddleware = require("./middlewares/sanitize-middleware");
const { getAllowedOrigins } = require("./config/env");

const app = express();

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || getAllowedOrigins().includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));
app.use(sanitizeMiddleware);
app.use(originMiddleware);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoute);
app.use("/api/form", contactRoute);
app.use("/api/data", serviceRoute);
app.use("/api/admin", adminRoute);

app.use((_req, res) => {
  res.status(404).json({ message: "Resource not found" });
});

app.use(errorMiddleware);

module.exports = app;
