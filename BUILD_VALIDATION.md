# Build Validation

This package is a regenerated v1.0.3 patient-only Capacitor Android project checked against the uploaded `qelcaresql-V7.sql` full-data dump.

## What changed in this regeneration

- Reviewed the V7 full-data SQL dump instead of the schema-only dump.
- Confirmed the required patient mobile tables are present.
- Confirmed the V7 dump includes patient-role users, linked patient rows, a verified doctor with specialty assignment, appointments, vitals, medical records, and patient-uploaded result rows.
- Kept the full SQL dump out of the ZIP because it contains live/full data such as active tokens, password hashes, emails, patients, appointments, and clinical/demo records.
- Updated backend SQL patch to fix the OTP purpose constraint conflict still present in `qelcaresql-V7.sql`.
- Added/updated `check_patient_mobile_compatibility.sql` for post-migration verification.
- Added `optional_clear_restored_sessions.sql` for local/dev/staging restores of the full V7 dump.
- Updated patient registration/profile backend route wording and OTP handling for the V7 schema.

## Syntax validation performed

```bash
node --check backend-patient-mobile-patch/qelcare-backend/features/auth/routes/patientRegistrationRoutes.js
node --check backend-patient-mobile-patch/tools/apply-patient-mobile-backend-patch.cjs
```

Result: completed successfully.

## Frontend/Capacitor build note

The generated package includes the React source, the previous successful `dist/` production web build, and the synced Capacitor Android project under `android/`.

No patient frontend source files were changed in this V7 regeneration; the changes are database review docs and backend patch files. I attempted to rerun `npm install`/`npm run build` in the sandbox, but the sandbox npm install was terminated by the environment after repeated dependency-cache/network timeouts. This was not a JavaScript syntax failure in the project. Build again locally after unzipping with:

```bash
npm install
npm run build
npx cap sync android
```

## APK compilation note

A final `.apk` was not compiled inside this sandbox because Android SDK is not installed here, and Gradle/Android build tooling is not available. The included Android project is ready to open in Android Studio or build on a machine/CI runner with Android SDK and Gradle access.
