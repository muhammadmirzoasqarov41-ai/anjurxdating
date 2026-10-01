import create from "zustand";
import {
  requestBrowserLocation,
  saveUserLocation,
  findNearestCity,
} from "../lib/location";

export const useLocationStore = create((set, get) => ({
  permissionStatus: "prompt", // "prompt" | "granted" | "denied" | "unavailable"
  currentLocation: null, // { lat, lng, city, accuracy }
  shareLocation: true,
  showDistance: true,
  loading: false,
  error: null,
  lastUpdatedMs: 0,

  // Initialize from user profile settings
  initFromProfile: (profile) => {
    if (!profile) return;
    const share = profile.locationSettings?.shareLocation !== false;
    const show = profile.locationSettings?.showDistance !== false;
    const approx = profile.approxLocation;

    set({
      shareLocation: share,
      showDistance: show,
      currentLocation: approx
        ? {
            lat: approx.lat,
            lng: approx.lng,
            city: approx.city || profile.city || "Toshkent",
          }
        : null,
    });

    // Check browser permission status if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          set({ permissionStatus: result.state });
          result.onchange = () => {
            set({ permissionStatus: result.state });
          };
        })
        .catch(() => {
          // Ignore unsupported query
        });
    }
  },

  // Request browser location and save privacy-first approximate location
  requestLocation: async (uid, force = false) => {
    const { lastUpdatedMs, shareLocation, showDistance } = get();
    const now = Date.now();

    // Prevent redundant requests within 5 minutes unless forced
    if (!force && lastUpdatedMs && now - lastUpdatedMs < 5 * 60 * 1000) {
      return get().currentLocation;
    }

    set({ loading: true, error: null });

    try {
      const coords = await requestBrowserLocation();
      const detectedCity = findNearestCity(coords.lat, coords.lng);

      const locationData = {
        lat: Math.round(coords.lat * 100) / 100, // Approximate for privacy (~1.1km)
        lng: Math.round(coords.lng * 100) / 100,
        city: detectedCity,
        accuracy: coords.accuracy,
      };

      set({
        currentLocation: locationData,
        permissionStatus: "granted",
        loading: false,
        lastUpdatedMs: now,
      });

      // Save to Firestore if uid is available
      if (uid) {
        await saveUserLocation(uid, coords, detectedCity, {
          shareLocation,
          showDistance,
        });
      }

      return locationData;
    } catch (err) {
      const isDenied = err?.code === 1;
      set({
        permissionStatus: isDenied ? "denied" : "unavailable",
        loading: false,
        error: err?.message || "Joylashuvni aniqlashda xatolik yuz berdi.",
      });
      return null;
    }
  },

  // Toggle location sharing
  setShareLocation: async (uid, enabled) => {
    set({ shareLocation: enabled });
    const { currentLocation, showDistance } = get();
    if (uid && currentLocation) {
      await saveUserLocation(uid, currentLocation, currentLocation.city, {
        shareLocation: enabled,
        showDistance,
      });
    }
  },

  // Toggle distance display
  setShowDistance: async (uid, enabled) => {
    set({ showDistance: enabled });
    const { currentLocation, shareLocation } = get();
    if (uid && currentLocation) {
      await saveUserLocation(uid, currentLocation, currentLocation.city, {
        shareLocation,
        showDistance: enabled,
      });
    }
  },
}));
