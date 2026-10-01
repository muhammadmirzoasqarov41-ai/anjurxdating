import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Standard coordinates for major cities and regions in Uzbekistan
 */
export const UZBEKISTAN_CITIES = {
  toshkent: { name: "Toshkent", lat: 41.2995, lng: 69.2401 },
  samarqand: { name: "Samarqand", lat: 39.6542, lng: 66.9597 },
  buxoro: { name: "Buxoro", lat: 39.7681, lng: 64.4556 },
  "farg'ona": { name: "Farg'ona", lat: 40.3842, lng: 71.7843 },
  andijon: { name: "Andijon", lat: 40.7821, lng: 72.3442 },
  namangan: { name: "Namangan", lat: 40.9983, lng: 71.6726 },
  xorazm: { name: "Xorazm", lat: 41.3775, lng: 60.3639 },
  navoiy: { name: "Navoiy", lat: 40.0844, lng: 65.3792 },
  qashqadaryo: { name: "Qashqadaryo", lat: 38.8606, lng: 65.7891 },
  surxondaryo: { name: "Surxondaryo", lat: 37.2242, lng: 67.2783 },
  jizzax: { name: "Jizzax", lat: 40.1158, lng: 67.8422 },
  sirdaryo: { name: "Sirdaryo", lat: 40.4897, lng: 68.7842 },
};

/**
 * Normalizes city string and returns coordinates
 */
export function getCityCoordinates(cityName = "") {
  if (!cityName) return null;
  const key = cityName.toLowerCase().trim().replace(/['`’]/g, "'");
  return UZBEKISTAN_CITIES[key] || null;
}

/**
 * Haversine formula: Calculates real spherical distance between two points on Earth in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number"
  ) {
    return null;
  }

  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Finds nearest Uzbekistan city from coordinates
 */
export function findNearestCity(lat, lng) {
  let closestCity = null;
  let minDistance = Infinity;

  for (const city of Object.values(UZBEKISTAN_CITIES)) {
    const dist = calculateDistanceKm(lat, lng, city.lat, city.lng);
    if (dist !== null && dist < minDistance) {
      minDistance = dist;
      closestCity = city.name;
    }
  }

  return closestCity || "Toshkent";
}

/**
 * Resolves effective coordinates for a profile:
 * 1. Checks profile.approxLocation (real GPS rounded to ~1.1km grid for privacy)
 * 2. Falls back to city coordinates
 */
export function getEffectiveCoordinates(profile = {}) {
  if (!profile) return null;

  // 1. Approximate location from GPS
  if (
    typeof profile?.approxLocation?.lat === "number" &&
    typeof profile?.approxLocation?.lng === "number"
  ) {
    return {
      lat: profile.approxLocation.lat,
      lng: profile.approxLocation.lng,
      source: "gps",
      updatedAt: profile.approxLocation.updatedAt || null,
    };
  }

  // 2. City fallback
  if (profile?.city) {
    const cityCoord = getCityCoordinates(profile.city);
    if (cityCoord) {
      return {
        lat: cityCoord.lat,
        lng: cityCoord.lng,
        source: "city",
        updatedAt: null,
      };
    }
  }

  return null;
}

/**
 * Calculates real distance between two profiles respecting privacy settings
 */
export function calculateProfileDistance(me = {}, target = {}) {
  // If target user explicitly hid distance
  if (target?.locationSettings?.showDistance === false) {
    return null;
  }

  // If viewer disabled location sharing
  if (me?.locationSettings?.shareLocation === false) {
    return null;
  }

  const coord1 = getEffectiveCoordinates(me);
  const coord2 = getEffectiveCoordinates(target);

  if (!coord1 || !coord2) {
    return null;
  }

  return calculateDistanceKm(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
}

/**
 * Formats distance with privacy fuzzing
 * - Under 500m -> "500 m dan kam"
 * - Under 1km -> "1 km dan kam"
 * - 1km to 10km -> "3.4 km uzoqlikda"
 * - 10km+ -> "15 km uzoqlikda"
 */
export function formatDistance(distanceKm) {
  if (typeof distanceKm !== "number" || isNaN(distanceKm)) {
    return null;
  }

  if (distanceKm < 0.5) {
    return "500 m dan kam";
  }
  if (distanceKm < 1) {
    return "1 km dan kam";
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km uzoqlikda`;
  }
  return `${Math.round(distanceKm)} km uzoqlikda`;
}

/**
 * Requests browser Geolocation safely with timeout
 */
export function requestBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: "UNSUPPORTED", message: "Geolokatsiya qurilmangizda qo'llab-quvvatlanmaydi." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        let msg = "Joylashuvni aniqlab bo'lmadi.";
        if (err.code === 1) {
          msg = "Joylashuvga ruxsat berilmadi.";
        } else if (err.code === 2) {
          msg = "Joylashuv ma'lumotlari mavjud emas.";
        } else if (err.code === 3) {
          msg = "Joylashuvni aniqlash vaqti tugadi.";
        }
        reject({ code: err.code, message: msg });
      },
      {
        enableHighAccuracy: false, // Low battery usage
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Saves location with Privacy-First approach:
 * 1. Exact coordinates stored only in private /user_locations/{uid} (owner-only access in Firestore rules)
 * 2. Public profile /tinder_profiles/{uid} gets approxLocation (coarse grid ~1.1km)
 */
export async function saveUserLocation(uid, coords, cityName = null, settings = {}) {
  if (!uid || !coords || typeof coords.lat !== "number") return;

  const lat = coords.lat;
  const lng = coords.lng;

  // Approximate coordinates: rounded to 2 decimal places (~1.1 km resolution)
  // Prevents identifying home/street/exact address
  const approxLat = Math.round(lat * 100) / 100;
  const approxLng = Math.round(lng * 100) / 100;

  const detectedCity = cityName || findNearestCity(lat, lng);

  // 1. Save exact coordinates in strictly private document
  try {
    await setDoc(
      doc(db, "user_locations", uid),
      {
        exactLat: lat,
        exactLng: lng,
        accuracy: coords.accuracy || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Private location saqlashda xatolik:", err);
  }

  // 2. Save approximate coordinates in public profile
  try {
    await setDoc(
      doc(db, "tinder_profiles", uid),
      {
        approxLocation: {
          lat: approxLat,
          lng: approxLng,
          city: detectedCity,
          updatedAt: serverTimestamp(),
          isLive: true,
        },
        city: detectedCity,
        locationSettings: {
          shareLocation: settings.shareLocation !== false,
          showDistance: settings.showDistance !== false,
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Profile location saqlashda xatolik:", err);
  }
}
