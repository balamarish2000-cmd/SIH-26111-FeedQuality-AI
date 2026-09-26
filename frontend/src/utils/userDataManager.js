/**
 * Feed Guard - Isolated User Data Management System
 * Guarantees that every farmer account has private, separate data:
 * - Feed test records
 * - Silage monitoring telemetry
 * - Farmer notifications
 * - Computed dashboard analytics
 */

const STORAGE_PREFIX = 'feedguard_';

export function getUserTestsKey(userId) {
  return `${STORAGE_PREFIX}tests_${userId || 'anonymous'}`;
}

export function getUserSilageKey(userId) {
  return `${STORAGE_PREFIX}silage_${userId || 'anonymous'}`;
}

export function getUserNotificationsKey(userId) {
  return `${STORAGE_PREFIX}notifications_${userId || 'anonymous'}`;
}

/**
 * Retrieve all feed tests for a specific authenticated farmer
 */
export function getUserTests(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getUserTestsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error(`Failed reading tests for user ${userId}:`, err);
    return [];
  }
}

/**
 * Save a new feed test record for a specific farmer
 */
export function saveUserTest(userId, testRecord) {
  if (!userId || !testRecord) return null;
  try {
    const current = getUserTests(userId);
    const updated = [testRecord, ...current.filter(t => t.id !== testRecord.id)].slice(0, 100);
    localStorage.setItem(getUserTestsKey(userId), JSON.stringify(updated));

    // Also add an audit notification for the user
    addUserNotification(userId, {
      id: `NOTIF-${Date.now()}`,
      title: 'Feed Analysis Recorded',
      message: `Sample ${testRecord.id} (${testRecord.feed_type}) was evaluated as ${testRecord.quality_status}.`,
      timestamp: new Date().toISOString(),
      read: false,
    });

    return updated;
  } catch (err) {
    console.error(`Failed saving test for user ${userId}:`, err);
    return null;
  }
}

/**
 * Calculate dynamic dashboard statistics from the farmer's own tests
 * For a new farmer with 0 tests, all counts will strictly be 0.
 */
export function getUserDashboardStats(userId) {
  const tests = getUserTests(userId);

  const total = tests.length;
  const goodCount = tests.filter(t => t.quality_status === 'Good').length;
  const attentionCount = tests.filter(t => t.quality_status === 'Moderate').length;
  const unsafeCount = tests.filter(t => t.quality_status === 'Poor' || t.quality_status === 'Unsafe').length;
  const adulterationCount = tests.filter(t => t.adulteration_type && t.adulteration_type !== 'None').length;

  // Quality distribution
  const qualityDistribution = {
    Good: goodCount,
    Moderate: attentionCount,
    Poor: tests.filter(t => t.quality_status === 'Poor').length,
    Unsafe: tests.filter(t => t.quality_status === 'Unsafe').length,
  };

  // Feed type distribution
  const feedTypeDistribution = {};
  tests.forEach(t => {
    const type = t.feed_type || 'Cattle Feed Pellet';
    feedTypeDistribution[type] = (feedTypeDistribution[type] || 0) + 1;
  });

  // Monthly testing volume trend (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyTrend = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mLabel = monthNames[d.getMonth()];
    const count = tests.filter(t => {
      if (!t.timestamp) return false;
      const tDate = new Date(t.timestamp);
      return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
    }).length;

    monthlyTrend.push({ month: mLabel, count });
  }

  // Contamination breakdown
  const adulterationBreakdown = {
    Urea: 0,
    Silica: 0,
    Moisture: 0,
    Aflatoxin: 0,
    None: 0,
  };

  tests.forEach(t => {
    const a = t.adulteration_type;
    if (a && adulterationBreakdown.hasOwnProperty(a)) {
      adulterationBreakdown[a]++;
    } else if (a && a !== 'None') {
      adulterationBreakdown[a] = (adulterationBreakdown[a] || 0) + 1;
    }
  });

  return {
    total_analyses: total,
    quality_distribution: qualityDistribution,
    feed_type_distribution: feedTypeDistribution,
    monthly_trend: monthlyTrend,
    adulteration_distribution: adulterationBreakdown,
    recent_analyses: tests.slice(0, 10),
  };
}

/**
 * Retrieve silage telemetry records for a farmer
 */
export function getUserSilage(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getUserSilageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error(`Failed reading silage for user ${userId}:`, err);
    return null;
  }
}

/**
 * Save silage telemetry for a farmer
 */
export function saveUserSilage(userId, silageData) {
  if (!userId || !silageData) return null;
  try {
    localStorage.setItem(getUserSilageKey(userId), JSON.stringify(silageData));
    return silageData;
  } catch (err) {
    console.error(`Failed saving silage for user ${userId}:`, err);
    return null;
  }
}

/**
 * Retrieve notifications for a farmer
 */
export function getUserNotifications(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getUserNotificationsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error(`Failed reading notifications for user ${userId}:`, err);
    return [];
  }
}

/**
 * Add a notification for a farmer
 */
export function addUserNotification(userId, notification) {
  if (!userId || !notification) return;
  try {
    const notifs = getUserNotifications(userId);
    const updated = [notification, ...notifs].slice(0, 20);
    localStorage.setItem(getUserNotificationsKey(userId), JSON.stringify(updated));
  } catch (err) {
    console.error(`Failed adding notification for user ${userId}:`, err);
  }
}

/**
 * Mark all notifications as read for a farmer
 */
export function markNotificationsAsRead(userId) {
  if (!userId) return;
  try {
    const notifs = getUserNotifications(userId).map(n => ({ ...n, read: true }));
    localStorage.setItem(getUserNotificationsKey(userId), JSON.stringify(notifs));
  } catch (err) {
    console.error(`Failed marking notifications as read for user ${userId}:`, err);
  }
}
