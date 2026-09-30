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
