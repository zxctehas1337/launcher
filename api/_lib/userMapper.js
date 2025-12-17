export function mapUserFromDb(dbUser) {
  const normalizedSubscription = String(dbUser.subscription || 'free').trim().toLowerCase();
  const subscription = normalizedSubscription === 'premium' || normalizedSubscription === 'alpha' ? normalizedSubscription : 'free';
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    subscription,
    avatar: dbUser.avatar,
    registeredAt: dbUser.registered_at,
    isAdmin: dbUser.is_admin,
    isBanned: dbUser.is_banned,
    emailVerified: dbUser.email_verified,
    settings: dbUser.settings,
    hwid: dbUser.hwid
  };
}

export function mapOAuthUser(user, token) {
  const normalizedSubscription = String(user.subscription || 'free').trim().toLowerCase();
  const subscription = normalizedSubscription === 'premium' || normalizedSubscription === 'alpha' ? normalizedSubscription : 'free';
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    subscription,
    avatar: user.avatar,
    registeredAt: user.registered_at,
    isAdmin: user.is_admin,
    isBanned: user.is_banned,
    emailVerified: true,
    settings: user.settings,
    hwid: user.hwid,
    token: token
  };
}

