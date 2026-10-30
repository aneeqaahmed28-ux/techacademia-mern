const bcrypt = require("bcrypt");

function saltRounds() {
  const parsed = Number(process.env.BCRYPT_SALT_ROUNDS);
  if (!Number.isInteger(parsed) || parsed < 4 || parsed > 15) {
    return 10;
  }
  return parsed;
}

let dummyHash;

function warmDummyHash() {
  if (!dummyHash) {
    dummyHash = bcrypt.hash("not-a-real-password", saltRounds());
  }
  return dummyHash;
}

async function compareWithDummy(candidate) {
  const hash = await warmDummyHash();
  return bcrypt.compare(candidate, hash);
}

module.exports = { saltRounds, warmDummyHash, compareWithDummy };
