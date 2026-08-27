export const roleAccess = {
  Patient: [
    "dashboard",
    "my-appointments",
    "book-appointment",
    "my-records",
    "medical-results",
    "my-medications",
    "profile-settings",
  ],
};

export const canAccess = (role, page) => role === "Patient" && roleAccess.Patient.includes(page);
