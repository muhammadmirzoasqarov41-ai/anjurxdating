/**
 * Calculates profile completion percentage and actionable missing items.
 * Uses real public profile fields only.
 */
export function getProfileCompletion(profile = {}) {
  const items = [
    {
      id: "photos",
      label: "Profil suratlari",
      description: "Kamida 2 ta sifatli fotosurat yuklang",
      completed: Array.isArray(profile.photos) && profile.photos.length >= 2,
      weight: 15,
      tab: "photos",
    },
    {
      id: "displayName",
      label: "Ism",
      description: "To'liq ismingizni kiriting",
      completed: Boolean(profile.displayName && profile.displayName.trim().length >= 2),
      weight: 10,
      tab: "basic",
    },
    {
      id: "bio",
      label: "Haqida (Bio)",
      description: "O'zingiz, xarakteringiz haqida qisqacha ma'lumot (15+ belgi)",
      completed: Boolean(profile.bio && profile.bio.trim().length >= 15),
      weight: 10,
      tab: "bio",
    },
    {
      id: "interests",
      label: "Qiziqishlar",
      description: "Kamida 3 ta sevimli mashg'ulot tanlang",
      completed: Array.isArray(profile.interests) && profile.interests.length >= 3,
      weight: 10,
      tab: "interests",
    },
    {
      id: "age",
      label: "Yosh",
      description: "Yoshingizni belgilang (18+)",
      completed: Boolean(profile.age && Number(profile.age) >= 18),
      weight: 10,
      tab: "basic",
    },
    {
      id: "datingIntention",
      label: "Tanishuv maqsadi",
      description: "Ilovadan nima qidirayotganingizni ko'rsating",
      completed: Boolean(profile.datingIntention && profile.datingIntention.trim()),
      weight: 10,
      tab: "intentions",
    },
    {
      id: "city",
      label: "Shahar / Manzil",
      description: "Qaysi hududda yashashingizni belgilang",
      completed: Boolean(profile.city && profile.city.trim()),
      weight: 10,
      tab: "basic",
    },
    {
      id: "languages",
      label: "Tillar",
      description: "Muloqot qiladigan tillaringizni tanlang",
      completed: Array.isArray(profile.languages) && profile.languages.length > 0,
      weight: 5,
      tab: "languages",
    },
    {
      id: "preferences",
      label: "Tanishuv afzalliklari",
      description: "Yosh, masofa va qidiruv afzalliklarini sozlang",
      completed: Boolean(profile.preferences && (profile.preferences.minAge || profile.preferences.maxAge)),
      weight: 10,
      tab: "preferences",
    },
    {
      id: "verification",
      label: "Profilni tasdiqlash (Verified)",
      description: "Suratingiz bilan shaxsingizni tasdiqlang",
      completed: Boolean(profile.verified || profile.isVerified),
      weight: 10,
      tab: "verification",
    },
  ];

  let percentage = 0;
  items.forEach((item) => {
    if (item.completed) {
      percentage += item.weight;
    }
  });

  percentage = Math.min(100, Math.max(0, percentage));

  const completedCount = items.filter((i) => i.completed).length;
  const missingItems = items.filter((i) => !i.completed);

  return {
    percentage,
    completedCount,
    totalCount: items.length,
    items,
    missingItems,
    isComplete: percentage === 100,
  };
}

/**
 * Calculates Profile Quality & Trust Level based on real signals:
 * - Photo count
 * - Bio length
 * - Interests count
 * - Dating intention
 * - Location availability
 * - Verification status
 */
export function getProfileQuality(profile = {}) {
  const isVerified = Boolean(profile.verified || profile.isVerified);
  const photosCount = Array.isArray(profile.photos) ? profile.photos.length : 0;
  const bioLen = (profile.bio || "").trim().length;
  const interestsCount = Array.isArray(profile.interests) ? profile.interests.length : 0;
  const hasIntention = Boolean(profile.datingIntention);
  const hasLocation = Boolean(profile.city || profile.approxLocation);

  let qualityScore = 0;
  if (photosCount >= 1) qualityScore += 15;
  if (photosCount >= 3) qualityScore += 10;
  if (bioLen >= 20) qualityScore += 15;
  if (interestsCount >= 3) qualityScore += 15;
  if (hasIntention) qualityScore += 15;
  if (hasLocation) qualityScore += 10;
  if (isVerified) qualityScore += 20;

  qualityScore = Math.min(100, qualityScore);

  let level = "Boshlang'ich";
  let badgeColor = "text-amber-600 bg-amber-50 border-amber-200";

  if (qualityScore >= 80 && isVerified) {
    level = "A'lo (Verified)";
    badgeColor = "text-sky-700 bg-sky-50 border-sky-200";
  } else if (qualityScore >= 60) {
    level = "Yaxshi";
    badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  }

  const tips = [];
  if (!isVerified) tips.push("Moviy nishon olish uchun profilingizni tasdiqlang");
  if (photosCount < 3) tips.push("Ko'proq e'tibor qozonish uchun kamida 3 ta rasm qo'shing");
  if (bioLen < 30) tips.push("O'zingiz haqingizda batafsilroq ma'lumot yozing");

  return {
    score: qualityScore,
    level,
    badgeColor,
    isVerified,
    tips,
  };
}
