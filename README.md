# QELCare Patient Mobile App - Capacitor Android

This is the patient-only mobile build of QELCare, regenerated after checking your uploaded `qelcaresql-V7.sql` full schema+data dump. It keeps only patient/auth flows, wraps them with Capacitor for Android APK generation, and includes a backend/database patch for patient registration and profile OTP support.

## SQL compatibility result

Your V7 SQL dump has the required database structure and enough real sample/live rows for the patient APK to work after the included patch is applied:

- `users`, `roles`, `active_tokens`, and `user_addresses` for login, profile, and token/session storage
- `patients` linked to `users.user_id` for patient-owned records
- `appointments`, `specialties`, and verified Doctor users for patient booking
- `medical_records` and `vitals` for read-only clinical history
- `patient_medical_results` for patient-uploaded lab/medical result files, OCR text, and summary notes
- `otp_requests` for password reset, registration, and profile verification after patching

The only blocking database issue found is still in `otp_requests`: the dump contains two different purpose check constraints whose overlap only reliably allows `password_reset`. The included `patient_mobile_patch.sql` fixes this by replacing both old constraints with one safe constraint allowing:

```text
password_reset, registration, email_verification, profile_update
```

You do **not** need to replace your full `.sql` dump. For your existing database, run the included patch SQL and compatibility check instead.

See `SQL_REVIEW_V7.md` for the SQL review notes.

## Privacy / safety note

`qelcaresql-V7.sql` is a full data dump, not just schema. It includes rows like users, patients, active JWT tokens, password hashes, appointments, medical records, and result uploads. I did not include that full SQL dump in this ZIP. Do not distribute that dump with the APK project.

## What is included

Patient screens:

- Dashboard: `src/components/UserSide/UserScreen.js`
- Book appointment: `src/components/UserSide/UserBooking.js`
- Appointments: `src/components/UserSide/AppointmentList.js`
- Medical records: `src/components/UserSide/MedicalRecords.js`
- Medications: `src/components/UserSide/MedicationScreen.js`
- Lab results upload + OCR: `src/components/UserSide/PatientResults.js`
- Profile with OTP-gated username/email/phone/address edits: `src/components/UserSide/ProfileScreen.js`

Auth screens:

- Login: `src/components/Login/LoginScreen.js`
- Patient registration: `src/components/Register/RegisterScreen.js`
- Registration OTP: `src/components/Verifications/CodeVerification.js`
- Forgot password: `src/components/ForgotPassword/ForgotPassScreen.js`
- Email verification/password reset: `src/components/Verifications/EmailVerification.js`

Shared code:

- `src/utils/auth.js`
- `src/utils/roleAccess.js`
- `src/components/Layout/MainLayout.js`
- `src/components/Workflow/ClinicUi.js`

Android/Capacitor:

- `capacitor.config.json`
- `android/` Capacitor platform project
- `dist/` built web assets

Backend patch:

- `backend-patient-mobile-patch/qelcare-backend/features/auth/routes/patientRegistrationRoutes.js`
- `backend-patient-mobile-patch/qelcare-backend/database/patient_mobile_patch.sql`
- `backend-patient-mobile-patch/qelcare-backend/database/check_patient_mobile_compatibility.sql`
- `backend-patient-mobile-patch/tools/apply-patient-mobile-backend-patch.cjs`

## Main changes from the full web app

- Removed Admin, Doctor, Nurse, Cashier, Frontdesk, public queue, and landing page routes from the mobile entrypoint.
- Login blocks non-Patient users inside the mobile app.
- Navigation is patient-only and mobile-friendly with drawer + bottom tabs.
- Uses `HashRouter` so Android WebView deep refreshes do not break routes.
- Uses Vite for fast mobile builds while keeping the existing React components.
- Uses `VITE_API_URL` for the backend base URL.
- Converts PDF OCR worker import to a Vite-compatible `?url` worker import.
- Registration calls `/auth/patient/register` instead of the admin-only `/users` route.
- Patient role is looked up by role name on the backend, so the app does not depend on a hard-coded role ID.
- Profile/register validations match your V7 SQL column limits: username 50, email 100, first/last/middle name 50, suffix 10, phone fields 20.

## Configure backend URL

Copy `.env.example` to `.env` and set your real backend URL:

```bash
cp .env.example .env
```

For an Android emulator talking to a backend running on your laptop:

```env
VITE_API_URL=http://10.0.2.2:5001
```

For a real phone/APK, use a deployed HTTPS backend:

```env
VITE_API_URL=https://your-qelcare-backend.example.com
```

Do not use `localhost` for a real phone. On the phone, `localhost` means the phone itself, not your laptop/server.

## Install and run as web app

```bash
npm install
npm run dev
```

## Build web assets

```bash
npm run build
```

The build output goes to `dist/`, which is the Capacitor `webDir`.

## Sync Capacitor Android

```bash
npx cap sync android
```

## Open in Android Studio

```bash
npx cap open android
```

In Android Studio, open the `android/` folder, let Gradle sync, then use:

- Run button for emulator/device testing
- Build > Build App Bundle(s) / APK(s) > Build APK(s) for a debug APK
- Generate Signed Bundle / APK for production release signing

## Build APK from command line

After Android Studio/Android SDK/Gradle are installed and synced:

```bash
npm run apk:debug
```

Expected debug APK path:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For release:

```bash
npm run apk:release
```

Release builds require your own signing key before distribution.

## Backend patch required

Patch files are included in:

```text
backend-patient-mobile-patch/
```

### Apply to your original full QELCare backend

From the root of your original full QELCare repository, run:

```bash
node path/to/qelcare_patient_mobile_v3/backend-patient-mobile-patch/tools/apply-patient-mobile-backend-patch.cjs
```

Then run the SQL patch against your QELCare database:

```bash
psql "$DATABASE_URL" -f qelcare-backend/database/patient_mobile_patch.sql
```

Then run the read-only compatibility check:

```bash
psql "$DATABASE_URL" -f qelcare-backend/database/check_patient_mobile_compatibility.sql
```

Restart the backend server after applying both.

Do not replace your production database with the uploaded full SQL dump unless you intentionally want to rebuild/restore the database. For an existing/live database, the patch route is safer.

If you restore the full V7 dump into a local/dev/staging database, the patch folder also includes `optional_clear_restored_sessions.sql` to clear copied active tokens and pending OTP rows. Do not run that optional cleanup on production unless you intentionally want to log out every active user.

### Added backend routes

Mounted at `/auth/patient`:

- `POST /auth/patient/register`
- `POST /auth/patient/register/resend`
- `POST /auth/patient/register/verify`
- `POST /auth/patient/profile/otp`
- `POST /auth/patient/profile/otp/check`
- `PUT /auth/patient/profile`

## Backend endpoints used by the app

Existing endpoints from your backend:

- `POST /auth/login`
- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `POST /auth/otp/resend`
- `POST /auth/password/reset`
- `POST /auth/logout`
- `GET /users/me`
- `GET /users/doctors`
- `GET /patients/me`
- `GET /appointments/me`
- `POST /appointments/book`
- `GET /medical-records/me`
- `GET /vitals/me`
- `GET /patient-results/me`
- `POST /patient-results`
- `PATCH /patient-results/:id`
- `DELETE /patient-results/:id`

Patch-added endpoints:

- `POST /auth/patient/register`
- `POST /auth/patient/register/resend`
- `POST /auth/patient/register/verify`
- `POST /auth/patient/profile/otp`
- `POST /auth/patient/profile/otp/check`
- `PUT /auth/patient/profile`

## Notes from validation

See `BUILD_VALIDATION.md` for the build commands and results.
