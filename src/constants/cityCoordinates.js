// Reference (city-center) coordinates for the real cities this dataset
// covers. Deliberately excludes the administrative "okrug"/district grad
// values that also appear in the sheet (e.g. "Južnobački okrug",
// "Nišavski") - those are wholesale/livestock reporting regions scraped at
// district granularity, not places a shopper means by "my city", and don't
// have one sensible city-center point anyway.
//
// Keys must match the exact grad string parseMesto() produces (see
// src/utils/market.js) so useLocationDetect.js's findNearestCity can look
// them up directly with no normalization step.
export const CITY_COORDINATES = {
  Beograd: { lat: 44.7866, lng: 20.4489 },
  'Novi Sad': { lat: 45.2671, lng: 19.8335 },
  Niš: { lat: 43.3209, lng: 21.8958 },
  Kragujevac: { lat: 44.0128, lng: 20.9114 },
  Kraljevo: { lat: 43.7256, lng: 20.6889 },
  Leskovac: { lat: 42.9981, lng: 21.9462 },
  Loznica: { lat: 44.5333, lng: 19.2256 },
  Kikinda: { lat: 45.8297, lng: 20.4608 },
  Pančevo: { lat: 44.8708, lng: 20.6403 },
  Pirot: { lat: 43.1522, lng: 22.5864 },
  Požarevac: { lat: 44.6167, lng: 21.1833 },
  Smederevo: { lat: 44.6636, lng: 20.9297 },
  Sombor: { lat: 45.7742, lng: 19.1122 },
  'Sremska Mitrovica': { lat: 44.9764, lng: 19.6122 },
  Subotica: { lat: 46.1008, lng: 19.665 },
  Užice: { lat: 43.8583, lng: 19.8433 },
  Vranje: { lat: 42.5539, lng: 21.8994 },
  Zaječar: { lat: 43.9037, lng: 22.2853 },
  Zrenjanin: { lat: 45.3836, lng: 20.3825 },
  Čačak: { lat: 43.8914, lng: 20.3497 },
  Šabac: { lat: 44.755, lng: 19.69 },
}
