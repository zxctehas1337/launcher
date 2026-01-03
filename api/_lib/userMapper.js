export function mapUserFromDb(dbUser) {
  const normalizedSubscription = String(dbUser.subscription || 'free').trim().toLowerCase();
  const subscription = normalizedSubscription === 'premium' || normalizedSubscription === 'alpha' ? normalizedSubscription : 'free';
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    subscription,
    subscriptionEndDate: dbUser.subscription_end_date || null,
    avatar: dbUser.avatar,
    registeredAt: dbUser.registered_at,
    isAdmin: dbUser.is_admin,
    isBanned: dbUser.is_banned,
    emailVerified: dbUser.email_verified,
    settings: dbUser.settings,
    hwid: dbUser.hwid
  };
}

// Маппер для OAuth - возвращает минимальные данные для передачи через URL
// Не включает settings чтобы избежать слишком длинного URL
export function mapOAuthUser(dbUser, token) {
  const normalizedSubscription = String(dbUser.subscription || 'free').trim().toLowerCase();
  const subscription = normalizedSubscription === 'premium' || normalizedSubscription === 'alpha' ? normalizedSubscription : 'free';
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    subscription,
    subscriptionEndDate: dbUser.subscription_end_date || null,
    avatar: dbUser.avatar,
    registeredAt: dbUser.registered_at,
    isAdmin: dbUser.is_admin || false,
    isBanned: dbUser.is_banned || false,
    emailVerified: true, // OAuth всегда верифицирован
    hwid: dbUser.hwid,
    token
  };
}

