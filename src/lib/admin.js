import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Fetches real statistics and recent items from Firestore collections:
 * - tinder_profiles (Total Profiles, Recent Profiles)
 * - users (Total Users, Recent Users)
 * - tinder_matches (Total Matches, Total Conversations, Recent Matches)
 * - reports (Total Reports, Recent Reports)
 */
export async function getAdminDashboardData() {
  const result = {
    stats: {
      totalUsers: 0,
      totalProfiles: 0,
      totalMatches: 0,
      totalReports: 0,
      totalConversations: 0,
    },
    recentProfiles: [],
    recentUsers: [],
    recentReports: [],
    recentMatches: [],
  };

  // 1. Profiles: tinder_profiles
  try {
    const profilesSnap = await getDocs(collection(db, "tinder_profiles"));
    result.stats.totalProfiles = profilesSnap.size;

    const profilesList = profilesSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    profilesList.sort((a, b) => {
      const timeA =
        a.updatedAt?.toMillis?.() ||
        (a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0) ||
        0;
      const timeB =
        b.updatedAt?.toMillis?.() ||
        (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0) ||
        0;
      return timeB - timeA;
    });

    result.recentProfiles = profilesList.slice(0, 5);
  } catch (err) {
    console.warn("Profiles query warning:", err);
  }

  // 2. Users: users
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    result.stats.totalUsers = usersSnap.size;

    const usersList = usersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    usersList.sort((a, b) => {
      const timeA =
        a.lastLoginAt?.toMillis?.() ||
        (a.lastLoginAt?.seconds ? a.lastLoginAt.seconds * 1000 : 0) ||
        a.createdAt?.toMillis?.() ||
        (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
        0;
      const timeB =
        b.lastLoginAt?.toMillis?.() ||
        (b.lastLoginAt?.seconds ? b.lastLoginAt.seconds * 1000 : 0) ||
        b.createdAt?.toMillis?.() ||
        (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
        0;
      return timeB - timeA;
    });

    result.recentUsers = usersList.slice(0, 5);
  } catch (err) {
    console.warn("Users query warning:", err);
    result.stats.totalUsers = 0;
    result.recentUsers = [];
  }

  // 3. Matches & Conversations: tinder_matches
  try {
    const matchesSnap = await getDocs(collection(db, "tinder_matches"));
    result.stats.totalMatches = matchesSnap.size;

    let convCount = 0;
    const matchesList = [];

    matchesSnap.forEach((d) => {
      const data = d.data();
      if (data.lastMessage) {
        convCount++;
      }
      matchesList.push({ id: d.id, ...data });
    });

    result.stats.totalConversations = convCount;

    matchesList.sort((a, b) => {
      const timeA =
        a.lastMessageAt?.toMillis?.() ||
        (a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : 0) ||
        a.createdAt?.toMillis?.() ||
        (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
        0;
      const timeB =
        b.lastMessageAt?.toMillis?.() ||
        (b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : 0) ||
        b.createdAt?.toMillis?.() ||
        (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
        0;
      return timeB - timeA;
    });

    result.recentMatches = matchesList.slice(0, 5);
  } catch (err) {
    console.warn("Matches query warning:", err);
  }

  // 4. Reports: reports
  try {
    const reportsSnap = await getDocs(collection(db, "reports"));
    result.stats.totalReports = reportsSnap.size;

    const reportsList = reportsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    reportsList.sort((a, b) => {
      const timeA =
        a.createdAt?.toMillis?.() ||
        (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
        0;
      const timeB =
        b.createdAt?.toMillis?.() ||
        (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
        0;
      return timeB - timeA;
    });

    result.recentReports = reportsList.slice(0, 5);
  } catch (err) {
    console.warn("Reports query warning:", err);
    result.stats.totalReports = 0;
    result.recentReports = [];
  }

  return result;
}

/**
 * Fetches all real users combined from `users` and `tinder_profiles` collections,
 * cross-referenced with `tinder_matches` and `reports`.
 */
export async function getAdminUsersData() {
  const usersMap = new Map();
  const matchesCountMap = {};
  const reportsCountMap = {};

  // 1. Fetch from `users` collection
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach((d) => {
      const data = d.data();
      const uid = d.id;
      usersMap.set(uid, {
        uid,
        email: data.email || null,
        displayName: data.displayName || null,
        createdAt: data.createdAt || null,
        lastLoginAt: data.lastLoginAt || null,
        status: data.status || "active",
        adminNote: data.adminNote || null,
        verified: data.verified || false,
        profile: null,
      });
    });
  } catch (err) {
    console.warn("getAdminUsersData users query warning:", err);
  }

  // 2. Fetch from `tinder_profiles` collection
  try {
    const profilesSnap = await getDocs(collection(db, "tinder_profiles"));
    profilesSnap.forEach((d) => {
      const data = d.data();
      const uid = d.id;
      const existing = usersMap.get(uid);

      const profileObj = {
        displayName: data.displayName || null,
        age: data.age ?? null,
        job: data.job || null,
        bio: data.bio || null,
        photos: Array.isArray(data.photos) ? data.photos : [],
        distanceKm: data.distanceKm ?? null,
        interests: Array.isArray(data.interests) ? data.interests : [],
        gender: data.gender || null,
        isBot: Boolean(data.isBot || uid.startsWith("bot_")),
        updatedAt: data.updatedAt || null,
        createdAt: data.createdAt || null,
      };

      if (existing) {
        existing.profile = profileObj;
        if (!existing.displayName && profileObj.displayName) {
          existing.displayName = profileObj.displayName;
        }
        if (profileObj.isBot) {
          existing.isBot = true;
        }
      } else {
        usersMap.set(uid, {
          uid,
          email: null,
          displayName: profileObj.displayName || "Foydalanuvchi",
          createdAt: profileObj.createdAt || profileObj.updatedAt || null,
          lastLoginAt: profileObj.updatedAt || null,
          status: "active",
          adminNote: null,
          verified: false,
          isBot: profileObj.isBot,
          profile: profileObj,
        });
      }
    });
  } catch (err) {
    console.warn("getAdminUsersData profiles query warning:", err);
  }

  // 3. Match counts from `tinder_matches`
  try {
    const matchesSnap = await getDocs(collection(db, "tinder_matches"));
    matchesSnap.forEach((d) => {
      const data = d.data();
      const uList = data.users || [];
      uList.forEach((uid) => {
        matchesCountMap[uid] = (matchesCountMap[uid] || 0) + 1;
      });
    });
  } catch (err) {
    console.warn("getAdminUsersData matches count warning:", err);
  }

  // 4. Reports count from `reports`
  try {
    const reportsSnap = await getDocs(collection(db, "reports"));
    reportsSnap.forEach((d) => {
      const data = d.data();
      const targetUid = data.targetUid || data.reportedUid || data.userId;
      if (targetUid) {
        reportsCountMap[targetUid] = (reportsCountMap[targetUid] || 0) + 1;
      }
    });
  } catch (err) {
    console.warn("getAdminUsersData reports count warning:", err);
  }

  // Build final array
  const usersList = [];
  usersMap.forEach((userItem) => {
    const uid = userItem.uid;
    const hasProfile = Boolean(
      userItem.profile &&
      (userItem.profile.displayName || userItem.profile.photos?.length)
    );

    usersList.push({
      ...userItem,
      hasProfile,
      matchesCount: matchesCountMap[uid] || 0,
      reportsCount: reportsCountMap[uid] || 0,
    });
  });

  return usersList;
}

/**
 * Audit log helper: Records super admin actions in `admin_logs` collection
 */
export async function logAdminAuditAction({ action, targetUid, targetEmail, details }) {
  try {
    const { addDoc, serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "admin_logs"), {
      adminEmail: "luxaidevs@gmail.com",
      action,
      targetUid: targetUid || null,
      targetEmail: targetEmail || null,
      details: details || {},
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("logAdminAuditAction warning:", err);
  }
}

/**
 * Updates a user's admin metadata (e.g. status, admin note, verification) safely
 */
export async function updateUserAdminStatus(uid, { status, adminNote, verified }) {
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  const updates = {
    updatedAt: serverTimestamp(),
    updatedBy: "luxaidevs@gmail.com",
  };
  if (status !== undefined) updates.status = status;
  if (adminNote !== undefined) updates.adminNote = adminNote;
  if (verified !== undefined) updates.verified = verified;

  await setDoc(doc(db, "users", uid), updates, { merge: true });

  await logAdminAuditAction({
    action: "UPDATE_USER_STATUS",
    targetUid: uid,
    details: { status, adminNote, verified },
  });
}

/**
 * Fetches all real profiles from `tinder_profiles` collection
 * cross-referenced with `users` collection for account email and status.
 */
export async function getAdminProfilesData() {
  const usersEmailMap = new Map();
  const usersStatusMap = new Map();

  // 1. Fetch user accounts to cross-reference email and account status
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach((d) => {
      const data = d.data();
      usersEmailMap.set(d.id, data.email || null);
      usersStatusMap.set(d.id, data.status || "active");
    });
  } catch (err) {
    console.warn("getAdminProfilesData users query warning:", err);
  }

  // 2. Fetch all profiles from `tinder_profiles`
  const profilesList = [];
  try {
    const profilesSnap = await getDocs(collection(db, "tinder_profiles"));
    profilesSnap.forEach((d) => {
      const data = d.data();
      const uid = d.id;
      const rawPhotos = Array.isArray(data.photos) ? data.photos : [];
      const photos = rawPhotos.filter(Boolean);

      const isComplete = Boolean(
        data.displayName &&
        photos.length > 0 &&
        data.age
      );

      profilesList.push({
        id: uid,
        uid,
        displayName: data.displayName || "Nomsiz",
        username: data.username || null,
        age: data.age ?? null,
        gender: data.gender || null,
        job: data.job || null,
        bio: data.bio || null,
        photos,
        distanceKm: data.distanceKm ?? null,
        interests: Array.isArray(data.interests) ? data.interests : [],
        isBot: Boolean(data.isBot || uid.startsWith("bot_")),
        createdAt: data.createdAt || data.updatedAt || null,
        updatedAt: data.updatedAt || null,
        userEmail: usersEmailMap.get(uid) || null,
        userStatus: usersStatusMap.get(uid) || "active",
        isComplete,
      });
    });
  } catch (err) {
    console.warn("getAdminProfilesData profiles query warning:", err);
  }

  return profilesList;
}

/**
 * Fetches all reports with detailed reporter and reported user information
 * and computes real-time status statistics.
 */
export async function getAdminReportsData() {
  const usersMap = new Map();
  const profilesMap = new Map();

  // 1. Fetch user accounts
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach((d) => {
      usersMap.set(d.id, d.data());
    });
  } catch (err) {
    console.warn("getAdminReportsData users warning:", err);
  }

  // 2. Fetch profiles
  try {
    const profilesSnap = await getDocs(collection(db, "tinder_profiles"));
    profilesSnap.forEach((d) => {
      profilesMap.set(d.id, d.data());
    });
  } catch (err) {
    console.warn("getAdminReportsData profiles warning:", err);
  }

  // 3. Fetch reports
  const reportsList = [];
  const stats = {
    total: 0,
    pending: 0,
    reviewing: 0,
    resolved: 0,
    dismissed: 0,
  };

  try {
    const reportsSnap = await getDocs(collection(db, "reports"));
    reportsSnap.forEach((d) => {
      const data = d.data();
      const reportId = d.id;

      const reporterId =
        data.reporterId || data.reporterUid || data.userId || null;
      const reportedUserId =
        data.reportedUserId || data.targetUid || data.reportedUid || null;

      const reporterUser = reporterId ? usersMap.get(reporterId) : null;
      const reporterProfile = reporterId ? profilesMap.get(reporterId) : null;

      const reportedUser = reportedUserId ? usersMap.get(reportedUserId) : null;
      const reportedProfile = reportedUserId ? profilesMap.get(reportedUserId) : null;

      const status = data.status || "pending";
      const priority = data.priority || "medium";
      const reason = data.reason || "other";

      const reportItem = {
        id: reportId,
        reportId,
        reporterId,
        reportedUserId,
        reporterName:
          data.reporterName ||
          reporterProfile?.displayName ||
          reporterUser?.displayName ||
          (reporterId ? `User (${reporterId.slice(0, 6)})` : "Noma'lum"),
        reporterUsername: reporterProfile?.username || null,
        reporterEmail: reporterUser?.email || null,
        reporterAvatar: reporterProfile?.photos?.[0] || null,

        reportedUserName:
          data.reportedUserName ||
          reportedProfile?.displayName ||
          reportedUser?.displayName ||
          (reportedUserId ? `User (${reportedUserId.slice(0, 6)})` : "Noma'lum"),
        reportedUserUsername: reportedProfile?.username || null,
        reportedUserEmail: reportedUser?.email || null,
        reportedUserAvatar: reportedProfile?.photos?.[0] || null,
        reportedUserProfile: reportedProfile
          ? {
              age: reportedProfile.age || null,
              job: reportedProfile.job || null,
              bio: reportedProfile.bio || null,
              photos: Array.isArray(reportedProfile.photos)
                ? reportedProfile.photos
                : [],
              distanceKm: reportedProfile.distanceKm ?? null,
              interests: Array.isArray(reportedProfile.interests)
                ? reportedProfile.interests
                : [],
            }
          : null,

        reason,
        description: data.description || "",
        status,
        priority,
        createdAt: data.createdAt || null,
        reviewedAt: data.reviewedAt || null,
        reviewedBy: data.reviewedBy || null,
      };

      reportsList.push(reportItem);

      // Aggregate stats
      stats.total++;
      if (status === "pending") stats.pending++;
      else if (status === "reviewing") stats.reviewing++;
      else if (status === "resolved") stats.resolved++;
      else if (status === "dismissed") stats.dismissed++;
    });
  } catch (err) {
    console.warn("getAdminReportsData reports query warning:", err);
  }

  return { reports: reportsList, stats };
}

/**
 * Updates a report's status safely (e.g. reviewing, resolved, dismissed, pending)
 */
export async function updateReportStatus(reportId, newStatus) {
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  await setDoc(
    doc(db, "reports", reportId),
    {
      status: newStatus,
      reviewedAt: serverTimestamp(),
      reviewedBy: "luxaidevs@gmail.com",
    },
    { merge: true }
  );

  await logAdminAuditAction({
    action: "UPDATE_REPORT_STATUS",
    targetUid: reportId,
    details: { reportId, status: newStatus },
  });
}


