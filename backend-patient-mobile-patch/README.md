# QELCare Patient Mobile Backend Patch

This patch adds backend support required by the patient-only Capacitor APK. It was regenerated after checking the uploaded `qelcaresql-V7.sql` full schema+data dump.

## Important about `qelcaresql-V7.sql`

The V7 SQL dump includes real rows, not just schema. It contains users, patient records, appointments, medical records, uploaded medical results, activity logs, active JWT tokens, and password hashes. Do not bundle or distribute that dump with the APK project. This patch does not include or import that data.

For an existing/live database, run only the included patch SQL. Do not replace your production database with the full dump unless you intentionally want to restore/rebuild that database.

## What it adds/fixes

- Patient self-registration without using the admin-only `/users` route
- Registration OTP with purpose `registration`
- Profile-update OTP with purpose `profile_update`
- Patient-safe profile update route for username, email, phone, alternate phone, address, and linked patient data
- Patient role lookup by `role_name = 'Patient'` instead of hard-coded role ID
- SQL-safe length validation matching your V7 `users` table limits
- `patients.contact` and `patients.phone` sync for legacy/current patient rows
- OTP purpose constraint repair for the V7 conflict:
  - old `chk_otp_purpose` allowed `password_reset`, `registration`
  - old `otp_requests_purpose_check` allowed `password_reset`, `email_verification`
  - the patch replaces both with one constraint allowing `password_reset`, `registration`, `email_verification`, `profile_update`
- Idempotent `patient_medical_results` table support for older databases
- A read-only compatibility check SQL script

## Files included

```text
qelcare-backend/features/auth/routes/patientRegistrationRoutes.js
qelcare-backend/database/patient_mobile_patch.sql
qelcare-backend/database/check_patient_mobile_compatibility.sql
qelcare-backend/database/optional_clear_restored_sessions.sql
tools/apply-patient-mobile-backend-patch.cjs
```

## Apply

From your original full QELCare repository root:

```bash
node path/to/qelcare_patient_mobile_v3/backend-patient-mobile-patch/tools/apply-patient-mobile-backend-patch.cjs
psql "$DATABASE_URL" -f qelcare-backend/database/patient_mobile_patch.sql
psql "$DATABASE_URL" -f qelcare-backend/database/check_patient_mobile_compatibility.sql
```

Then restart the backend.

`optional_clear_restored_sessions.sql` is only for local/dev/staging databases restored from the full V7 dump. Do not run it on production unless you intentionally want to delete active sessions and pending OTP rows.

The helper script copies the route and SQL files into your backend and inserts this line before the normal `/auth` route in `qelcare-backend/server.js`:

```js
app.use("/auth/patient", require("./features/auth/routes/patientRegistrationRoutes"));
```

## Environment variables

The OTP email sender uses the same Brevo variables as the existing backend:

```env
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=QELCare System
```

## Added routes

Mounted at `/auth/patient`:

```text
POST /auth/patient/register
POST /auth/patient/register/resend
POST /auth/patient/register/verify
POST /auth/patient/profile/otp
POST /auth/patient/profile/otp/check
PUT  /auth/patient/profile
```
