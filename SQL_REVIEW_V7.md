# qelcaresql-V7 Patient APK Review

I checked the uploaded `qelcaresql-V7.sql` full dump before regenerating this package.

## Result

The V7 dump has the database pieces needed by the patient APK:

| Area | Status | Notes |
|---|---:|---|
| Login/session | OK | `users`, `roles`, and `active_tokens` exist. |
| Patient account/profile | OK | `patients` is linked to `users.user_id`; `user_addresses.address_line` exists. |
| Booking | OK | `appointments`, `specialties`, and Doctor users exist. The dump has a verified doctor with a specialty assignment. |
| Dashboard vitals | OK | `vitals` uses `id`, `nurse_id`, `heart_rate`, `weight`, `height`, `oxygen_sat`, and `o2_saturation`. |
| Medical records | OK | `medical_records` includes both `prescription` and `prescriptions`, so older and newer medication displays are supported. |
| Patient result uploads/OCR | OK | `patient_medical_results` exists with upload metadata, OCR text, and summary fields. |
| OTP | Patch recommended | V7 already has `purpose`, `used`, and `attempts`. The patch standardizes allowed mobile purposes and keeps registration/profile OTP safe. |

## Important data note

This SQL is not schema-only. It includes real rows such as users, patients, appointments, medical records, uploaded results, activity logs, active JWT tokens, and password hashes. I did not include the full SQL dump inside this package.

## Do you replace the SQL?

No for an existing/live database. Use this order instead:

```bash
node path/to/qelcare_patient_mobile_v3/backend-patient-mobile-patch/tools/apply-patient-mobile-backend-patch.cjs
psql "$DATABASE_URL" -f qelcare-backend/database/patient_mobile_patch.sql
psql "$DATABASE_URL" -f qelcare-backend/database/check_patient_mobile_compatibility.sql
```

Then restart the backend.

Only import the full `qelcaresql-V7.sql` dump if you intentionally want to restore/rebuild that exact database, including its rows. If you restore it into local/dev/test, consider running:

```bash
psql "$DATABASE_URL" -f qelcare-backend/database/optional_clear_restored_sessions.sql
```
