// Маппинг пользователя из БД в API формат
function mapUserFromDb(dbUser) {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    subscription: dbUser.subscription,
    registeredAt: dbUser.registered_at,
    isAdmin: dbUser.is_admin,
    isBanned: dbUser.is_banned,
    emailVerified: dbUser.email_verified,
    settings: dbUser.settings
  };
}

module.exports = { mapUserFromDb };
