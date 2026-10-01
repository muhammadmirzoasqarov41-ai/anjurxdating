import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
  addDoc,
  orderBy,
  limit,
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

// ---------- blocks ----------

export async function getBlockedIds(uid) {
  try {
    const snap = await getDocs(collection(db, "tinder_blocks", uid, "blocked"));
    const ids = new Set();
    snap.forEach((d) => ids.add(d.id));
    return ids;
  } catch (err) {
    return new Set();
  }
}

export async function blockUser(uid, targetUid) {
  await setDoc(doc(db, "tinder_blocks", uid, "blocked", targetUid), {
    blockedUid: targetUid,
    createdAt: serverTimestamp(),
  });
}

// ---------- favorites ----------

export async function addFavorite(uid, target) {
  await setDoc(doc(db, "tinder_favorites", uid, "items", target.uid), {
    targetUid: target.uid,
    displayName: target.displayName || "Foydalanuvchi",
    photo: target.photos?.[0] || null,
    photos: target.photos || [],
    age: target.age || null,
    city: target.city || "",
    job: target.job || "",
    bio: target.bio || "",
    datingIntention: target.datingIntention || "",
    interests: target.interests || [],
    languages: target.languages || [],
    verified: Boolean(target.verified || target.isVerified),
    createdAt: serverTimestamp(),
  });
}

export async function removeFavorite(uid, targetUid) {
  await deleteDoc(doc(db, "tinder_favorites", uid, "items", targetUid));
}

export async function getFavorites(uid) {
  try {
    const q = query(
      collection(db, "tinder_favorites", uid, "items"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        uid: data.targetUid || d.id,
      };
    });
  } catch (err) {
    console.error("Favorites yuklashda xatolik:", err);
    return [];
  }
}

export async function isFavorited(uid, targetUid) {
  try {
    const snap = await getDoc(
      doc(db, "tinder_favorites", uid, "items", targetUid)
    );
    return snap.exists();
  } catch {
    return false;
  }
}

// Smart Matching Discover Deck:
// Real profiles + seed bots, filtering already swiped, blocked, applying user preferences & compatibility sorting
export async function getDeck(uid, myProfile = {}, filters = {}) {
  const [swiped, blocked] = await Promise.all([
    getSwipedIds(uid),
    getBlockedIds(uid),
  ]);

  // perfiles reales de otra gente (with limit for performance optimization)
  const profilesSnap = await getDocs(
    query(collection(db, "tinder_profiles"), limit(100))
  );
  const others = profilesSnap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((p) => p.uid !== uid && !swiped.has(p.uid) && !blocked.has(p.uid));

  // los bots tambien se filtran si ya los swipeaste o bloqueaste
  const bots = BOTS.filter((b) => !swiped.has(b.uid) && !blocked.has(b.uid));

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

// registra el swipe (Like, Nope, Super Like) y, si corresponde, crea el match.
export async function recordSwipe(me, target, liked, isSuperLike = false) {
  // 1. Record swipe in user's likes collection
  await setDoc(doc(db, "tinder_swipes", me.uid, "likes", target.uid), {
    liked,
    superLike: Boolean(isSuperLike),
    targetUid: target.uid,
    createdAt: serverTimestamp(),
  });

  // 2. If Super Like, record in tinder_super_likes
  if (isSuperLike) {
    try {
      await setDoc(doc(db, "tinder_super_likes", `${me.uid}_${target.uid}`), {
        id: `${me.uid}_${target.uid}`,
        fromUid: me.uid,
        toUid: target.uid,
        fromProfile: {
          displayName: me.displayName || "Foydalanuvchi",
          photo: me.photos?.[0] || null,
          city: me.city || "",
          age: me.age || null,
        },
        createdAt: serverTimestamp(),
        status: "active",
      });
    } catch (err) {
      console.warn("Could not save to tinder_super_likes:", err);
    }
  }

  if (!liked) return null;

  // un bot siempre te devuelve el like -> match inmediato
  if (isBotUid(target.uid)) {
    await createMatch(me, target, isSuperLike);
    return { ...target, isSuperLike };
  }

  // usuario real: solo hay match si el otro ya te habia dado like
  const back = await getDoc(
    doc(db, "tinder_swipes", target.uid, "likes", me.uid)
  );
  if (back.exists() && back.data().liked) {
    const wasSuper = Boolean(isSuperLike || back.data().superLike);
    await createMatch(me, target, wasSuper);
    return { ...target, isSuperLike: wasSuper };
  }

  return null;
}

// ---------- matches ----------

async function createMatch(me, target, isSuperLike = false) {
  const id = matchIdFor(me.uid, target.uid);
  await setDoc(
    doc(db, "tinder_matches", id),
    {
      users: [me.uid, target.uid],
      // guardo una vista minima de cada perfil para pintar la lista sin
      // tener que leer cada perfil por separado
      profiles: {
        [me.uid]: {
          displayName: me.displayName,
          photo: me.photos?.[0] || null,
        },
        [target.uid]: {
          displayName: target.displayName,
          photo: target.photos?.[0] || null,
        },
      },
      isBot: isBotUid(target.uid),
      isSuperLike: Boolean(isSuperLike),
      superLikedBy: isSuperLike ? me.uid : null,
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
