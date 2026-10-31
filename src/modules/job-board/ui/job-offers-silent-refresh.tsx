"use client";

import { useEffect } from "react";
import { refreshJobOffersIfDue } from "@/modules/job-board/actions";

let inFlight = false;

/**
 * Once per calendar day, when the user is in the app, collect offers with
 * their saved search. No toast, no spinner.
 */
export function JobOffersSilentRefresh() {
  useEffect(() => {
    function run() {
      if (document.visibilityState === "hidden" || inFlight) return;
      inFlight = true;
      void refreshJobOffersIfDue()
        .catch(() => {
          // Missing prefs, throttle, or a board timeout.
        })
        .finally(() => {
          inFlight = false;
        });
    }
    run();
    document.addEventListener("visibilitychange", run);
    return () => document.removeEventListener("visibilitychange", run);
  }, []);
  return null;
}
