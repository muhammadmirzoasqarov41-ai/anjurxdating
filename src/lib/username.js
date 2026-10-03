import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import { createNotification, getBlockedIds, isUserBlockedEitherWay } from "./firestore";
import { logAdminAuditAction } from "./admin";

/**
 * Stage 12 - Unique @username system for AnjurXdating
 * Specifications:
 * - 3 to 20 characters
 * - Latin letters (a-z, A-Z), numbers (0-9), and underscore (_)
 * - No spaces, no symbols
 * - Case-insensitive uniqueness stored in normalized form (lowercase)
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Standard baseline reserved usernames.
 * Stored in lower-case normalized form.
 */
export const DEFAULT_RESERVED_USERNAMES = new Set([
  // Platform & brand
  "anjurxdating",
  "anjurx",
  "anjurxdatingofficial",
  "anjurx_official",
  "anjurx_dating",
  "anjurx_support",
  "anjurx_admin",
  "anjur",
  "dating",
  // Roles & Security
  "admin",
  "administrator",
  "superadmin",
  "moderator",
  "support",
  "verification",
  "security",
  "official",
  "help",
  "system",
  "staff",
  "root",
  "developer",
  "dev",
  "bot",
  "safety",
  // Famous tech brands / confusable names
  "telegram",
  "instagram",
  "facebook",
  "whatsapp",
  "google",
  "apple",
  "tinder",
  "meta",
  "tiktok",
  "youtube",
  "twitter",
  "x",
  "uzbekistan",
  "tashkent",
]);

/**
 * Normalizes username string:
 * - Strips leading @
 * - Trims whitespaces
 * - Converts to lower-case
 */
export function normalizeUsername(raw) {
  if (!raw) return "";
  let str = String(raw).trim();
  if (str.startsWith("@")) {
    str = str.slice(1).trim();
  }
  return str.toLowerCase();
}

/**
 * Validates format of raw username
 */
export function validateUsernameFormat(raw) {
  if (!raw) {
    return { isValid: false, error: "Username kiritilmadi" };
  }
  let str = String(raw).trim();
  if (str.startsWith("@")) {
    str = str.slice(1).trim();
  }

  if (str.length < 3) {
    return { isValid: false, error: "Username kamida 3 ta belgidan iborat bo'lishi kerak" };
  }
  if (str.length > 20) {
    return { isValid: false, error: "Username ko'pi bilan 20 ta belgidan oshmasligi kerak" };
  }
  if (/\s/.test(str)) {
    return { isValid: false, error: "Usernameda bo'sh joy (probel) bo'lishi mumkin emas" };
  }
  if (!USERNAME_REGEX.test(str)) {
    return {
      isValid: false,
      error: "Faqat lotin harflari, raqamlar va pastki chiziq (_) ruxsat etiladi",
    };
  }

  return { isValid: true, cleanUsername: str, normalized: str.toLowerCase() };
}

/**
 * Checks if a normalized username is currently reserved in the database or default list
 */
export async function isUsernameReserved(normalized) {
  if (!normalized) return false;
  const norm = normalized.toLowerCase().trim();

  // 1. Check in-memory system reserve list
  if (DEFAULT_RESERVED_USERNAMES.has(norm)) {
    return true;
  }

  // 2. Check Firestore reservedUsernames collection
  try {
    const reservedDocRef = doc(db, "reservedUsernames", norm);
    const snap = await getDoc(reservedDocRef);
    if (snap.exists()) {
      const data = snap.data();
      // If status is active or reserved, it is blocked
      if (!data.status || data.status === "active" || data.status === "reserved") {
        return true;
      }
    }
  } catch (err) {
    console.warn("isUsernameReserved check warning:", err);
  }

  return false;
}

/**
 * Checks username availability for a user with status details.
 * Status values:
 * - "available" -> can be claimed
 * - "current" -> user already owns this username
 * - "taken" -> another user already has it
 * - "reserved" -> reserved by system/brand/admin
 * - "cooldown" -> recently changed and in cooldown protection
 * - "invalid" -> invalid format
 */
export async function checkUsernameAvailability(rawUsername, currentUid = null) {
  const validation = validateUsernameFormat(rawUsername);
  if (!validation.isValid) {
    return {
      status: "invalid",
      message: validation.error,
      normalized: "",
      cleanUsername: "",
    };
  }

  const { cleanUsername, normalized } = validation;

  // 1. Check if user already owns this username
  if (currentUid) {
    try {
      const currentDoc = await getDoc(doc(db, "usernames", normalized));
      if (currentDoc.exists() && currentDoc.data()?.uid === currentUid) {
        return {
          status: "current",
          message: "Bu sizning hozirgi usernamingiz.",
          normalized,
          cleanUsername,
        };
      }
    } catch (err) {
      console.warn("Check current user username error:", err);
    }
  }

  // 2. Check reservation
  const reserved = await isUsernameReserved(normalized);
  if (reserved) {
    return {
      status: "reserved",
      message: "Bu username mavjud emas yoki foydalanish uchun ruxsat berilmagan.",
      normalized,
      cleanUsername,
    };
  }

  // 3. Check existing username in usernames/{normalized}
  try {
    const usernameDoc = await getDoc(doc(db, "usernames", normalized));
    if (usernameDoc.exists()) {
      const data = usernameDoc.data();
      if (currentUid && data.uid === currentUid) {
        return {
          status: "current",
          message: "Bu sizning hozirgi usernamingiz.",
          normalized,
          cleanUsername,
        };
      }
      return {
        status: "taken",
        message: "Bu username band. Boshqa variantni tanlang.",
        normalized,
        cleanUsername,
      };
    }
  } catch (err) {
    console.warn("Check usernames collection error:", err);
  }

  // 4. Check usernameHistory collection for cooldown
  try {
    const historyDoc = await getDoc(doc(db, "usernameHistory", normalized));
    if (historyDoc.exists()) {
      const histData = historyDoc.data();
      if (histData.previousUid !== currentUid) {
        const cooldownUntil = histData.cooldownUntil?.toMillis
          ? histData.cooldownUntil.toMillis()
          : histData.cooldownUntil
          ? new Date(histData.cooldownUntil).getTime()
          : 0;

        if (cooldownUntil > Date.now()) {
          return {
            status: "cooldown",
            message: "Bu username yaqinda o'zgartirilgan va xavfsizlik maqsadida vaqtincha band.",
            normalized,
            cleanUsername,
          };
        }
      }
    }
  } catch (err) {
    console.warn("Check usernameHistory error:", err);
  }

  return {
    status: "available",
    message: "Username mavjud!",
    normalized,
    cleanUsername,
  };
}

/**
 * Claims a username for a user atomically via Firestore Transaction.
 * Prevents race conditions when multiple users try to take the same username at the exact same moment.
 */
export async function claimUsername(uid, rawUsername) {
  if (!uid) throw new Error("Foydalanuvchi identifikatori (UID) mavjud emas");

  const validation = validateUsernameFormat(rawUsername);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { cleanUsername, normalized } = validation;

  return await runTransaction(db, async (transaction) => {
    // 1. Check reservation document
    const reservedDocRef = doc(db, "reservedUsernames", normalized);
    const reservedSnap = await transaction.get(reservedDocRef);

    let isPermitted = false;
    if (reservedSnap.exists()) {
      const rData = reservedSnap.data();
      // If reserved for this specific user by admin
      if (rData.assignedToUid === uid && rData.status === "approved") {
        isPermitted = true;
      } else if (!rData.status || rData.status === "active" || rData.status === "reserved") {
        throw new Error("Bu username mavjud emas yoki foydalanish uchun ruxsat berilmagan.");
      }
    }

    if (!isPermitted && DEFAULT_RESERVED_USERNAMES.has(normalized)) {
      throw new Error("Bu username mavjud emas yoki foydalanish uchun ruxsat berilmagan.");
    }

    // 2. Check if username document already exists
    const usernameDocRef = doc(db, "usernames", normalized);
    const usernameSnap = await transaction.get(usernameDocRef);

    if (usernameSnap.exists()) {
      const existingData = usernameSnap.data();
      if (existingData.uid !== uid) {
        throw new Error("Bu username allaqachon boshqa foydalanuvchi tomonidan egallangan.");
      }
      // If user already owns this username, just update canonical casing if changed
      transaction.update(usernameDocRef, {
        username: cleanUsername,
        updatedAt: serverTimestamp(),
      });
      return { success: true, username: cleanUsername, normalizedUsername: normalized };
    }

    // 3. Check current user's profile to see if they already had a previous username
    const profileDocRef = doc(db, "tinder_profiles", uid);
    const profileSnap = await transaction.get(profileDocRef);
    const currentProfile = profileSnap.exists() ? profileSnap.data() : {};
    const oldNormalized = currentProfile.normalizedUsername;

    // 4. If old username exists, record history and release old username mapping
    if (oldNormalized && oldNormalized !== normalized) {
      const oldUsernameRef = doc(db, "usernames", oldNormalized);
      const historyRef = doc(db, "usernameHistory", oldNormalized);

      // Save to history with 30-day anti-hijacking cooldown
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() + 30);

      transaction.set(historyRef, {
        originalUsername: currentProfile.username || oldNormalized,
        normalizedUsername: oldNormalized,
        previousUid: uid,
        changedAt: serverTimestamp(),
        cooldownUntil: cooldownDate,
      });

      // Delete old mapping so it is no longer pointing to current user
      transaction.delete(oldUsernameRef);
    }

    // 5. Create new username mapping
    transaction.set(usernameDocRef, {
      uid,
      username: cleanUsername,
      normalizedUsername: normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 6. Update tinder_profiles doc
    transaction.set(
      profileDocRef,
      {
        username: cleanUsername,
        normalizedUsername: normalized,
        usernameUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 7. Update users doc
    const userDocRef = doc(db, "users", uid);
    transaction.set(
      userDocRef,
      {
        username: cleanUsername,
        normalizedUsername: normalized,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      username: cleanUsername,
      normalizedUsername: normalized,
    };
  });
}

/**
 * Creates a formal username request (e.g. for brand, organization, or reserved usernames)
 */
export async function createUsernameRequest(uid, user, requestedUsername, reason = "") {
  if (!uid || !user) throw new Error("Avtorizatsiya talab qilinadi");

  const validation = validateUsernameFormat(requestedUsername);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { cleanUsername, normalized } = validation;

  // Check if a pending request for this user and normalized username already exists
  const q = query(
    collection(db, "usernameRequests"),
    where("uid", "==", uid),
    where("normalizedUsername", "==", normalized),
    where("status", "==", "pending"),
    limit(1)
  );

  const existingSnap = await getDocs(q);
  if (!existingSnap.empty) {
    throw new Error("Siz bu username uchun allaqachon so'rov yuborgansiz. So'rov ko'rib chiqilmoqda.");
  }

  const requestId = `req_${uid}_${normalized}_${Date.now()}`;
  const reqDocRef = doc(db, "usernameRequests", requestId);

  await setDoc(reqDocRef, {
    requestId,
    uid,
    userEmail: user.email || "",
    userDisplayName: user.displayName || "Foydalanuvchi",
    requestedUsername: cleanUsername,
    normalizedUsername: normalized,
    reason: reason.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    adminNote: "",
  });

  return requestId;
}

/**
 * Fetches pending/history requests for a user
 */
export async function getUserUsernameRequests(uid) {
  if (!uid) return [];
  try {
    const q = query(
      collection(db, "usernameRequests"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("getUserUsernameRequests error:", err);
    return [];
  }
}

/**
 * Admin: Fetches username requests with filters, search, and pagination
 */
export async function getAdminUsernameRequests({ status = "all", search = "", limitCount = 50 } = {}) {
  try {
    let q;
    if (status && status !== "all") {
      q = query(
        collection(db, "usernameRequests"),
        where("status", "==", status),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, "usernameRequests"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const snap = await getDocs(q);
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.requestedUsername?.toLowerCase().includes(term) ||
          item.normalizedUsername?.includes(term) ||
          item.userDisplayName?.toLowerCase().includes(term) ||
          item.userEmail?.toLowerCase().includes(term) ||
          item.uid?.includes(term) ||
          item.reason?.toLowerCase().includes(term)
        );
      });
    }

    return list;
  } catch (err) {
    console.error("getAdminUsernameRequests error:", err);
    return [];
  }
}

/**
 * Admin: Approves or rejects a username request
 */
export async function reviewUsernameRequest(requestId, adminEmail, action, reason = "") {
  if (!requestId) throw new Error("So'rov identifikatori kiritilmagan");
  const isApprove = action === "approve";

  const reqDocRef = doc(db, "usernameRequests", requestId);
  const snap = await getDoc(reqDocRef);

  if (!snap.exists()) {
    throw new Error("Username so'rovi topilmadi");
  }

  const reqData = snap.data();
  const { uid, requestedUsername, normalizedUsername, userDisplayName } = reqData;

  if (isApprove) {
    // 1. Claim username directly to the target user via atomic transaction
    await runTransaction(db, async (transaction) => {
      const usernameDocRef = doc(db, "usernames", normalizedUsername);
      const usernameSnap = await transaction.get(usernameDocRef);

      if (usernameSnap.exists() && usernameSnap.data()?.uid !== uid) {
        throw new Error("Bu username boshqa foydalanuvchi tomonidan band qilingan.");
      }

      // Check current profile to handle old username release
      const profileDocRef = doc(db, "tinder_profiles", uid);
      const profileSnap = await transaction.get(profileDocRef);
      const currentProfile = profileSnap.exists() ? profileSnap.data() : {};
      const oldNormalized = currentProfile.normalizedUsername;

      if (oldNormalized && oldNormalized !== normalizedUsername) {
        const oldUsernameRef = doc(db, "usernames", oldNormalized);
        const historyRef = doc(db, "usernameHistory", oldNormalized);

        const cooldownDate = new Date();
        cooldownDate.setDate(cooldownDate.getDate() + 30);

        transaction.set(historyRef, {
          originalUsername: currentProfile.username || oldNormalized,
          normalizedUsername: oldNormalized,
          previousUid: uid,
          changedAt: serverTimestamp(),
          cooldownUntil: cooldownDate,
        });

        transaction.delete(oldUsernameRef);
      }

      // Write new username
      transaction.set(usernameDocRef, {
        uid,
        username: requestedUsername,
        normalizedUsername,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        assignedByAdmin: adminEmail,
      });

      // Update profile
      transaction.set(
        profileDocRef,
        {
          username: requestedUsername,
          normalizedUsername,
          usernameUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Update users
      const userDocRef = doc(db, "users", uid);
      transaction.set(
        userDocRef,
        {
          username: requestedUsername,
          normalizedUsername,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Mark request approved
      transaction.update(reqDocRef, {
        status: "approved",
        reviewedAt: serverTimestamp(),
        reviewedBy: adminEmail,
        adminNote: reason.trim(),
      });
    });

    // 2. Notify recipient user
    await createNotification(uid, {
      type: "username_approved",
      title: "Username tasdiqlandi! 🎉",
      message: `Sizning @${requestedUsername} username so'rovingiz ma'murlar tomonidan tasdiqlandi va profilingizga biriktirildi.`,
      route: "/profile",
    });

    // 3. Audit log
    await logAdminAuditAction({
      action: "username_request_approved",
      targetUid: uid,
      targetEmail: reqData.userEmail,
      details: {
        requestId,
        requestedUsername,
        normalizedUsername,
        adminEmail,
        note: reason,
      },
    });

    return { success: true, status: "approved" };
  } else {
    // Reject request
    await updateDoc(reqDocRef, {
      status: "rejected",
      reviewedAt: serverTimestamp(),
      reviewedBy: adminEmail,
      adminNote: reason.trim() || "So'rov ma'murlar tomonidan rad etildi.",
    });

    // Notify user
    await createNotification(uid, {
      type: "username_rejected",
      title: "Username so'rovi rad etildi",
      message: `Sizning @${requestedUsername} username so'rovingiz rad etildi${
        reason.trim() ? `: ${reason.trim()}` : "."
      }`,
      route: "/profile",
    });

    // Audit log
    await logAdminAuditAction({
      action: "username_request_rejected",
      targetUid: uid,
      targetEmail: reqData.userEmail,
      details: {
        requestId,
        requestedUsername,
        normalizedUsername,
        adminEmail,
        reason,
      },
    });

    return { success: true, status: "rejected" };
  }
}

/**
 * Admin: Assigns any username directly to a specific user (Super Admin / Username Manager)
 */
export async function adminAssignUsername(uid, targetUsername, adminEmail) {
  if (!uid || !targetUsername) throw new Error("UID va username talab qilinadi");

  const validation = validateUsernameFormat(targetUsername);
  if (!validation.isValid) throw new Error(validation.error);

  const { cleanUsername, normalized } = validation;

  await runTransaction(db, async (transaction) => {
    const usernameDocRef = doc(db, "usernames", normalized);
    const usernameSnap = await transaction.get(usernameDocRef);

    if (usernameSnap.exists() && usernameSnap.data()?.uid !== uid) {
      throw new Error(`Bu username (@${cleanUsername}) boshqa foydalanuvchiga tegishli.`);
    }

    const profileDocRef = doc(db, "tinder_profiles", uid);
    const profileSnap = await transaction.get(profileDocRef);
    const currentProfile = profileSnap.exists() ? profileSnap.data() : {};
    const oldNormalized = currentProfile.normalizedUsername;

    if (oldNormalized && oldNormalized !== normalized) {
      const oldUsernameRef = doc(db, "usernames", oldNormalized);
      const historyRef = doc(db, "usernameHistory", oldNormalized);

      transaction.set(historyRef, {
        originalUsername: currentProfile.username || oldNormalized,
        normalizedUsername: oldNormalized,
        previousUid: uid,
        changedAt: serverTimestamp(),
        cooldownUntil: new Date(Date.now() + 30 * 86400000),
      });

      transaction.delete(oldUsernameRef);
    }

    transaction.set(usernameDocRef, {
      uid,
      username: cleanUsername,
      normalizedUsername: normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      assignedByAdmin: adminEmail,
    });

    transaction.set(
      profileDocRef,
      {
        username: cleanUsername,
        normalizedUsername: normalized,
        usernameUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const userDocRef = doc(db, "users", uid);
    transaction.set(
      userDocRef,
      {
        username: cleanUsername,
        normalizedUsername: normalized,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  await createNotification(uid, {
    type: "username_assigned",
    title: "Yangi username biriktirildi! 🌟",
    message: `Ma'muriyat tomonidan sizga @${cleanUsername} username biriktirildi.`,
    route: "/profile",
  });

  await logAdminAuditAction({
    action: "admin_assigned_username",
    targetUid: uid,
    details: { assignedUsername: cleanUsername, normalized, adminEmail },
  });

  return { success: true, username: cleanUsername, normalizedUsername: normalized };
}

/**
 * Reserved Usernames: Fetch list
 */
export async function getReservedUsernamesList() {
  try {
    const snap = await getDocs(collection(db, "reservedUsernames"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
    return list;
  } catch (err) {
    console.warn("getReservedUsernamesList error:", err);
    return [];
  }
}

/**
 * Reserved Usernames: Add new reserved username
 */
export async function addReservedUsername(rawUsername, type = "custom", reason = "", adminEmail = "") {
  const norm = normalizeUsername(rawUsername);
  if (!norm || norm.length < 2) throw new Error("Noto'g'ri username");

  const docRef = doc(db, "reservedUsernames", norm);
  await setDoc(docRef, {
    username: rawUsername.replace(/^@/, "").trim(),
    normalizedUsername: norm,
    type,
    reason: reason.trim(),
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: adminEmail,
  });

  await logAdminAuditAction({
    action: "reserved_username_added",
    details: { username: rawUsername, normalized: norm, type, reason, adminEmail },
  });

  return { success: true, normalized: norm };
}

/**
 * Reserved Usernames: Remove
 */
export async function removeReservedUsername(normalizedUsername, adminEmail = "") {
  if (!normalizedUsername) return;
  const norm = normalizedUsername.toLowerCase().trim();

  await deleteDoc(doc(db, "reservedUsernames", norm));

  await logAdminAuditAction({
    action: "reserved_username_removed",
    details: { normalized: norm, adminEmail },
  });

  return { success: true };
}

/**
 * Admin: Get all registered usernames
 */
export async function getAllUsernames({ search = "", limitCount = 100 } = {}) {
  try {
    const q = query(
      collection(db, "usernames"),
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(term) ||
          u.normalizedUsername?.includes(term) ||
          u.uid?.includes(term)
      );
    }
    return list;
  } catch (err) {
    console.error("getAllUsernames error:", err);
    return [];
  }
}

/**
 * Direct public profile resolver by @username or normalized username.
 * Used for /u/:username and /profile/:username routes.
 * Strips private information (email, exact coordinates, etc.)
 */
export async function getProfileByUsername(rawUsername, viewerUid = null) {
  const normalized = normalizeUsername(rawUsername);
  if (!normalized) return null;

  try {
    const usernameDocRef = doc(db, "usernames", normalized);
    const snap = await getDoc(usernameDocRef);

    if (!snap.exists()) {
      return null;
    }

    const { uid } = snap.data();
    if (!uid) return null;

    // Check if viewer has blocked or was blocked by this user
    if (viewerUid && viewerUid !== uid) {
      const isBlocked = await isUserBlockedEitherWay(viewerUid, uid);
      if (isBlocked) {
        return { isBlocked: true, uid };
      }
    }

    // Fetch public profile
    const profileDocRef = doc(db, "tinder_profiles", uid);
    const profileSnap = await getDoc(profileDocRef);

    if (!profileSnap.exists()) {
      return null;
    }

    const data = profileSnap.data();

    // Sanitize to only return public safe data
    return {
      uid,
      displayName: data.displayName || "Foydalanuvchi",
      username: data.username || normalized,
      normalizedUsername: normalized,
      age: data.age || null,
      bio: data.bio || "",
      city: data.city || "",
      job: data.job || "",
      datingIntention: data.datingIntention || "",
      interests: Array.isArray(data.interests) ? data.interests : [],
      languages: Array.isArray(data.languages) ? data.languages : [],
      photos: Array.isArray(data.photos) ? data.photos : [],
      verified: Boolean(data.verified || data.isVerified),
      isVerified: Boolean(data.verified || data.isVerified),
      online: Boolean(data.online || data.isOnline),
      lastSeenAt: data.lastSeenAt || null,
      createdAt: data.createdAt || null,
      isOwner: viewerUid === uid,
    };
  } catch (err) {
    console.error("getProfileByUsername error:", err);
    return null;
  }
}

/**
 * Fast search by query supporting:
 * - exact @username (placed first as premier exact match!)
 * - normalizedUsername prefix
 * - displayName prefix / keywords
 * - interests match
 *
 * Excludes blocked users and current user.
 * Never downloads full users collection!
 */
export async function searchUsers(searchQuery, currentUid = null) {
  if (!searchQuery || !searchQuery.trim()) return [];

  const raw = searchQuery.trim();
  const normalizedQuery = normalizeUsername(raw);

  // Get blocked user IDs if logged in to filter out
  let blockedIds = new Set();
  if (currentUid) {
    try {
      blockedIds = await getBlockedIds(currentUid);
    } catch {
      // ignore
    }
  }

  const resultsMap = new Map();

  // 1. Direct exact username lookup (Instant 1-doc fetch!)
  if (normalizedQuery.length >= 2) {
    try {
      const usernameDoc = await getDoc(doc(db, "usernames", normalizedQuery));
      if (usernameDoc.exists()) {
        const uData = usernameDoc.data();
        const targetUid = uData.uid;

        if (targetUid !== currentUid && !blockedIds.has(targetUid)) {
          const profSnap = await getDoc(doc(db, "tinder_profiles", targetUid));
          if (profSnap.exists()) {
            const pData = profSnap.data();
            // Check reciprocal block
            const isReciprocalBlocked = currentUid
              ? await isUserBlockedEitherWay(currentUid, targetUid)
              : false;

            if (!isReciprocalBlocked) {
              resultsMap.set(targetUid, {
                uid: targetUid,
                displayName: pData.displayName || "Foydalanuvchi",
                username: pData.username || normalizedQuery,
                normalizedUsername: normalizedQuery,
                age: pData.age || null,
                bio: pData.bio || "",
                city: pData.city || "",
                job: pData.job || "",
                photos: Array.isArray(pData.photos) ? pData.photos : [],
                verified: Boolean(pData.verified || pData.isVerified),
                isVerified: Boolean(pData.verified || pData.isVerified),
                online: Boolean(pData.online || pData.isOnline),
                interests: Array.isArray(pData.interests) ? pData.interests : [],
                isExactUsernameMatch: true,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn("Direct username search warning:", err);
    }
  }

  // 2. Query tinder_profiles by normalizedUsername range (Firestore index prefix query)
  if (normalizedQuery.length >= 2) {
    try {
      const prefixQuery = query(
        collection(db, "tinder_profiles"),
        where("normalizedUsername", ">=", normalizedQuery),
        where("normalizedUsername", "<=", normalizedQuery + "\uf8ff"),
        limit(15)
      );

      const prefixSnap = await getDocs(prefixQuery);
      for (const d of prefixSnap.docs) {
        const targetUid = d.id;
        if (targetUid === currentUid || blockedIds.has(targetUid) || resultsMap.has(targetUid)) {
          continue;
        }

        const pData = d.data();
        if (pData.privacy?.isPublic === false) continue;

        resultsMap.set(targetUid, {
          uid: targetUid,
          displayName: pData.displayName || "Foydalanuvchi",
          username: pData.username || pData.normalizedUsername,
          normalizedUsername: pData.normalizedUsername,
          age: pData.age || null,
          bio: pData.bio || "",
          city: pData.city || "",
          job: pData.job || "",
          photos: Array.isArray(pData.photos) ? pData.photos : [],
          verified: Boolean(pData.verified || pData.isVerified),
          isVerified: Boolean(pData.verified || pData.isVerified),
          online: Boolean(pData.online || pData.isOnline),
          interests: Array.isArray(pData.interests) ? pData.interests : [],
          isExactUsernameMatch: pData.normalizedUsername === normalizedQuery,
        });
      }
    } catch (err) {
      console.warn("Prefix username query warning:", err);
    }
  }

  // 3. Query tinder_profiles by displayName or interests if results < 10
  if (resultsMap.size < 10 && raw.length >= 2) {
    try {
      // Check query against standard interests
      const interestQuery = query(
        collection(db, "tinder_profiles"),
        where("interests", "array-contains", raw),
        limit(10)
      );
      const interestSnap = await getDocs(interestQuery);
      for (const d of interestSnap.docs) {
        const targetUid = d.id;
        if (targetUid === currentUid || blockedIds.has(targetUid) || resultsMap.has(targetUid)) {
          continue;
        }
        const pData = d.data();
        if (pData.privacy?.isPublic === false) continue;

        resultsMap.set(targetUid, {
          uid: targetUid,
          displayName: pData.displayName || "Foydalanuvchi",
          username: pData.username || pData.normalizedUsername || null,
          normalizedUsername: pData.normalizedUsername || null,
          age: pData.age || null,
          bio: pData.bio || "",
          city: pData.city || "",
          job: pData.job || "",
          photos: Array.isArray(pData.photos) ? pData.photos : [],
          verified: Boolean(pData.verified || pData.isVerified),
          isVerified: Boolean(pData.verified || pData.isVerified),
          online: Boolean(pData.online || pData.isOnline),
          interests: Array.isArray(pData.interests) ? pData.interests : [],
          matchedInterest: raw,
        });
      }
    } catch (err) {
      console.warn("Interest query warning:", err);
    }
  }

  const results = Array.from(resultsMap.values());

  // Sort exact match first, then verified, then has username
  results.sort((a, b) => {
    if (a.isExactUsernameMatch && !b.isExactUsernameMatch) return -1;
    if (!a.isExactUsernameMatch && b.isExactUsernameMatch) return 1;
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return 0;
  });

  return results;
}
