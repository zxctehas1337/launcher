import { findOrCreateOAuthUser } from './_lib/oauth.js';
import { generateToken } from './_lib/jwt.js';
import { mapOAuthUser } from './_lib/userMapper.js';

// Вспомогательная функция для кодирования/декодирования state
function encodeState(stateObj) {
  return Buffer.from(JSON.stringify(stateObj)).toString('base64');
}

function decodeState(stateStr) {
  try {
    // Пробуем декодировать base64. Если не получается (старый формат), возвращаем как есть
    if (!stateStr) return {};

    // Проверка на старый текстовый формат 'launcher'/'web'
    if (stateStr === 'launcher') return { source: 'launcher' };
    if (stateStr === 'web') return { source: 'web' };

    const decoded = Buffer.from(stateStr, 'base64').toString('utf-8');
    // Проверяем, является ли это JSON
    if (decoded.trim().startsWith('{')) {
      return JSON.parse(decoded);
    }
    return { source: stateStr }; // Fallback
  } catch (e) {
    return { source: stateStr };
  }
}

export default async (req, res) => {
  const { provider, action, redirect } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://shakedown.vercel.app';
  const baseUrl = frontendUrl; // Используем FRONTEND_URL, а не VERCEL_URL (он меняется при каждом деплое)

  if (!['github', 'google', 'yandex'].includes(provider)) {
    return res.status(400).json({ success: false, message: 'Invalid provider' });
  }

  if (action === 'callback') {
    return handleCallback(req, res, provider, frontendUrl, baseUrl, redirect);
  }

  // Обмен code на токен для лаунчера (когда GitHub редиректит на localhost, а localhost редиректит сюда)
  if (action === 'exchange') {
    return handleExchange(req, res, provider);
  }

  // Redirect to OAuth provider
  const hwid = req.query.hwid;
  return handleRedirect(res, provider, baseUrl, redirect, hwid);
};

function handleRedirect(res, provider, baseUrl, redirect, hwid) {
  // Для лаунчера используем специальный redirect_uri на localhost
  // GitHub примет этот redirect_uri даже если он не совпадает с зарегистрированным
  const isLauncher = redirect === 'launcher';

  const redirectUris = {
    github: isLauncher
      ? `http://localhost:3000/api/oauth?provider=${provider}&action=callback`
      : (process.env.GITHUB_CALLBACK_URL || `${baseUrl}/api/oauth?provider=${provider}&action=callback`),
    google: process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/oauth?provider=${provider}&action=callback`,
    yandex: process.env.YANDEX_CALLBACK_URL || `${baseUrl}/api/oauth?provider=${provider}&action=callback`
  };
  const redirectUri = redirectUris[provider];

  // Используем state параметр для передачи информации о лаунчере и HWID
  const stateObj = {
    source: isLauncher ? 'launcher' : 'web',
    hwid: hwid || null
  };
  const state = encodeState(stateObj);

  const urls = {
    github: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('user:email')}&state=${state}`,
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('profile email')}&access_type=offline&state=${state}`,
    yandex: `https://oauth.yandex.ru/authorize?client_id=${process.env.YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`
  };

  res.redirect(urls[provider]);
}

async function handleCallback(req, res, provider, frontendUrl, baseUrl, redirect) {
  const { code, error, state } = req.query;

  const stateData = decodeState(state);
  // Определяем источник запроса: из параметра redirect или из state
  const isLauncher = redirect === 'launcher' || stateData.source === 'launcher';
  const hwid = stateData.hwid;

  if (error || !code) {
    // Если это запрос от лаунчера, редиректим на локальный сервер с ошибкой
    if (isLauncher) {
      return res.redirect(`http://127.0.0.1:3000/callback?error=${provider}_failed`);
    }
    return res.redirect(`${frontendUrl}/auth?error=${provider}_failed`);
  }

  try {
    const handlers = { github: handleGitHub, google: handleGoogle, yandex: handleYandex };
    const profile = await handlers[provider](code, baseUrl, provider);

    const user = await findOrCreateOAuthUser(profile, provider, hwid);
    const token = generateToken(user);
    const userData = mapOAuthUser(user, token);
    const encodedUser = encodeURIComponent(JSON.stringify(userData));

    // Если это запрос от лаунчера, редиректим на локальный сервер
    if (isLauncher) {
      return res.redirect(`http://127.0.0.1:3000/callback?user=${encodedUser}`);
    }

    // Иначе редиректим на фронтенд
    res.redirect(`${frontendUrl}/auth?auth=success&user=${encodedUser}`);
  } catch (err) {
    console.error(`${provider} OAuth error:`, err);

    // Если это запрос от лаунчера, редиректим на локальный сервер с ошибкой
    if (isLauncher) {
      return res.redirect(`http://127.0.0.1:3000/callback?error=${provider}_failed`);
    }
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

  return {
    id: profile.id.toString(),
    email,
    name: profile.name || profile.login,
    login: profile.login,
    avatar: profile.avatar_url
  };
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

  return { id: profile.id, email: profile.email, name: profile.name, avatar: profile.picture };
}

// Обмен code на токен для лаунчера (GitHub OAuth через localhost)
async function handleExchange(req, res, provider) {
  const { code, source, state } = req.query;

  if (!code) {
    return res.redirect(`http://127.0.0.1:3000/callback?error=no_code`);
  }

  const stateData = decodeState(state);
  // Используем хардкод source из query, но можно проверить и stateData.source
  const hwid = stateData.hwid;

  // Только для запросов от лаунчера
  if (source !== 'launcher') {
    return res.status(400).json({ success: false, message: 'Invalid source' });
  }

  try {
    const handlers = { github: handleGitHub, google: handleGoogle, yandex: handleYandex };
    const profile = await handlers[provider](code);

    const user = await findOrCreateOAuthUser(profile, provider, hwid);
    const token = generateToken(user);
    const userData = mapOAuthUser(user, token);
    const encodedUser = encodeURIComponent(JSON.stringify(userData));

    // Редиректим обратно на локальный сервер лаунчера с данными пользователя
    return res.redirect(`http://127.0.0.1:3000/callback?user=${encodedUser}`);
  } catch (err) {
    console.error(`${provider} OAuth exchange error:`, err);
    return res.redirect(`http://127.0.0.1:3000/callback?error=${provider}_failed`);
  }
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

  const avatarId = profile.default_avatar_id;
  const avatar = avatarId ? `https://avatars.yandex.net/get-yapic/${avatarId}/islands-200` : null;

  return {
    id: profile.id,
    email: profile.default_email || `${profile.id}@yandex.oauth`,
    name: profile.display_name || profile.login,
    avatar
  };
}
