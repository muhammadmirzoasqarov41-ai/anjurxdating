import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
  addDoc,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { BOTS, BOT_REPLIES, isBotUid } from "../data/bots";
import { filterAndSortDeck } from "./matching";

// helper: id de match deterministico a partir de dos uid ordenados, asi no
// importa quien dio like primero, siempre apuntamos al mismo documento.
export function matchIdFor(a, b) {
  return [a, b].sort().join("_");
}

// ---------- perfiles ----------

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "tinder_profiles", uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

export async function saveProfile(uid, data) {
  await setDoc(
    doc(db, "tinder_profiles", uid),
    { ...data, uid, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// Smart Matching Discover Deck:
// Real profiles + seed bots, filtering already swiped, applying user preferences & compatibility sorting
export async function getDeck(uid, myProfile = {}, filters = {}) {
  const swiped = await getSwipedIds(uid);

  // perfiles reales de otra gente
  const profilesSnap = await getDocs(collection(db, "tinder_profiles"));
  const others = profilesSnap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((p) => p.uid !== uid && !swiped.has(p.uid));

  // los bots tambien se filtran si ya los swipeaste
  const bots = BOTS.filter((b) => !swiped.has(b.uid));

  const allCandidates = [...bots, ...others];

  // Smart Matching engine: applies active filters & sorts by compatibility score
  return filterAndSortDeck(allCandidates, myProfile, filters);
}

// ---------- swipes ----------

async function getSwipedIds(uid) {
  const snap = await getDocs(collection(db, "tinder_swipes", uid, "likes"));
  const ids = new Set();
  snap.forEach((d) => ids.add(d.id));
  return ids;
}

// registra el swipe y, si corresponde, crea el match. devuelve el perfil con el
// que hiciste match (o null) para que la UI muestre el modal.
export async function recordSwipe(me, target, liked) {
  await setDoc(doc(db, "tinder_swipes", me.uid, "likes", target.uid), {
    liked,
    targetUid: target.uid,
    createdAt: serverTimestamp(),
  });

  if (!liked) return null;

  // un bot siempre te devuelve el like -> match inmediato
  if (isBotUid(target.uid)) {
    await createMatch(me, target);
    return target;
  }

  // usuario real: solo hay match si el otro ya te habia dado like
  const back = await getDoc(
    doc(db, "tinder_swipes", target.uid, "likes", me.uid)
  );
  if (back.exists() && back.data().liked) {
    await createMatch(me, target);
    return target;
  }

  return null;
}

// ---------- matches ----------

async function createMatch(me, target) {
  const id = matchIdFor(me.uid, target.uid);
  await setDoc(
    doc(db, "tinder_matches", id),
    {
      users: [me.uid, target.uid],
      // guardo una vista minima de cada perfil para pintar la lista sin
      // tener que leer cada perfil por separado
      profiles: {
        [me.uid]: { displayName: me.displayName, photo: me.photos?.[0] || null },
        [target.uid]: {
          displayName: target.displayName,
          photo: target.photos?.[0] || null,
        },
      },
      isBot: isBotUid(target.uid),
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getMatches(uid) {
  const q = query(
    collection(db, "tinder_matches"),
    where("users", "array-contains", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMatch(matchId) {
  const snap = await getDoc(doc(db, "tinder_matches", matchId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ---------- chat ----------

export function listenMessages(matchId, cb) {
  const q = query(
    collection(db, "tinder_matches", matchId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendMessage(matchId, senderUid, text) {
  await addDoc(collection(db, "tinder_matches", matchId, "messages"), {
    senderUid,
    text,
    createdAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, "tinder_matches", matchId),
    { lastMessage: text, lastMessageAt: serverTimestamp() },
    { merge: true }
  );
}

// cuando le escribes a un bot, contesta tras un pequeño delay con una de sus
// frases. cuento cuantos mensajes suyos hay para no repetir desde el inicio.
export async function maybeBotReply(matchId, botUid, existingBotMessages) {
  const replies = BOT_REPLIES[botUid];
  if (!replies) return;
  const next = replies[existingBotMessages % replies.length];
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  await sendMessage(matchId, botUid, next);
}

// ---------- utils ----------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
