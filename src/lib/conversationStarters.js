// Smart Conversation Starters based on real public profile data
// Privacy-compliant: only uses public interests, intention, and displayName.

const INTEREST_STARTER_MAP = {
  Musiqa: {
    topic: "Musiqa 🎵",
    common: "Musiqa sizga ham yoqarkan 🎵 Qaysi janr yoki san'atkorlarni ko'proq tinglaysiz?",
    single: "Profilingizda musiqaga qiziqishingizni ko'rdim 🎧 Qanday taronalarni yoqtirasiz?",
  },
  Sayohat: {
    topic: "Sayohat ✈️",
    common: "Sayohat qilish sizga ham yoqar ekan ✈️ Eng esda qolarli borgan joyingiz qaysi?",
    single: "Sayohatlarga qiziqarkansiz 🌍 Qaysi davlat yoki shaharga borish orzuingiz?",
  },
  Sport: {
    topic: "Sport 🏋️‍♂️",
    common: "Sport sizning ham sevimli mashg'ulotingiz ekan 🏋️‍♂️ Qanday sport turi bilan shug'ullanasiz?",
    single: "Sportga qiziqishingiz tahsinga loyiq 🏃‍♂️ Sevimli sport turingiz qaysi?",
  },
  Filmlar: {
    topic: "Filmlar 🎬",
    common: "Kino va filmlar sizga ham qiziq ekan 🎬 Oxirgi marta qaysi filmni tomosha qildingiz?",
    single: "Yaxshi filmlarni yoqtirarkansiz 🍿 Qaysi janrdagi kinolarni tavsiya qilasiz?",
  },
  Kitoblar: {
    topic: "Kitoblar 📚",
    common: "Kitob mutolaasi sizga ham yoqar ekan 📚 Hozirda qanday kitob o'qiyapsiz?",
    single: "Kitob o'qishga qiziqishingiz ajoyib 📖 Eng yoqqan asaringiz qaysi?",
  },
  Qahva: {
    topic: "Qahva ☕️",
    common: "Qahva ichishni yaxshi ko'rarkansiz ☕️ Sevimli qahvangiz qaysi?",
    single: "Qahva ichishni xush ko'rarkansiz ☕️ Qaysi turini ko'proq ichasiz?",
  },
  Texnologiya: {
    topic: "Texnologiya 💻",
    common: "Texnologiyalarga siz ham qiziqarkansiz 💻 Qaysi yo'nalish sizga ko'proq yoqadi?",
    single: "Zamonaviy texnologiyalarga qiziqishingiz ajoyib 🚀 Bu sohada ishlaysizmi?",
  },
  Pazandalik: {
    topic: "Taomlar 🍕",
    common: "Mazali taomlar va pazandalik sizga ham yoqarkan 🍕 Sevimli taomingiz nima?",
    single: "Pazandalikka qiziqishingiz juda yoqimli 🍽️ Qaysi oshxonani yoqtirasiz?",
  },
  Fotosurat: {
    topic: "Fotosurat 📸",
    common: "Suratga olish sizga ham yoqar ekan 📸 Ajoyib kadrlarni muhrlashni sevasizmi?",
    single: "Suratga olishga qiziqishingiz bor ekan 📷 Tabiatni suratga olasizmi yoki odamlarni?",
  },
  Sanat: {
    topic: "San'at 🎨",
    common: "San'atga bo'lgan qiziqishingiz tahsinga loyiq 🎨 Qaysi yo'nalish sizga yaqin?",
    single: "San'atga qiziqishingiz juda go'zal 🎭 Muzey yoki ko'rgazmalarga borib turasizmi?",
  },
  "Uy hayvonlari": {
    topic: "Jonivorlar 🐾",
    common: "Jonivorlarni sevar ekansiz 🐾 Sizda ham uy hayvoni bormi?",
    single: "Jonivorlarni yaxshi ko'rishingiz juda mehrli 🐶 Mushuklarni ko'proq yoqtirasizmi yoki itlarni?",
  },
  Tabiat: {
    topic: "Tabiat 🌲",
    common: "Tabiat qo'ynida dam olish sizga ham yoqar ekan 🌲 Bo'sh vaqtlarda tog'larga chiqib turasizmi?",
    single: "Tabiatni yaxshi ko'rarkansiz 🌿 Dam olish kunlarini tabiat qo'ynida o'tkazasizmi?",
  },
  Avtomobillar: {
    topic: "Avtomobil 🚗",
    common: "Avtomobillar olami sizga ham qiziq ekan 🚗 Sevimli mashina testingiz bormi?",
    single: "Avtomobillarga qiziqishingiz bor ekan 🏎️ Qaysi markani ko'proq yoqtirasiz?",
  },
  Raqs: {
    topic: "Raqs 💃",
    common: "Raqsga tushish sizga ham yoqar ekan 💃 Qanday raqs turlari yoqadi?",
    single: "Raqsga qiziqishingiz juda ajoyib 🕺 Faol hayot tarzini yoqtirasizmi?",
  },
  Moda: {
    topic: "Moda ✨",
    common: "Moda va still sizga ham qiziq ekan ✨ Didli kiyinishni yoqtirasizmi?",
    single: "Moda va uslubga qiziqishingiz ko'rinib turibdi 👗 Qaysi uslubni ma'qul ko'rasiz?",
  },
};

const GENERIC_STARTERS = [
  {
    id: "gen_1",
    topic: "Salomlashish 👋",
    badge: "Samimiy",
    text: "Salom! 👋 Kuningiz qanday o'tyapti?",
  },
  {
    id: "gen_2",
    topic: "Tanishuv ✨",
    badge: "Ijobiy",
    text: "Salom! Profilingiz juda samimiy va qiziqarli ko'rindi ✨",
  },
  {
    id: "gen_3",
    topic: "Match 💫",
    badge: "Match",
    text: "Match bo'lganimizdan xursandman! Suhbatlashsak bo'ladimi? 😊",
  },
  {
    id: "gen_4",
    topic: "Kayfiyat ☀️",
    badge: "Kayfiyat",
    text: "Salom! Bugungi kayfiyatingiz qanday? 😊",
  },
];

/**
 * Generates personalized, safe conversation starters based on real public profile data.
 * @param {object} myProfile - current user's profile
 * @param {object} otherProfile - target user's profile
 * @returns {Array<{ id: string, topic: string, badge: string, text: string }>}
 */
export function getConversationStarters(myProfile = {}, otherProfile = {}) {
  const starters = [];
  const myInterests = Array.isArray(myProfile?.interests)
    ? myProfile.interests
    : [];
  const otherInterests = Array.isArray(otherProfile?.interests)
    ? otherProfile.interests
    : [];

  // 1. Check for common interests
  const commonInterests = otherInterests.filter((item) =>
    myInterests.includes(item)
  );

  commonInterests.forEach((interest) => {
    // Check known interest mapping
    const mapped = INTEREST_STARTER_MAP[interest];
    if (mapped) {
      starters.push({
        id: `common_${interest}`,
        topic: mapped.topic,
        badge: "Umumiy qiziqish",
        text: mapped.common,
      });
    } else {
      starters.push({
        id: `common_${interest}`,
        topic: `${interest} 🌟`,
        badge: "Umumiy qiziqish",
        text: `${interest} sizga ham yoqar ekan! Bu haqda suhbatlashsak nima deysiz? 😊`,
      });
    }
  });

  // 2. If fewer than 2 starters, check target's other public interests
  if (starters.length < 2) {
    const singleInterests = otherInterests.filter(
      (item) => !commonInterests.includes(item)
    );
    for (const interest of singleInterests) {
      if (starters.length >= 3) break;
      const mapped = INTEREST_STARTER_MAP[interest];
      if (mapped) {
        starters.push({
          id: `target_${interest}`,
          topic: mapped.topic,
          badge: "Profil qiziqishi",
          text: mapped.single,
        });
      } else {
        starters.push({
          id: `target_${interest}`,
          topic: `${interest} ✨`,
          badge: "Profil qiziqishi",
          text: `Profilingizda ${interest}ga qiziqishingizni ko'rdim ✨ Qiziq mashg'ulot ekan!`,
        });
      }
    }
  }

  // 3. Dating intention match if available
  if (
    otherProfile?.datingIntention &&
    myProfile?.datingIntention &&
    otherProfile.datingIntention === myProfile.datingIntention &&
    starters.length < 3
  ) {
    starters.push({
      id: "intention_match",
      topic: `${otherProfile.datingIntention} 🎯`,
      badge: "Umumiy maqsad",
      text: `Bizning tanishuv maqsadimiz bir xil ekan: "${otherProfile.datingIntention}". Suhbatlashishga nima deysiz? 😊`,
    });
  }

  // 4. Fill remaining slots with warm, polite generic starters (up to 4 total)
  let genIdx = 0;
  while (starters.length < 4 && genIdx < GENERIC_STARTERS.length) {
    starters.push(GENERIC_STARTERS[genIdx]);
    genIdx++;
  }

  return starters.slice(0, 4);
}
