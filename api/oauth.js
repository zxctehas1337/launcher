import { findOrCreateOAuthUser } from './_lib/oauth.js';
import { generateToken } from './_lib/jwt.js';
import { mapOAuthUser } from './_lib/userMapper.js';

export default async (req, res) => {
  const { provider, action } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://shakedown.vercel.app';
  const baseUrl = frontendUrl; // Используем FRONTEND_URL, а не VERCEL_URL (он меняется при каждом деплое)

  if (!['github', 'google', 'yandex'].includes(provider)) {
    return res.status(400).json({ success: false, message: 'Invalid provider' });
  }

  if (action === 'callback') {
    return handleCallback(req, res, provider, frontendUrl, baseUrl);
  }

  // Redirect to OAuth provider
  return handleRedirect(res, provider, baseUrl);
};

function handleRedirect(res, provider, baseUrl) {
  const redirectUris = {
    github: process.env.GITHUB_CALLBACK_URL || `${baseUrl}/api/oauth?provider=${provider}&action=callback`,
    google: process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/oauth?provider=${provider}&action=callback`,
    yandex: process.env.YANDEX_CALLBACK_URL || `${baseUrl}/api/oauth?provider=${provider}&action=callback`
  };
  const redirectUri = redirectUris[provider];

  const urls = {
    github: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('user:email')}`,
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('profile email')}&access_type=offline`,
    yandex: `https://oauth.yandex.ru/authorize?client_id=${process.env.YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
  };

  res.redirect(urls[provider]);
}

async function handleCallback(req, res, provider, frontendUrl, baseUrl) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${frontendUrl}/auth?error=${provider}_failed`);
  }

  try {
    const handlers = { github: handleGitHub, google: handleGoogle, yandex: handleYandex };
    const profile = await handlers[provider](code, baseUrl, provider);

    const user = await findOrCreateOAuthUser(profile, provider);
    const token = generateToken(user);
    const userData = mapOAuthUser(user, token);
    const encodedUser = encodeURIComponent(JSON.stringify(userData));

    res.redirect(`${frontendUrl}/auth?auth=success&user=${encodedUser}`);
  } catch (err) {
    console.error(`${provider} OAuth error:`, err);
    res.redirect(`${frontendUrl}/auth?error=${provider}_failed`);
  }
}

async function handleGitHub(code) {
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const tokens = await tokenResponse.json();
  if (!tokens.access_token) throw new Error('Token failed');

  const userResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  const profile = await userResponse.json();

  let email = profile.email;
  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const emails = await emailsResponse.json();
    const primaryEmail = emails.find(e => e.primary);
    email = primaryEmail ? primaryEmail.email : null;
  }

  return { id: profile.id.toString(), email, name: profile.name || profile.login, login: profile.login };
}

async function handleGoogle(code, baseUrl, provider) {
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/oauth?provider=${provider}&action=callback`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  const tokens = await tokenResponse.json();
  if (!tokens.access_token) throw new Error('Token failed');

  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  const profile = await userResponse.json();

  return { id: profile.id, email: profile.email, name: profile.name };
}

async function handleYandex(code) {
  const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.YANDEX_CLIENT_ID,
      client_secret: process.env.YANDEX_CLIENT_SECRET
    })
  });

  const tokens = await tokenResponse.json();
  if (!tokens.access_token) throw new Error('Token failed');

  const userResponse = await fetch('https://login.yandex.ru/info?format=json', {
    headers: { Authorization: `OAuth ${tokens.access_token}` }
  });
  const profile = await userResponse.json();

  return { id: profile.id, email: profile.default_email || `${profile.id}@yandex.oauth`, name: profile.display_name || profile.login };
}
