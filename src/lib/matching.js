/**
 * Smart Matching Engine for AnjurXdating
 * 
 * Deterministic compatibility calculation based exclusively on real profile data:
 * - Mutual interests (overlap)
 * - Dating intention (goal alignment)
 * - Age preference & compatibility
 * - Real geographic distance (Haversine formula & coarse privacy grid)
 * - City / Location proximity
 * - Languages matching
 * - Profile completeness & verification
 */

import { calculateProfileDistance, formatDistance } from "./location";

export const STANDARD_INTERESTS = [
  "Qahva",
  "Kino",
  "Sayr",
  "Musiqa",
  "Sayohat",
  "Pazandachilik",
  "Kitoblar",
  "Sport",
  "Fitness",
  "IT & Texnologiya",
  "San'at",
  "Fotografiya",
  "Avto",
  "Psixologiya",
  "O'yinlar (Gaming)",
];

export const DATING_INTENTIONS = [
  "Jiddiy munosabatlar",
  "Do'stlik va muloqot",
  "Bir piyola qahva ustida suhbat",
  "Hali bir qarorga kelmadim",
];

export const CITIES = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Xorazm",
  "Navoiy",
  "Qashqadaryo",
  "Surxondaryo",
  "Jizzax",
  "Sirdaryo",
];

export const STANDARD_LANGUAGES = [
  "O'zbekcha",
  "Ruscha",
  "Inglizcha",
  "Turkcha",
  "Qoraqalpoqcha",
];

export const DEFAULT_PREFERENCES = {
  minAge: 18,
  maxAge: 50,
  gender: "all", // "all" | "female" | "male"
  maxDistanceKm: 100, // 5 to 500 km, 0 = unlimited
  datingIntention: "all", // "all" or specific intention
  interests: [], // Array of preferred interests
  languages: [], // Array of preferred languages
  onlyVerified: false,
  onlyOnline: false,
};

/**
 * Calculates a deterministic compatibility score between current user and candidate profile.
 * Incorporates real calculated geographic distance and dating preferences.
 */
export function calculateCompatibility(me = {}, target = {}) {
  let score = 55; // Base baseline score
  const matchReasons = [];

  // 1. Mutual Interests (up to +25%)
  const myInterests = Array.isArray(me?.interests) ? me.interests : [];
  const preferredInterests = Array.isArray(me?.preferences?.interests)
    ? me.preferences.interests
    : [];
  const targetInterests = Array.isArray(target?.interests) ? target.interests : [];

  const combinedMyInterests = Array.from(
    new Set([...myInterests, ...preferredInterests])
  );

  const mutualInterests = combinedMyInterests.filter((item) =>
    targetInterests.some(
      (ti) => ti.trim().toLowerCase() === item.trim().toLowerCase()
    )
  );

  if (mutualInterests.length > 0) {
    const interestBoost = Math.min(25, mutualInterests.length * 8);
    score += interestBoost;
    matchReasons.push(
      `${mutualInterests.length} ta umumiy qiziqish (${mutualInterests.slice(0, 3).join(", ")})`
    );
  }

  // 2. Dating Intention Alignment (up to +15%)
  const myIntention =
    me?.preferences?.datingIntention && me.preferences.datingIntention !== "all"
      ? me.preferences.datingIntention
      : me?.datingIntention;
  const targetIntention = target?.datingIntention;

  if (myIntention && targetIntention) {
    if (myIntention.trim().toLowerCase() === targetIntention.trim().toLowerCase()) {
      score += 15;
      matchReasons.push(`Bir xil tanishuv maqsadi: "${myIntention}"`);
    }
  }

  // 3. Real Location / Distance Compatibility (up to +12%)
  const realDistanceKm = calculateProfileDistance(me, target);
  const myCity = (me?.city || "").trim().toLowerCase();
  const targetCity = (target?.city || "").trim().toLowerCase();

  if (typeof realDistanceKm === "number") {
    if (realDistanceKm <= 10) {
      score += 12;
      matchReasons.push(`Yaqin masofada (${formatDistance(realDistanceKm)})`);
    } else if (realDistanceKm <= 25) {
      score += 8;
      matchReasons.push(`Bir hududda (${formatDistance(realDistanceKm)})`);
    } else if (realDistanceKm <= 60) {
      score += 4;
    }
  } else if (myCity && targetCity && myCity === targetCity) {
    score += 8;
    matchReasons.push(`Bir xil shahar: ${target.city}`);
  }

  // 4. Age compatibility & preference (up to +10%)
  const myAge = Number(me?.age);
  const targetAge = Number(target?.age);
  const preferredMinAge = Number(me?.preferences?.minAge) || 18;
  const preferredMaxAge = Number(me?.preferences?.maxAge) || 50;

  if (targetAge) {
    if (targetAge >= preferredMinAge && targetAge <= preferredMaxAge) {
      score += 6;
      matchReasons.push("Siz tanlagan yosh oralig'ida");
    }
    if (myAge && Math.abs(myAge - targetAge) <= 3) {
      score += 4;
      if (!matchReasons.includes("Siz tanlagan yosh oralig'ida")) {
        matchReasons.push("Yoshi sizga juda yaqin");
      }
    }
  }

  // 5. Language compatibility (up to +5%)
  const myLangs = Array.isArray(me?.languages) ? me.languages : [];
  const preferredLangs = Array.isArray(me?.preferences?.languages)
    ? me.preferences.languages
    : [];
  const combinedMyLangs = Array.from(new Set([...myLangs, ...preferredLangs]));
  const targetLangs = Array.isArray(target?.languages) ? target.languages : [];

  const sharedLangs = combinedMyLangs.filter((l) =>
    targetLangs.some((tl) => tl.toLowerCase().trim() === l.toLowerCase().trim())
  );
  if (sharedLangs.length > 0) {
    score += 4;
    matchReasons.push(`Umumiy muloqot tili: ${sharedLangs[0]}`);
  }

  // 6. Profile Quality & Verification bonus (up to +5%)
  if (target?.bio && target.bio.trim().length > 30) {
    score += 2;
  }
  if (Array.isArray(target?.photos) && target.photos.length >= 2) {
    score += 2;
  }
  if (target?.verified || target?.isVerified) {
    score += 2;
    matchReasons.push("Tasdiqlangan ishonchli profil");
  }

  // Normalize between 50% and 98%
  score = Math.min(98, Math.max(50, Math.round(score)));

  return {
    score,
    mutualInterests,
    matchReasons,
    realDistanceKm,
  };
}

/**
 * Filters and sorts raw candidate profiles according to user preferences and compatibility score.
 */
export function filterAndSortDeck(rawCards = [], me = {}, filters = {}) {
  const result = [];
  const prefs = me?.preferences || {};

  // Active filter criteria: explicit filters take precedence, otherwise persistent preferences are used
  const minAge = filters?.minAge !== undefined ? Number(filters.minAge) : (Number(prefs.minAge) || 18);
  const maxAge = filters?.maxAge !== undefined ? Number(filters.maxAge) : (Number(prefs.maxAge) || 75);
  const genderFilter =
    filters?.gender && filters.gender !== "all"
      ? filters.gender
      : (prefs?.gender && prefs.gender !== "all" ? prefs.gender : null);

  const datingIntentionFilter =
    filters?.datingIntention && filters.datingIntention !== "all"
      ? filters.datingIntention
      : (prefs?.datingIntention && prefs.datingIntention !== "all" ? prefs.datingIntention : null);

  const cityFilter = filters?.city && filters.city !== "all" ? filters.city : null;

  const maxDistance =
    filters?.maxDistance !== undefined && Number(filters.maxDistance) > 0
      ? Number(filters.maxDistance)
      : (Number(prefs.maxDistanceKm) > 0 ? Number(prefs.maxDistanceKm) : null);

  const requiredInterest = filters?.interest && filters.interest !== "all" ? filters.interest : null;
  const preferredInterests = Array.isArray(prefs.interests) ? prefs.interests : [];

  const languageFilter = filters?.language && filters.language !== "all" ? filters.language : null;
  const preferredLanguages = Array.isArray(prefs.languages) ? prefs.languages : [];

  const verifiedOnly = Boolean(
    filters?.verifiedOnly !== undefined ? filters.verifiedOnly : prefs.onlyVerified
  );
  const onlineOnly = Boolean(
    filters?.onlineOnly !== undefined ? filters.onlineOnly : prefs.onlyOnline
  );
  const newOnly = Boolean(filters?.newOnly);

  for (const card of rawCards) {
    // Calculate real distance using real location / coordinates
    const realDistanceKm = calculateProfileDistance(me, card);
    card.realDistanceKm = realDistanceKm;

    // 1. Filter: Age (Safe boundary check)
    if (card.age) {
      if (minAge && card.age < minAge) continue;
      if (maxAge && card.age > maxAge) continue;
    }

    // 2. Filter: Gender
    if (genderFilter && card.gender) {
      if (card.gender.toLowerCase() !== genderFilter.toLowerCase()) continue;
    }

    // 3. Filter: Dating Intention
    if (datingIntentionFilter && card.datingIntention) {
      if (
        card.datingIntention.trim().toLowerCase() !==
        datingIntentionFilter.trim().toLowerCase()
      ) {
        continue;
      }
    }

    // 4. Filter: City
    if (cityFilter && card.city) {
      if (card.city.trim().toLowerCase() !== cityFilter.trim().toLowerCase()) {
        continue;
      }
    }

    // 5. Filter: Real Distance in km
    if (maxDistance) {
      if (typeof card.realDistanceKm === "number") {
        if (card.realDistanceKm > maxDistance) continue;
      } else {
        // If candidate has no location, but user filtered by distance:
        if (me?.city && card.city && me.city.toLowerCase() !== card.city.toLowerCase()) {
          continue;
        }
      }
    }

    // 6. Filter: Specific Interest (Must match if required)
    if (requiredInterest) {
      const interests = Array.isArray(card.interests) ? card.interests : [];
      const hasInterest = interests.some(
        (i) => i.trim().toLowerCase() === requiredInterest.trim().toLowerCase()
      );
      if (!hasInterest) continue;
    }

    // 7. Filter: Specific Language
    if (languageFilter) {
      const langs = Array.isArray(card.languages) ? card.languages : [];
      const hasLang = langs.some(
        (l) => l.trim().toLowerCase() === languageFilter.trim().toLowerCase()
      );
      if (!hasLang) continue;
    }

    // 8. Filter: Verified profile only
    if (verifiedOnly && !card.verified && !card.isVerified) {
      continue;
    }

    // 9. Filter: Online status only
    if (onlineOnly && !card.online && !card.isOnline) {
      continue;
    }

    // 10. Filter: New profile only
    if (newOnly && !card.isNew) {
      const createdAtMs = card.createdAt?.toMillis ? card.createdAt.toMillis() : null;
      const isRecent = createdAtMs && Date.now() - createdAtMs < 14 * 86400 * 1000;
      if (!isRecent) continue;
    }

    // Calculate real compatibility (incorporating real distance & preferences)
    const compatibility = calculateCompatibility(me, card);

    // Boost compatibility if card shares preferred interests
    if (preferredInterests.length > 0) {
      const cardInterests = Array.isArray(card.interests) ? card.interests : [];
      const hasPrefInterest = preferredInterests.some((pi) =>
        cardInterests.some((ci) => ci.trim().toLowerCase() === pi.trim().toLowerCase())
      );
      if (hasPrefInterest) {
        compatibility.score = Math.min(99, compatibility.score + 5);
      }
    }

    // Boost compatibility if card speaks preferred languages
    if (preferredLanguages.length > 0) {
      const cardLangs = Array.isArray(card.languages) ? card.languages : [];
      const hasPrefLang = preferredLanguages.some((pl) =>
        cardLangs.some((cl) => cl.trim().toLowerCase() === pl.trim().toLowerCase())
      );
      if (hasPrefLang) {
        compatibility.score = Math.min(99, compatibility.score + 3);
      }
    }

    result.push({
      ...card,
      compatibility,
      realDistanceKm,
    });
  }

  // Smart Sorting:
  // 1. Higher compatibility score
  // 2. More common interests
  // 3. Closer real distance
  // 4. Verified profiles boost
  // 5. Online/active profiles
  result.sort((a, b) => {
    const scoreDiff = (b.compatibility?.score || 50) - (a.compatibility?.score || 50);
    if (scoreDiff !== 0) return scoreDiff;

    const mutualDiff =
      (b.compatibility?.mutualInterests?.length || 0) -
      (a.compatibility?.mutualInterests?.length || 0);
    if (mutualDiff !== 0) return mutualDiff;

    const distA = typeof a.realDistanceKm === "number" ? a.realDistanceKm : 9999;
    const distB = typeof b.realDistanceKm === "number" ? b.realDistanceKm : 9999;
    if (distA !== distB) return distA - distB;

    const verifiedA = a.verified || a.isVerified ? 1 : 0;
    const verifiedB = b.verified || b.isVerified ? 1 : 0;
    if (verifiedB !== verifiedA) return verifiedB - verifiedA;

    const onlineA = a.online || a.isOnline ? 1 : 0;
    const onlineB = b.online || b.isOnline ? 1 : 0;
    return onlineB - onlineA;
  });

  return result;
}
