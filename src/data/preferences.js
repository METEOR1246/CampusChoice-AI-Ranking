/**
 * Demo user preferences for the Milestone 2 basic ranking prototype.
 *
 * Category preferences use a 1–5 scale (5 = highest interest).
 * The preferred time slot is compared against each event's derived slot.
 *
 * @typedef {Object} UserPreferences
 * @property {Record<string, number>} categoryPreference Interest per category (1–5).
 * @property {string} preferredTimeSlot              "Morning" | "Afternoon" | "Evening".
 */

/** @type {UserPreferences} */
export const DEMO_USER = {
  categoryPreference: {
    Technology: 5,
    Career: 4,
    Community: 3,
    Sports: 2,
    Arts: 1,
  },
  preferredTimeSlot: 'Evening',
};
