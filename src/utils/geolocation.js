import { CITY_COORDINATES } from '../constants/cityCoordinates.js'

const EARTH_RADIUS_KM = 6371

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

// Great-circle distance between two lat/lng points, in kilometers.
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

const DEFAULT_MAX_DISTANCE_KM = 60

// Nearest known city to (latitude, longitude), restricted to `availableCities`
// (the caller's currently selectable grad list - see FilterBar's category-
// filtered `cities` prop) so this never recommends a city the current
// category/step can't actually resolve to. Returns null when none of the
// available cities has a known coordinate, or the nearest one is still
// farther than maxDistanceKm away (e.g. the user is outside Serbia).
export function findNearestCity(latitude, longitude, availableCities, maxDistanceKm = DEFAULT_MAX_DISTANCE_KM) {
  let nearest = null

  for (const grad of availableCities) {
    const coordinates = CITY_COORDINATES[grad]
    if (!coordinates) continue

    const distanceKm = haversineDistanceKm(latitude, longitude, coordinates.lat, coordinates.lng)
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { grad, distanceKm }
    }
  }

  if (!nearest || nearest.distanceKm > maxDistanceKm) return null
  return nearest
}
