// tres perfiles "semilla" que siempre estan en el deck. no son usuarios reales
// pero se comportan como tal: si los likeas hacen match al instante y responden
// en el chat. los uid llevan prefijo bot_ para distinguirlos en firestore.

export const BOTS = [
  {
    uid: "bot_valentina",
    isBot: true,
    displayName: "Valentina",
    age: 26,
    bio: "Kunduzi dizayner, kechasi kinoman. Agar qahvani yoqtirmasangiz, munosabatimiz o'xsharmikin, bilmadim.",
    job: "UX dizayner",
    distanceKm: 3,
    interests: ["Qahva", "Kino", "Sayr"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80",
    ],
  },
  {
    uid: "bot_mateo",
    isBot: true,
    displayName: "Mateo",
    age: 29,
    bio: "Dam olish kunlari gitara chalib turaman va ko'ringanimdan ko'ra yaxshiroq ovqat pishiraman. Pleylistlarimni baham ko'radigan odam qidiryapman.",
    job: "Dasturiy ta'minot muhandisi",
    distanceKm: 7,
    interests: ["Musiqa", "Sayohat", "Pazandachilik"],
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    ],
  },
  {
    uid: "bot_camila",
    isBot: true,
    displayName: "Camila",
    age: 24,
    bio: "Itlarni va kutilmagan rejalarni yaxshi ko'raman. Sayohatdagi eng qiziq voqeangizni aytib bering.",
    job: "Veterinar",
    distanceKm: 12,
    interests: ["Itlar", "Sohil", "Mutolaa"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    ],
  },
];

// respuestas que va soltando el bot en el chat. se eligen en orden para que
// la conversacion se sienta natural y no repetida.
export const BOT_REPLIES = {
  bot_valentina: [
    "Salom! Match bo'lganimizdan xursand bo'ldim",
    "Qahvani ko'proq yoqtirasizmi yoki choynimi? Buni bilish muhim :)",
    "Ayting-chi, odatda shanba kunlari nima bilan bandsiz?",
    "Kecha ajoyib bir film ko'rdim, sizga ham tavsiya qilaman",
  ],
  bot_mateo: [
    "Siz bilan tanishganimdan juda xursandman!",
    "Biror yo'nalishdagi musiqani yoqtirasizmi yoki har xil tinglaysizmi?",
    "Sizni ovqatga taklif qilsam: shirinlikmi yoki taommi?",
    "Bu dam olish kunlari markazdagi barda kuylayman, kelsangiz bo'lardi",
  ],
  bot_camila: [
    "Salom! Nihoyat match bo'ldik :)",
    "Asosiy savol: itlarmi yoki mushuklar?",
    "Sohilga borishni rejalashtiryapman, bir kun birga boramizmi?",
    "Sayohat paytida qilgan eng qiziq yoki g'alati ishingizni aytib bering",
  ],
};

export const isBotUid = (uid) => typeof uid === "string" && uid.startsWith("bot_");
