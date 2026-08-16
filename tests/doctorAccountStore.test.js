"use strict";

const assert = require("assert");
delete process.env.MONGODB_URI;
const { authenticateDoctorAccount, createDoctorAccount } = require("../services/doctorAccountStore");

(async () => {
  const doctor = await createDoctorAccount({
    username: "Demo.Doctor",
    password: "strong-password",
    name: "Dr. Demo",
    clinic: "Demo Clinic"
  });
  assert.strictEqual(doctor.username, "demo.doctor");
  assert.ok(!Object.hasOwn(doctor, "passwordHash"));
  const authenticated = await authenticateDoctorAccount("DEMO.DOCTOR", "strong-password");
  assert.strictEqual(authenticated.id, doctor.id);
  assert.strictEqual(await authenticateDoctorAccount("demo.doctor", "wrong-password"), null);
  await assert.rejects(
    createDoctorAccount({ username: "demo.doctor", password: "strong-password", name: "Dr. Demo" }),
    error => error.statusCode === 409
  );
  console.log("Doctor account store tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
