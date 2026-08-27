// ============================================================
// FILE: src/components/Auth/PatientIdleTimeout.js  (mobile)
// ------------------------------------------------------------
// Inactivity auto-logout for the patient app. Mounted once at the app root.
// Mirrors the website's PatientIdleTimeout but adapted for the native WebView:
// touch events included, and no cross-tab storage listener (a Capacitor app is a
// single WebView). All handlers gate on isPatientSession(), so it's a no-op when
// logged out.
//
// Activity stamps a timestamp in localStorage; a light interval — plus an
// immediate check when the app returns to the foreground (visibility) — signs the
// patient out after the idle window and redirects to #/login with a
// "Session Expired" notice.
// ============================================================
import { useEffect } from "react";
import {
  isPatientSession,
  expireSession,
  PATIENT_IDLE_LIMIT_MS,
  LAST_ACTIVITY_KEY,
} from "../../utils/auth";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "touchmove", "scroll", "click"];
const CHECK_INTERVAL_MS = 15000; // re-check idle state every 15s

export default function PatientIdleTimeout() {
  useEffect(() => {
    let lastWrite = 0;
    let expiring = false;

    const onActivity = () => {
      if (!isPatientSession()) return;
      const now = Date.now();
      if (now - lastWrite >= 1000) {
        lastWrite = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      }
    };

    const check = () => {
      if (expiring || !isPatientSession()) return;
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || Date.now();
      if (Date.now() - last >= PATIENT_IDLE_LIMIT_MS) {
        expiring = true;
        expireSession();
      }
    };

    // App brought back to the foreground -> check immediately (native timers are
    // throttled/paused while backgrounded).
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", check);
    const interval = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", check);
      clearInterval(interval);
    };
  }, []);

  return null;
}
