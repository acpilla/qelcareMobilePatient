# QELCare Patient Mobile SQL Compatibility Report v3

Checked against the uploaded `qelcaresql-V7.sql` full-data dump.

## Result

The V7 SQL has the database structure needed for the patient-only APK:

- `roles`
- `users`
- `user_addresses`
- `active_tokens`
- `otp_requests`
- `patients`
- `specialties`
- `appointments`
- `vitals`
- `medical_records`
- `patient_medical_results`

The APK/project does **not** require replacing your database. Use the migration patch instead.

## V7 data check summary

The V7 dump is no longer schema-only. It includes data rows, including:

- 6 role rows
- 10 user rows
- 5 patient-role user rows, with verified patient accounts present
- 1 verified doctor with a specialty assigned
- 8 specialties, including General Medicine
- 17 appointments
- 6 vitals rows
- 3 medical records
- 2 patient medical result rows
- 8 active token rows

Because it includes active tokens, password hashes, emails, profile URLs, patients, appointments, and clinical/demo records, do **not** bundle this SQL inside the APK project and do **not** share it publicly.

## Important finding

`qelcaresql-V7.sql` still contains conflicting OTP purpose checks:

- `chk_otp_purpose` allows `password_reset` and `registration`
- `otp_requests_purpose_check` allows `password_reset` and `email_verification`

When both constraints exist, only `password_reset` can pass both. That blocks patient registration OTP and profile-update OTP.

The regenerated patch fixes this by dropping both old constraints and recreating one compatible constraint:

```sql
CHECK (purpose IN ('password_reset','registration','email_verification','profile_update'))
```

## V7 schema-specific compatibility notes

The V7 schema uses:

- `users.username VARCHAR(50)` and `users.email VARCHAR(100)`, so the patient registration route validates those smaller limits.
- `users.specialty_id`, which is needed for patient booking to show verified doctors by specialty.
- `vitals.id`, `vitals.nurse_id`, `vitals.heart_rate`, `vitals.weight`, `vitals.height`, and `vitals.oxygen_sat`.
- `medical_records.record_id`, plus both legacy `prescription`/`notes` and newer `prescriptions`/`doctor_notes` fields.
- `patient_medical_results` with OCR-ready fields such as `extracted_text`, `summary_notes`, `file_url`, `file_public_id`, `file_mime`, and `deleted_at`.

## Do not replace your production SQL

Do not replace your deployed database with the dump just for the APK. If you already have the database deployed, apply this patch:

```bash
node path/to/qelcare_patient_mobile_v3/backend-patient-mobile-patch/tools/apply-patient-mobile-backend-patch.cjs
psql "$DATABASE_URL" -f qelcare-backend/database/patient_mobile_patch.sql
psql "$DATABASE_URL" -f qelcare-backend/database/check_patient_mobile_compatibility.sql
```

Then restart the backend.

## Optional cleanup for restored dev/staging dumps

If you restore the full V7 SQL dump into a local/dev/staging database, you can clear copied session tokens and pending OTP rows with:

```bash
psql "$DATABASE_URL" -f backend-patient-mobile-patch/qelcare-backend/database/optional_clear_restored_sessions.sql
```

Do **not** run that on production unless you intentionally want to log out every active user.

## Expected compatibility-check result

After applying the patch:

- all required tables should show `OK`
- all required columns should show `OK`
- OTP constraints should show `OK`
- `Patient`, `Doctor`, `Nurse`, `Frontdesk`, `Cashier`, and `Admin` roles should exist
- `bookable_doctors` should be greater than 0 for booking to show doctor options

## Notes

- If Android login works but booking has no doctors, make sure at least one Doctor user is `verified` and has `users.specialty_id` set.
- If registration succeeds but verification fails, run `patient_mobile_patch.sql` and confirm the OTP constraints with the compatibility check.
- If uploaded lab result files do not save files, check Cloudinary backend environment variables.
