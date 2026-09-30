/**
 * Smart Matching Engine for AnjurXdating
 * 
 * Deterministic compatibility calculation based exclusively on real profile data:
 * - Mutual interests (overlap)
 * - Dating intention (goal alignment)
 * - Age preference & compatibility
 * - City / Location proximity
 * - Profile completeness & verification
 */

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

/**
 * Calculates a deterministic compatibility score between current user and candidate profile.
 * No random numbers! Same two profiles will always produce the exact same score.
 */
export function calculateCompatibility(me = {}, target = {}) {
  let score = 55; // Base baseline score
  const matchReasons = [];

  // 1. Mutual Interests (up to +25%)
  const myInterests = Array.isArray(me?.interests) ? me.interests : [];
  const targetInterests = Array.isArray(target?.interests) ? target.interests : [];

  const mutualInterests = myInterests.filter((item) =>
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
  const myIntention = me?.datingIntention || me?.preferences?.datingIntention;
  const targetIntention = target?.datingIntention;

  if (myIntention && targetIntention) {
    if (myIntention.trim().toLowerCase() === targetIntention.trim().toLowerCase()) {
      score += 15;
      matchReasons.push(`Bir xil tanishuv maqsadi: "${myIntention}"`);
    }
  }

  // 3. Location / City Compatibility (up to +10%)
  const myCity = (me?.city || "").trim().toLowerCase();
  const targetCity = (target?.city || "").trim().toLowerCase();

  if (myCity && targetCity && myCity === targetCity) {
    score += 10;
    matchReasons.push(`Bir xil hudud: ${target.city}`);
  } else if (
    typeof target?.distanceKm === "number" &&
    target.distanceKm <= 15
  ) {
    score += 6;
    matchReasons.push(`Yaqin masofada (${target.distanceKm} km)`);
  }

  // 4. Age compatibility & preference (up to +10%)
  const myAge = Number(me?.age);
  const targetAge = Number(target?.age);
  const preferredMinAge = Number(me?.preferences?.minAge) || 18;
  const preferredMaxAge = Number(me?.preferences?.maxAge) || 50;

  if (targetAge) {
    if (targetAge >= preferredMinAge && targetAge <= preferredMaxAge) {
      score += 6;
    }
    if (myAge && Math.abs(myAge - targetAge) <= 3) {
      score += 4;
      matchReasons.push("Yoshi sizga juda mos");
    }
  }

  // 5. Profile Quality bonus (up to +5%)
  if (target?.bio && target.bio.trim().length > 30) {
    score += 2;
  }
  if (Array.isArray(target?.photos) && target.photos.length >= 2) {
    score += 2;
  }
  if (target?.verified || target?.isVerified) {
    score += 1;
    matchReasons.push("Tasdiqlangan profil");
  }

  // Normalize between 50% and 98%
  score = Math.min(98, Math.max(50, Math.round(score)));

  return {
    score,
    mutualInterests,
    matchReasons,
  };
}

/**
 * Filters and sorts raw candidate profiles according to user preferences and compatibility score.
 */
export function filterAndSortDeck(rawCards = [], me = {}, filters = {}) {
  const result = [];

  // Active filter criteria
  const minAge = filters?.minAge ? Number(filters.minAge) : null;
  const maxAge = filters?.maxAge ? Number(filters.maxAge) : null;
  const genderFilter = filters?.gender && filters.gender !== "all" ? filters.gender : null;
  const datingIntentionFilter =
    filters?.datingIntention && filters.datingIntention !== "all"
      ? filters.datingIntention
      : null;
  const cityFilter = filters?.city && filters.city !== "all" ? filters.city : null;
  const maxDistance = filters?.maxDistance ? Number(filters.maxDistance) : null;
  const requiredInterest = filters?.interest && filters.interest !== "all" ? filters.interest : null;

  for (const card of rawCards) {
    // 1. Filter: Age
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

    // 5. Filter: Distance
    if (maxDistance && typeof card.distanceKm === "number") {
      if (card.distanceKm > maxDistance) continue;
    }

    // 6. Filter: Specific Interest
    if (requiredInterest) {
      const interests = Array.isArray(card.interests) ? card.interests : [];
      const hasInterest = interests.some(
        (i) => i.trim().toLowerCase() === requiredInterest.trim().toLowerCase()
      );
      if (!hasInterest) continue;
    }

    // Calculate real compatibility
    const compatibility = calculateCompatibility(me, card);

    result.push({
      ...card,
      compatibility,
    });
  }

  // Sort: highest compatibility score first, then mutual interests count, then distance
  result.sort((a, b) => {
    const scoreDiff = (b.compatibility?.score || 50) - (a.compatibility?.score || 50);
    if (scoreDiff !== 0) return scoreDiff;

    const mutualDiff =
      (b.compatibility?.mutualInterests?.length || 0) -
      (a.compatibility?.mutualInterests?.length || 0);
    if (mutualDiff !== 0) return mutualDiff;

    const distA = typeof a.distanceKm === "number" ? a.distanceKm : 999;
    const distB = typeof b.distanceKm === "number" ? b.distanceKm : 999;
    return distA - distB;
  });

  return result;
}
