import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { createNotification } from "./firestore";
import { logAdminAuditAction } from "./admin";

export const VERIFICATION_GESTURES = [
  {
    id: "peace_sign",
    label: "Ikki barmoq (Peace sign)",
    emoji: "✌️",
    instruction: "Kameraga qarab ikki barmoq (Peace) belgisini ko'rsating",
  },
  {
    id: "thumbs_up",
    label: "Bosh barmoq (Thumbs up)",
    emoji: "👍",
    instruction: "Yuzingiz yonida bosh barmoqni yuqoriga ko'rsating",
  },
  {
    id: "hand_wave",
    label: "Qo'l silkitish (Hand wave)",
    emoji: "👋",
    instruction: "Yuzingiz yonida ochiq kaftingizni ko'rsatib suratga tushing",
  },
  {
    id: "heart_hands",
    label: "Yurakcha (Heart sign)",
    emoji: "🫶",
    instruction: "Ikkala qo'lingiz bilan yurakcha belgisini yasang",
  },
];

/**
 * Uploads a verification selfie to Firebase Storage under `verification_photos/{uid}/...`
 * Validates file size (max 5MB) and mime type.
 * Includes reliable fallback to Data URL if storage bucket fails.
 */
async function uploadVerificationPhoto(uid, file) {
  if (!file) throw new Error("Fayl tanlanmagan");

  // Validate mime type
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error("Faqat JPG, PNG yoki WebP formatdagi suratlar qabul qilinadi");
  }

  // Validate size: max 5MB
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Surat hajmi 5MB dan oshmasligi kerak");
  }

  try {
    const fileExt = file.name.split(".").pop() || "jpg";
    const storagePath = `verification_photos/${uid}/verification_${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uid,
        uploadedAt: new Date().toISOString(),
        purpose: "profile_verification",
      },
    });

    return await getDownloadURL(snapshot.ref);
  } catch (storageErr) {
    console.warn("Storage upload failed, falling back to data URL:", storageErr);
    // Reliable fallback for preview environment
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Suratni o'qishda xatolik"));
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Submits a new Profile Verification Request.
 * Prevents duplicate pending submissions.
 */
export async function submitVerificationRequest({
  uid,
  userProfile = {},
  photoFile,
  gestureType = "peace_sign",
  note = "",
}) {
  if (!uid) throw new Error("Foydalanuvchi aniqlanmadi");

  // 1. Check if user already has an active pending request
  try {
    const existingQ = query(
      collection(db, "verificationRequests"),
      where("uid", "==", uid),
      where("status", "==", "pending")
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      throw new Error(
        "Sizda allaqachon ko'rib chiqilayotgan so'rov mavjud. Iltimos, moderatsiya javobini kuting."
      );
    }
  } catch (err) {
    if (err.message && err.message.includes("allaqachon ko'rib chiqilayotgan")) {
      throw err;
    }
  }

  // 2. Upload verification photo safely
  const photoUrl = await uploadVerificationPhoto(uid, photoFile);

  // 3. Create document in `verificationRequests/{requestId}`
  const requestId = `verif_${uid}_${Date.now()}`;
  const requestDocRef = doc(db, "verificationRequests", requestId);

  const requestPayload = {
    requestId,
    uid,
    status: "pending", // "pending" | "approved" | "rejected"
    gestureType,
    photoUrl,
    note: (note || "").trim().slice(0, 300),
    userProfile: {
      displayName: userProfile.displayName || "Foydalanuvchi",
      age: userProfile.age ? Number(userProfile.age) : null,
      city: userProfile.city || "",
      photoUrl: userProfile.photos?.[0] || userProfile.photo || null,
    },
    verificationType: "selfie_gesture",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };

  await setDoc(requestDocRef, requestPayload);

  // 4. Update user's profile status in `tinder_profiles/{uid}`
  await setDoc(
    doc(db, "tinder_profiles", uid),
    {
      verificationStatus: "pending",
      verificationRequestedAt: serverTimestamp(),
      verificationRejectionReason: null,
    },
    { merge: true }
  );

  // 5. Send real in-app confirmation notification to user
  await createNotification(uid, {
    type: "system",
    title: "Verification so'rovi yuborildi ⏳",
    message:
      "Profilingizni tasdiqlash so'rovi qabul qilindi. Moderatsiya jamoasi 24 soat ichida uni ko'rib chiqadi.",
    route: "/profile",
  });

  return { requestId, status: "pending" };
}

/**
 * Fetches user's latest verification status and active request info
 */
export async function getUserVerificationStatus(uid) {
  if (!uid) return null;

  try {
    const q = query(
      collection(db, "verificationRequests"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data();
      return {
        id: snap.docs[0].id,
        ...docData,
      };
    }
  } catch (err) {
    console.warn("getUserVerificationStatus query warning:", err);
  }

  return null;
}

/**
 * Fetches verification requests for Admin Review with filtering, search, sorting and pagination
 */
export async function getAdminVerificationRequests({
  status = "all",
  search = "",
  sortBy = "newest",
  limitCount = 25,
}) {
  try {
    const snap = await getDocs(collection(db, "verificationRequests"));
    let list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // 1. Filter by status
    if (status && status !== "all") {
      list = list.filter((r) => (r.status || "pending") === status);
    }

    // 2. Search
    if (search && search.trim()) {
      const queryLower = search.trim().toLowerCase();
      list = list.filter((r) => {
        const name = (r.userProfile?.displayName || "").toLowerCase();
        const uid = (r.uid || "").toLowerCase();
        const reqId = (r.requestId || r.id || "").toLowerCase();
        return (
          name.includes(queryLower) ||
          uid.includes(queryLower) ||
          reqId.includes(queryLower)
        );
      });
    }

    // 3. Sort
    list.sort((a, b) => {
      const timeA =
        a.createdAt?.toMillis?.() ||
        (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
        0;
      const timeB =
        b.createdAt?.toMillis?.() ||
        (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
        0;

      if (sortBy === "oldest") return timeA - timeB;
      if (sortBy === "status") {
        const order = { pending: 0, rejected: 1, approved: 2 };
        const diff = (order[a.status] || 0) - (order[b.status] || 0);
        if (diff !== 0) return diff;
        return timeB - timeA;
      }
      return timeB - timeA; // newest default
    });

    // 4. Calculate real statistics
    const stats = {
      total: snap.size,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    snap.forEach((d) => {
      const s = d.data().status;
      if (s === "pending") stats.pending++;
      else if (s === "approved") stats.approved++;
      else if (s === "rejected") stats.rejected++;
    });

    const paginatedList = list.slice(0, Number(limitCount) || 25);

    return {
      requests: paginatedList,
      totalMatching: list.length,
      stats,
    };
  } catch (err) {
    console.error("getAdminVerificationRequests error:", err);
    return {
      requests: [],
      totalMatching: 0,
      stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
    };
  }
}

/**
 * Admin action: Approve a Verification Request
 */
export async function approveVerificationRequest({
  requestId,
  uid,
  adminEmail,
}) {
  if (!requestId || !uid) throw new Error("Request yoki UID ko'rsatilmadi");

  // 1. Update verificationRequests document
  await updateDoc(doc(db, "verificationRequests", requestId), {
    status: "approved",
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail || "admin",
    updatedAt: serverTimestamp(),
  });

  // 2. Update user's profile: set verified = true, isVerified = true
  await setDoc(
    doc(db, "tinder_profiles", uid),
    {
      verified: true,
      isVerified: true,
      verificationStatus: "approved",
      verificationApprovedAt: serverTimestamp(),
      verificationRejectionReason: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 3. Log audit action
  await logAdminAuditAction({
    action: "APPROVE_VERIFICATION",
    targetUid: uid,
    details: { requestId, reviewedBy: adminEmail },
  });

  // 4. Send real in-app congratulations notification
  await createNotification(uid, {
    type: "system",
    title: "Profil tasdiqlandi! 🎉",
    message:
      "Tabriklaymiz! Sizning profilingiz muvaffaqiyatli tasdiqlandi va ko'k Verified nishoni berildi.",
    route: "/profile",
  });

  return true;
}

/**
 * Admin action: Reject a Verification Request with safe reason
 */
export async function rejectVerificationRequest({
  requestId,
  uid,
  adminEmail,
  reason = "Surat talabga mos kelmadi",
}) {
  if (!requestId || !uid) throw new Error("Request yoki UID ko'rsatilmadi");

  const safeReason = (reason || "Surat talabga mos kelmadi").trim();

  // 1. Update verificationRequests document
  await updateDoc(doc(db, "verificationRequests", requestId), {
    status: "rejected",
    rejectionReason: safeReason,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail || "admin",
    updatedAt: serverTimestamp(),
  });

  // 2. Update user's profile
  await setDoc(
    doc(db, "tinder_profiles", uid),
    {
      verified: false,
      isVerified: false,
      verificationStatus: "rejected",
      verificationRejectionReason: safeReason,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 3. Log audit action
  await logAdminAuditAction({
    action: "REJECT_VERIFICATION",
    targetUid: uid,
    details: { requestId, reviewedBy: adminEmail, reason: safeReason },
  });

  // 4. Send real in-app rejection notification
  await createNotification(uid, {
    type: "system",
    title: "Verification so'rovi rad etildi",
    message: `Verification so'rovingiz qabul qilinmadi. Sabab: "${safeReason}". Profilingizdan qayta so'rov yuborishingiz mumkin.`,
    route: "/profile",
  });

  return true;
}
