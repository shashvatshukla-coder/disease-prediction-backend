"use strict";

const crypto = require("crypto");
const mongoose = require("mongoose");
const { connectDatabase, databaseConfigured } = require("./doctorWorkspaceStore");

const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 32;
const HASH_DIGEST = "sha256";

const doctorAccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  clinic: {
    type: String,
    default: "Disease Prediction Clinic",
    trim: true
  },
  role: {
    type: String,
    default: "Doctor"
  }
}, {
  timestamps: true
});

const DoctorAccount = mongoose.model("DoctorAccount", doctorAccountSchema);

function normaliseUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(String(password), salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString("hex");
  return `pbkdf2_${HASH_DIGEST}$${HASH_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash = "") {
  const [algorithm, iterationsText, salt, expectedHash] = String(storedHash).split("$");
  if (algorithm !== `pbkdf2_${HASH_DIGEST}` || !salt || !expectedHash) return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 1) return false;

  const actual = crypto
    .pbkdf2Sync(String(password), salt, iterations, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString("hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function publicDoctorFromAccount(account) {
  return {
    id: String(account._id),
    username: account.username,
    name: account.name,
    clinic: account.clinic,
    role: account.role || "Doctor"
  };
}

function validateAccountInput({ username, password, name }) {
  const cleanUsername = normaliseUsername(username);
  const cleanName = String(name || "").trim();
  const cleanPassword = String(password || "");

  if (cleanUsername.length < 3) {
    return "Username must be at least 3 characters.";
  }
  if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
    return "Username can use letters, numbers, dot, underscore, or dash.";
  }
  if (cleanPassword.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (cleanName.length < 2) {
    return "Doctor name is required.";
  }
  return "";
}

async function createDoctorAccount(input = {}) {
  if (!databaseConfigured()) {
    const error = new Error("Account creation requires MongoDB to be configured.");
    error.statusCode = 503;
    throw error;
  }

  const validationMessage = validateAccountInput(input);
  if (validationMessage) {
    const error = new Error(validationMessage);
    error.statusCode = 400;
    throw error;
  }

  await connectDatabase();

  const username = normaliseUsername(input.username);
  const existing = await DoctorAccount.findOne({ username }).lean();
  if (existing) {
    const error = new Error("That username is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const account = await DoctorAccount.create({
    username,
    passwordHash: hashPassword(input.password),
    name: String(input.name || "").trim(),
    clinic: String(input.clinic || "").trim() || "Disease Prediction Clinic"
  });

  return publicDoctorFromAccount(account);
}

async function authenticateDoctorAccount(username, password) {
  if (!databaseConfigured()) return null;

  await connectDatabase();
  const account = await DoctorAccount.findOne({ username: normaliseUsername(username) });
  if (!account || !verifyPassword(password, account.passwordHash)) return null;
  return publicDoctorFromAccount(account);
}

module.exports = {
  authenticateDoctorAccount,
  createDoctorAccount
};
