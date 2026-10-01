/**
 * Calculates profile completion percentage and actionable missing items.
 * Uses real public profile fields only.
 */
export function getProfileCompletion(profile = {}) {
  const items = [
    {
      id: "photos",
      label: "Profil rasmi",
      description: "Yaxshi sifatli kamida 1 ta rasm qo'shing",
      completed: Array.isArray(profile.photos) && profile.photos.length > 0,
      weight: 20,
      tab: "photos",
    },
    {
      id: "displayName",
      label: "Ism",
      description: "To'liq ismingizni kiriting",
      completed: Boolean(profile.displayName && profile.displayName.trim().length >= 2),
      weight: 15,
      tab: "basic",
    },
    {
      id: "bio",
      label: "Haqida (Bio)",
      description: "O'zingiz, xarakteringiz haqida qisqacha ma'lumot",
      completed: Boolean(profile.bio && profile.bio.trim().length >= 10),
      weight: 15,
      tab: "bio",
    },
    {
      id: "interests",
      label: "Qiziqishlar",
      description: "Kamida 3 ta sevimli mashg'ulot tanlang",
      completed: Array.isArray(profile.interests) && profile.interests.length >= 3,
      weight: 15,
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
      description: "Qaysi shaharda yashashingizni belgilang",
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
