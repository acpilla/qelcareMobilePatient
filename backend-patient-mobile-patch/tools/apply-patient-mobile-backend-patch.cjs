#!/usr/bin/env node
/*
  QELCare patient mobile backend patch helper.
  Run this from the repository root that contains qelcare-backend/.
*/
const fs = require("fs");
const path = require("path");

function findBackendRoot() {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "qelcare-backend"),
    cwd.endsWith("qelcare-backend") ? cwd : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "server.js"))) return candidate;
  }
  throw new Error("Could not find qelcare-backend/server.js. Run from the repo root or qelcare-backend folder.");
}

function copyFileWithDirs(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`Copied ${path.relative(process.cwd(), destination)}`);
}

function backupOnce(file) {
  const backup = `${file}.bak-patient-mobile`;
  if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
}

const backendRoot = findBackendRoot();
const patchRoot = path.resolve(__dirname, "..");
const routeSource = path.join(patchRoot, "qelcare-backend", "features", "auth", "routes", "patientRegistrationRoutes.js");
const sqlSource = path.join(patchRoot, "qelcare-backend", "database", "patient_mobile_patch.sql");
const checkSqlSource = path.join(patchRoot, "qelcare-backend", "database", "check_patient_mobile_compatibility.sql");
const optionalCleanupSource = path.join(patchRoot, "qelcare-backend", "database", "optional_clear_restored_sessions.sql");

copyFileWithDirs(routeSource, path.join(backendRoot, "features", "auth", "routes", "patientRegistrationRoutes.js"));
copyFileWithDirs(sqlSource, path.join(backendRoot, "database", "patient_mobile_patch.sql"));
copyFileWithDirs(checkSqlSource, path.join(backendRoot, "database", "check_patient_mobile_compatibility.sql"));
copyFileWithDirs(optionalCleanupSource, path.join(backendRoot, "database", "optional_clear_restored_sessions.sql"));

const serverPath = path.join(backendRoot, "server.js");
backupOnce(serverPath);
let server = fs.readFileSync(serverPath, "utf8");

const mountLine = 'app.use("/auth/patient", require("./features/auth/routes/patientRegistrationRoutes"));';
if (!server.includes('patientRegistrationRoutes')) {
  const authLine = 'app.use("/auth", require("./features/auth/routes/authRoutes"));';
  if (!server.includes(authLine)) {
    throw new Error(`Could not find expected auth mount in ${serverPath}. Add this line manually before the normal /auth route:\n${mountLine}`);
  }
  server = server.replace(authLine, `${mountLine}\n${authLine}`);
  fs.writeFileSync(serverPath, server);
  console.log("Patched server.js with /auth/patient routes.");
} else {
  console.log("server.js already contains patient mobile auth route.");
}

console.log("\nNext: run the SQL migration on your database:");
console.log("  psql \"$DATABASE_URL\" -f qelcare-backend/database/patient_mobile_patch.sql");
console.log("\nThen run the read-only compatibility check:");
console.log("  psql \"$DATABASE_URL\" -f qelcare-backend/database/check_patient_mobile_compatibility.sql");
console.log("\nThen restart the backend server.");
