"use strict";

const mongoose = require("mongoose");

const DEFAULT_WORKSPACE = Object.freeze({
  patients: [],
  medicines: [],
  dailyRecords: [],
  followUps: [],
  criticalCases: [],
  handovers: []
});

const workspaceSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    patients: { type: Array, default: [] },
    medicines: { type: Array, default: [] },
    dailyRecords: { type: Array, default: [] },
    followUps: { type: Array, default: [] },
    criticalCases: { type: Array, default: [] },
    handovers: { type: Array, default: [] }
  }
}, {
  timestamps: true
});

const DoctorWorkspace = mongoose.model("DoctorWorkspace", workspaceSchema);

let connectionPromise = null;

function databaseConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

async function connectDatabase() {
  if (!databaseConfigured()) return null;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
  }
  return connectionPromise;
}

function emptyWorkspace() {
  return {
    patients: [],
    medicines: [],
    dailyRecords: [],
    followUps: [],
    criticalCases: [],
    handovers: []
  };
}

function normaliseWorkspaceData(data = {}) {
  return Object.keys(DEFAULT_WORKSPACE).reduce((workspace, key) => {
    workspace[key] = Array.isArray(data[key]) ? data[key] : [];
    return workspace;
  }, emptyWorkspace());
}

async function getDoctorWorkspace(doctorId) {
  await connectDatabase();
  const workspace = await DoctorWorkspace.findOne({ doctorId }).lean();
  return workspace ? normaliseWorkspaceData(workspace.data) : emptyWorkspace();
}

async function saveDoctorWorkspace(doctorId, data) {
  await connectDatabase();
  const safeData = normaliseWorkspaceData(data);
  const workspace = await DoctorWorkspace.findOneAndUpdate(
    { doctorId },
    { $set: { data: safeData } },
    { new: true, upsert: true, lean: true }
  );
  return normaliseWorkspaceData(workspace.data);
}

module.exports = {
  connectDatabase,
  databaseConfigured,
  emptyWorkspace,
  getDoctorWorkspace,
  saveDoctorWorkspace
};
