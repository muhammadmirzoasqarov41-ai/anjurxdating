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

// helper: deterministic matchId from two sorted UIDs
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

// User Presence tracking
export async function updateUserPresence(uid, online = true) {
  if (!uid) return;
  try {
    await setDoc(
      doc(db, "tinder_profiles", uid),
      {
        online,
        lastSeenAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Ignore error silently
  }
}

// ---------- blocks & safety ----------

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

export async function blockUser(uid, target) {
  const targetUid = typeof target === "string" ? target : target.uid;
  const targetProfile = typeof target === "object" ? target : {};

  await setDoc(doc(db, "tinder_blocks", uid, "blocked", targetUid), {
    blockedUid: targetUid,
    displayName: targetProfile.displayName || "Foydalanuvchi",
    photo: targetProfile.photos?.[0] || targetProfile.photo || null,
    createdAt: serverTimestamp(),
  });

  // Remove from favorites if saved
  try {
    await removeFavorite(uid, targetUid);
  } catch (err) {}

  // Delete match if exists
  const matchId = matchIdFor(uid, targetUid);
  try {
    await deleteDoc(doc(db, "tinder_matches", matchId));
  } catch (err) {}

  // Remove like swipe
  try {
    await deleteDoc(doc(db, "tinder_swipes", uid, "likes", targetUid));
  } catch (err) {}
}

export async function unblockUser(uid, targetUid) {
  await deleteDoc(doc(db, "tinder_blocks", uid, "blocked", targetUid));
}

export async function getBlockedUsers(uid) {
  try {
    const q = query(
      collection(db, "tinder_blocks", uid, "blocked"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    const snap = await getDocs(collection(db, "tinder_blocks", uid, "blocked"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export async function isUserBlockedEitherWay(myUid, otherUid) {
  if (!myUid || !otherUid) return false;
  try {
    const [myBlock, otherBlock] = await Promise.all([
      getDoc(doc(db, "tinder_blocks", myUid, "blocked", otherUid)),
      getDoc(doc(db, "tinder_blocks", otherUid, "blocked", myUid)).catch(() => ({ exists: () => false })),
    ]);
    return myBlock.exists() || (otherBlock?.exists && otherBlock.exists());
  } catch (err) {
    return false;
  }
}

export async function unmatchUsers(myUid, targetUid, matchId) {
  if (!matchId) return;
  // 1. Delete match document
  await deleteDoc(doc(db, "tinder_matches", matchId));

  // 2. Remove swipe like records
  try {
    await deleteDoc(doc(db, "tinder_swipes", myUid, "likes", targetUid));
  } catch (err) {}
}

// Reports
export async function createReport({
  reporterUid,
  reporterName,
  reportedUid,
  reportedName,
  reason,
  description = "",
  source = "profile",
}) {
  const docRef = await addDoc(collection(db, "reports"), {
    reporterUid,
    reporterId: reporterUid,
    reporterName: reporterName || "Foydalanuvchi",
    reportedUid,
    reportedUserId: reportedUid,
    reportedUserName: reportedName || "Foydalanuvchi",
    reason: reason || "Boshqa",
    description: (description || "").trim(),
    source: source || "profile",
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Privacy Settings
export async function updatePrivacySettings(uid, privacySettings) {
  await setDoc(
    doc(db, "tinder_profiles", uid),
    {
      privacy: privacySettings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
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
    .filter(
      (p) =>
        p.uid !== uid &&
        !swiped.has(p.uid) &&
        !blocked.has(p.uid) &&
        p.privacy?.isPublic !== false
    );

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

  // 2. If Super Like, record in tinder_super_likes and send notification
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

      // Send Super Like notification to target if real user
      if (!isBotUid(target.uid)) {
        createNotification(target.uid, {
          id: `superlike_${me.uid}_${target.uid}`,
          type: "super_like",
          title: "Super Like ⭐",
          message: `${me.displayName || "Foydalanuvchi"} sizga Super Like yubordi!`,
          senderUid: me.uid,
          senderName: me.displayName || "Foydalanuvchi",
          senderPhoto: me.photos?.[0] || null,
          relatedId: me.uid,
          route: "/",
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("Could not save to tinder_super_likes:", err);
    }
  } else if (liked && !isBotUid(target.uid)) {
    // Regular Like notification (safe, privacy-compliant)
    createNotification(target.uid, {
      id: `like_${me.uid}_${target.uid}`,
      type: "like",
      title: "Yangi Like ✨",
      message: "Kimdir profilingizni yoqtirdi! Discover orqali yangi insonlarni kashf eting.",
      senderUid: me.uid,
      relatedId: me.uid,
      route: "/",
    }).catch(() => {});
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
      lastSenderUid: null,
      unreadBy: [],
    },
    { merge: true }
  );

  // Send Match notifications to both users
  try {
    // Notification for me
    createNotification(me.uid, {
      id: `match_${id}`,
      type: "new_match",
      title: "Yangi Match! ❤️",
      message: `${target.displayName} bilan bir-biringizga yoqdingiz!`,
      senderUid: target.uid,
      senderName: target.displayName,
      senderPhoto: target.photos?.[0] || null,
      relatedId: id,
      route: `/chat/${id}`,
    }).catch(() => {});

    // Notification for target (if not a bot)
    if (!isBotUid(target.uid)) {
      createNotification(target.uid, {
        id: `match_${id}`,
        type: "new_match",
        title: "Yangi Match! ❤️",
        message: `${me.displayName} bilan bir-biringizga yoqdingiz!`,
        senderUid: me.uid,
        senderName: me.displayName,
        senderPhoto: me.photos?.[0] || null,
        relatedId: id,
        route: `/chat/${id}`,
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Could not send match notifications:", err);
  }
}

export async function getMatches(uid) {
  const q = query(
    collection(db, "tinder_matches"),
    where("users", "array-contains", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Real-time listener for current user's matches and unread status
export function listenUserMatches(uid, cb) {
  if (!uid) return () => {};
  const q = query(
    collection(db, "tinder_matches"),
    where("users", "array-contains", uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis
          ? a.lastMessageAt.toMillis()
          : a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : 0;
        const tb = b.lastMessageAt?.toMillis
          ? b.lastMessageAt.toMillis()
          : b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : 0;
        return tb - ta;
      });
      cb(list);
    },
    (err) => {
      console.warn("listenUserMatches error:", err);
    }
  );
}

export async function getMatch(matchId) {
  const snap = await getDoc(doc(db, "tinder_matches", matchId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Real-time match document listener
export function listenMatch(matchId, cb) {
  return onSnapshot(doc(db, "tinder_matches", matchId), (snap) => {
    if (snap.exists()) {
      cb({ id: snap.id, ...snap.data() });
    }
  });
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

export async function sendMessage(matchId, senderUid, text, receiverUid = null) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const docRef = await addDoc(
    collection(db, "tinder_matches", matchId, "messages"),
    {
      senderUid,
      receiverUid: receiverUid || null,
      text: trimmed,
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
    }
  );

  const matchUpdate = {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastSenderUid: senderUid,
  };

  if (receiverUid) {
    matchUpdate.unreadBy = [receiverUid];
  }

  await setDoc(doc(db, "tinder_matches", matchId), matchUpdate, {
    merge: true,
  });

  // If receiver is a real user, trigger real-time message notification
  if (receiverUid && !isBotUid(receiverUid)) {
    try {
      const preview = trimmed.length > 50 ? trimmed.slice(0, 50) + "..." : trimmed;
      createNotification(receiverUid, {
        id: `msg_${docRef.id}`,
        type: "new_message",
        title: "Yangi xabar",
        message: preview,
        senderUid,
        relatedId: matchId,
        route: `/chat/${matchId}`,
      }).catch(() => {});
    } catch (err) {
      console.warn("Could not create message notification:", err);
    }
  }

  return docRef.id;
}

// Marks all messages in conversation as read for the current user
export async function markMatchAsRead(matchId, readerUid) {
  if (!matchId || !readerUid) return;

  try {
    // 1. Remove reader from match unreadBy
    const matchRef = doc(db, "tinder_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (matchSnap.exists()) {
      const data = matchSnap.data();
      const unreadList = Array.isArray(data.unreadBy) ? data.unreadBy : [];
      if (unreadList.includes(readerUid)) {
        await setDoc(
          matchRef,
          {
            unreadBy: unreadList.filter((u) => u !== readerUid),
          },
          { merge: true }
        );
      }
    }

    // 2. Mark unread messages addressed to reader as read: true
    const q = query(
      collection(db, "tinder_matches", matchId, "messages"),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    const updates = [];
    snap.forEach((d) => {
      const m = d.data();
      if (m.senderUid !== readerUid) {
        updates.push(
          setDoc(
            doc(db, "tinder_matches", matchId, "messages", d.id),
            { read: true, readAt: serverTimestamp() },
            { merge: true }
          )
        );
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  } catch (err) {
    console.warn("markMatchAsRead error:", err);
  }
}

// Bot reply helper
export async function maybeBotReply(matchId, botUid, existingBotMessages, userUid = null) {
  const replies = BOT_REPLIES[botUid];
  if (!replies) return;
  const next = replies[existingBotMessages % replies.length];
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  await sendMessage(matchId, botUid, next, userUid);
}

// Format message time
export function formatMessageTime(timestamp) {
  if (!timestamp) return "";
  let date = null;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number") {
    date = new Date(timestamp);
  }

  if (!date || isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (isToday) {
    return `${hours}:${minutes}`;
  }
  if (isYesterday) {
    return `Kecha, ${hours}:${minutes}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// ---------- notifications ----------

/**
 * Creates a notification for a recipient user with duplicate prevention.
 */
export async function createNotification(recipientUid, notificationData) {
  if (!recipientUid || isBotUid(recipientUid)) return null;

  const notifId =
    notificationData.id ||
    `${notificationData.type || "notif"}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  const notifRef = doc(db, "tinder_notifications", recipientUid, "items", notifId);

  await setDoc(
    notifRef,
    {
      id: notifId,
      recipientUid,
      type: notificationData.type || "info",
      title: notificationData.title || "Bildirishnoma",
      message: notificationData.message || "",
      senderUid: notificationData.senderUid || null,
      senderName: notificationData.senderName || null,
      senderPhoto: notificationData.senderPhoto || null,
      relatedId: notificationData.relatedId || null,
      route: notificationData.route || "/",
      read: false,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return notifId;
}

/**
 * Real-time listener for user's notifications (sorted by newest first, limit 30).
 */
export function listenNotifications(uid, cb) {
  if (!uid) return () => {};

  const q = query(
    collection(db, "tinder_notifications", uid, "items"),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(list);
    },
    (err) => {
      console.warn("listenNotifications error:", err);
    }
  );
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(uid, notificationId) {
  if (!uid || !notificationId) return;
  try {
    await setDoc(
      doc(db, "tinder_notifications", uid, "items", notificationId),
      {
        read: true,
        readAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("markNotificationAsRead error:", err);
  }
}

/**
 * Marks all notifications as read for the user.
 */
export async function markAllNotificationsAsRead(uid, notificationIds = []) {
  if (!uid || !notificationIds.length) return;
  try {
    await Promise.all(
      notificationIds.map((id) =>
        setDoc(
          doc(db, "tinder_notifications", uid, "items", id),
          {
            read: true,
            readAt: serverTimestamp(),
          },
          { merge: true }
        )
      )
    );
  } catch (err) {
    console.error("markAllNotificationsAsRead error:", err);
  }
}

/**
 * Deletes a notification.
 */
export async function deleteNotification(uid, notificationId) {
  if (!uid || !notificationId) return;
  try {
    await deleteDoc(
      doc(db, "tinder_notifications", uid, "items", notificationId)
    );
  } catch (err) {
    console.error("deleteNotification error:", err);
  }
}

