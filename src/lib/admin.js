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

/**
 * Fetches all matches with full user 1 and user 2 profiles
 * and computes real-time statistics (total, today, thisWeek, thisMonth).
 */
export async function getAdminMatchesData() {
  const usersMap = new Map();
  const profilesMap = new Map();

  // 1. Fetch user accounts
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach((d) => {
      usersMap.set(d.id, d.data());
    });
  } catch (err) {
    console.warn("getAdminMatchesData users warning:", err);
  }

  // 2. Fetch profiles
  try {
    const profilesSnap = await getDocs(collection(db, "tinder_profiles"));
    profilesSnap.forEach((d) => {
      profilesMap.set(d.id, d.data());
    });
  } catch (err) {
    console.warn("getAdminMatchesData profiles warning:", err);
  }

  // 3. Fetch matches
  const matchesList = [];
  const stats = {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    withChat: 0,
  };

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const weekMs = now - 7 * 24 * 60 * 60 * 1000;
  const monthMs = now - 30 * 24 * 60 * 60 * 1000;

  try {
    const matchesSnap = await getDocs(collection(db, "tinder_matches"));
    matchesSnap.forEach((d) => {
      const data = d.data();
      const matchId = d.id;
      const userIds = Array.isArray(data.users) ? data.users : [];

      const uid1 = userIds[0] || null;
      const uid2 = userIds[1] || null;

      const profile1Data = uid1 ? profilesMap.get(uid1) : null;
      const user1Data = uid1 ? usersMap.get(uid1) : null;

      const profile2Data = uid2 ? profilesMap.get(uid2) : null;
      const user2Data = uid2 ? usersMap.get(uid2) : null;

      // Extract User 1
      const user1 = {
        uid: uid1,
        displayName:
          profile1Data?.displayName ||
          user1Data?.displayName ||
          data.profiles?.[uid1]?.displayName ||
          (uid1 ? `User (${uid1.slice(0, 6)})` : "Noma'lum"),
        username: profile1Data?.username || null,
        email: user1Data?.email || null,
        avatar:
          profile1Data?.photos?.[0] ||
          data.profiles?.[uid1]?.photo ||
          null,
        age: profile1Data?.age ?? null,
        job: profile1Data?.job || null,
        bio: profile1Data?.bio || null,
        distanceKm: profile1Data?.distanceKm ?? null,
        interests: Array.isArray(profile1Data?.interests)
          ? profile1Data.interests
          : [],
        photos: Array.isArray(profile1Data?.photos)
          ? profile1Data.photos
          : [],
        isBot: Boolean(profile1Data?.isBot || uid1?.startsWith("bot_")),
      };

      // Extract User 2
      const user2 = {
        uid: uid2,
        displayName:
          profile2Data?.displayName ||
          user2Data?.displayName ||
          data.profiles?.[uid2]?.displayName ||
          (uid2 ? `User (${uid2.slice(0, 6)})` : "Noma'lum"),
        username: profile2Data?.username || null,
        email: user2Data?.email || null,
        avatar:
          profile2Data?.photos?.[0] ||
          data.profiles?.[uid2]?.photo ||
          null,
        age: profile2Data?.age ?? null,
        job: profile2Data?.job || null,
        bio: profile2Data?.bio || null,
        distanceKm: profile2Data?.distanceKm ?? null,
        interests: Array.isArray(profile2Data?.interests)
          ? profile2Data.interests
          : [],
        photos: Array.isArray(profile2Data?.photos)
          ? profile2Data.photos
          : [],
        isBot: Boolean(profile2Data?.isBot || uid2?.startsWith("bot_")),
      };

      const hasChat = Boolean(data.lastMessage);
      const isBot = Boolean(data.isBot || user1.isBot || user2.isBot);
      const status = hasChat ? "active" : "inactive";

      const createdTimeMs =
        data.createdAt?.toMillis?.() ||
        (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0) ||
        0;

      const matchItem = {
        id: matchId,
        matchId,
        users: userIds,
        user1,
        user2,
        isBot,
        hasChat,
        lastMessage: data.lastMessage || null,
        lastMessageAt: data.lastMessageAt || null,
        createdAt: data.createdAt || null,
        status,
      };

      matchesList.push(matchItem);

      // Stats aggregation
      stats.total++;
      if (hasChat) stats.withChat++;
      if (createdTimeMs >= todayMs) stats.today++;
      if (createdTimeMs >= weekMs) stats.thisWeek++;
      if (createdTimeMs >= monthMs) stats.thisMonth++;
    });
  } catch (err) {
    console.warn("getAdminMatchesData matches query warning:", err);
  }

  return { matches: matchesList, stats };
}

/**
 * Fetches realtime messages for a specific match from Firestore subcollection
 */
export async function getAdminMatchMessages(matchId) {
  try {
    const { query, orderBy } = await import("firebase/firestore");
    const q = query(
      collection(db, "tinder_matches", matchId, "messages"),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    const messages = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Record audit action
    await logAdminAuditAction({
      action: "INSPECT_MATCH_CHAT",
      targetUid: matchId,
      details: { messagesCount: messages.length },
    });

    return messages;
  } catch (err) {
    console.warn("getAdminMatchMessages warning:", err);
    return [];
  }
}

/**
 * Fetches all chat conversations with activity statistics
 */
export async function getAdminChatsData() {
  const { matches } = await getAdminMatchesData();

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  let totalConversations = matches.length;
  let activeConversations = 0;
  let todayConversations = 0;
  let totalWithLastMessage = 0;

  matches.forEach((m) => {
    if (m.hasChat) {
      activeConversations++;
      totalWithLastMessage++;
    }
    const lastActiveMs =
      m.lastMessageAt?.toMillis?.() ||
      (m.lastMessageAt?.seconds ? m.lastMessageAt.seconds * 1000 : 0) ||
      m.createdAt?.toMillis?.() ||
      (m.createdAt?.seconds ? m.createdAt.seconds * 1000 : 0) ||
      0;
    if (lastActiveMs >= todayMs) {
      todayConversations++;
    }
  });

  const stats = {
    totalConversations,
    activeConversations,
    todayConversations,
    inactiveConversations: totalConversations - activeConversations,
  };

  return { conversations: matches, stats };
}

/**
 * Fetches central moderation queue and aggregated metrics
 */
export async function getAdminModerationData() {
  const { reports, stats: reportStats } = await getAdminReportsData();
  const users = await getAdminUsersData();

  // Aggregate reported/flagged users
  const reportedUsers = users.filter(
    (u) => (u.reportsCount && u.reportsCount > 0) || u.status === "suspended" || u.status === "banned"
  );

  const queueItems = [];

  // Add report items to queue
  reports.forEach((r) => {
    queueItems.push({
      id: `rep_${r.id}`,
      originalId: r.id,
      type: "report",
      title: r.reason === "fake_profile"
        ? "Soxta profil shikoyati"
        : r.reason === "harassment"
        ? "Tazyiq / Haqorat shikoyati"
        : r.reason === "spam"
        ? "Spam / Reklama shikoyati"
        : r.reason === "inappropriate_content"
        ? "Nomaqbul kontent shikoyati"
        : r.reason === "scam"
        ? "Firibgarlik shikoyati"
        : "Foydalanuvchi shikoyati",
      reason: r.reason,
      description: r.description,
      priority: r.priority || "medium",
      status: r.status || "pending",
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      reviewedBy: r.reviewedBy,
      targetUser: {
        uid: r.reportedUserId,
        displayName: r.reportedUserName,
        email: r.reportedUserEmail,
        avatar: r.reportedUserAvatar,
        profile: r.reportedUserProfile,
      },
      initiator: {
        uid: r.reporterId,
        displayName: r.reporterName,
        email: r.reporterEmail,
        avatar: r.reporterAvatar,
      },
      rawReport: r,
    });
  });

  // Sort queue by priority and date
  queueItems.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    if (pDiff !== 0) return pDiff;

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

  const stats = {
    pendingCount: reportStats.pending,
    reviewingCount: reportStats.reviewing,
    resolvedCount: reportStats.resolved,
    dismissedCount: reportStats.dismissed,
    reportedUsersCount: reportedUsers.length,
    suspendedUsersCount: users.filter((u) => u.status === "suspended" || u.status === "banned").length,
    totalItems: queueItems.length,
  };

  return { queueItems, stats, reportedUsers };
}

/**
 * Fetches comprehensive analytics across all real collections with time filters
 */
export async function getAdminComprehensiveStats(timeRange = "30") {
  const users = await getAdminUsersData();
  const profiles = await getAdminProfilesData();
  const { matches } = await getAdminMatchesData();
  const { reports } = await getAdminReportsData();

  const now = Date.now();
  let cutoffMs = 0;
  if (timeRange === "1") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    cutoffMs = startOfToday.getTime();
  } else if (timeRange === "7") {
    cutoffMs = now - 7 * 24 * 60 * 60 * 1000;
  } else if (timeRange === "30") {
    cutoffMs = now - 30 * 24 * 60 * 60 * 1000;
  } else if (timeRange === "90") {
    cutoffMs = now - 90 * 24 * 60 * 60 * 1000;
  }

  // User metrics
  const totalUsers = users.length;
  const newUsersInRange = users.filter((u) => {
    const t =
      u.createdAt?.toMillis?.() ||
      (u.createdAt?.seconds ? u.createdAt.seconds * 1000 : 0) ||
      0;
    return t >= cutoffMs;
  }).length;
  const verifiedUsers = users.filter((u) => u.verified).length;
  const activeAccounts = users.filter((u) => u.status === "active").length;

  // Profile metrics
  const totalProfiles = profiles.length;
  const completeProfiles = profiles.filter((p) => p.isComplete).length;
  const botProfiles = profiles.filter((p) => p.isBot).length;

  // Match metrics
  const totalMatches = matches.length;
  const newMatchesInRange = matches.filter((m) => {
    const t =
      m.createdAt?.toMillis?.() ||
      (m.createdAt?.seconds ? m.createdAt.seconds * 1000 : 0) ||
      0;
    return t >= cutoffMs;
  }).length;
  const matchesWithChat = matches.filter((m) => m.hasChat).length;

  // Report metrics
  const totalReports = reports.length;
  const reportsByReason = {
    fake_profile: 0,
    harassment: 0,
    spam: 0,
    inappropriate_content: 0,
    scam: 0,
    other: 0,
  };
  const reportsByStatus = {
    pending: 0,
    reviewing: 0,
    resolved: 0,
    dismissed: 0,
  };

  reports.forEach((r) => {
    const reasonKey = r.reason || "other";
    if (reportsByReason[reasonKey] !== undefined) {
      reportsByReason[reasonKey]++;
    } else {
      reportsByReason.other++;
    }

    const statusKey = r.status || "pending";
    if (reportsByStatus[statusKey] !== undefined) {
      reportsByStatus[statusKey]++;
    }
  });

  // Calculate day-by-day activity distribution for charts
  const daysCount = timeRange === "1" ? 1 : timeRange === "7" ? 7 : timeRange === "30" ? 14 : 14;
  const dailyDistribution = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayStartMs = dayStart.getTime();
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

    const dayUsers = users.filter((u) => {
      const t =
        u.createdAt?.toMillis?.() ||
        (u.createdAt?.seconds ? u.createdAt.seconds * 1000 : 0) ||
        0;
      return t >= dayStartMs && t < dayEndMs;
    }).length;

    const dayMatches = matches.filter((m) => {
      const t =
        m.createdAt?.toMillis?.() ||
        (m.createdAt?.seconds ? m.createdAt.seconds * 1000 : 0) ||
        0;
      return t >= dayStartMs && t < dayEndMs;
    }).length;

    const dayReports = reports.filter((r) => {
      const t =
        r.createdAt?.toMillis?.() ||
        (r.createdAt?.seconds ? r.createdAt.seconds * 1000 : 0) ||
        0;
      return t >= dayStartMs && t < dayEndMs;
    }).length;

    dailyDistribution.push({
      dateLabel: `${dayStart.getDate()}/${dayStart.getMonth() + 1}`,
      users: dayUsers,
      matches: dayMatches,
      reports: dayReports,
    });
  }

  return {
    users: {
      total: totalUsers,
      newInRange: newUsersInRange,
      verified: verifiedUsers,
      active: activeAccounts,
    },
    profiles: {
      total: totalProfiles,
      complete: completeProfiles,
      incomplete: totalProfiles - completeProfiles,
      bots: botProfiles,
    },
    matches: {
      total: totalMatches,
      newInRange: newMatchesInRange,
      withChat: matchesWithChat,
      withoutChat: totalMatches - matchesWithChat,
    },
    reports: {
      total: totalReports,
      byReason: reportsByReason,
      byStatus: reportsByStatus,
    },
    dailyDistribution,
  };
}

/**
 * Fetches recent audit actions recorded in `admin_logs`
 */
export async function getAdminAuditLogs() {
  try {
    const logsSnap = await getDocs(collection(db, "admin_logs"));
    const logs = logsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Sort newest first
    logs.sort((a, b) => {
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

    return logs.slice(0, 30);
  } catch (err) {
    console.warn("getAdminAuditLogs warning:", err);
    return [];
  }
}




