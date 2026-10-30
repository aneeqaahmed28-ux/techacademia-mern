require("dotenv").config();

const app = require("./app");
const connectDb = require("./utils/db");
const { assertEnv, port } = require("./config/env");

assertEnv();

const listenPort = port();
connectDb().then(() => {
  app.listen(listenPort, () => {
    console.log(`server is running on port ${listenPort}`);
  });
});
