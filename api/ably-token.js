import Ably from 'ably';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { clientId } = req.query;

  if (!clientId) {
    return res.status(400).json({ success: false, message: 'clientId required' });
  }

  try {
    const ably = new Ably.Rest(process.env.ABLY_API_KEY);
    
    const tokenParams = {
      clientId: String(clientId),
      capability: {
        [`user:${clientId}`]: ['subscribe', 'publish', 'presence'],
        [`chat:*`]: ['subscribe', 'publish', 'presence'],
        'presence:global': ['subscribe', 'publish', 'presence']
      }
    };

    const tokenRequest = await ably.auth.createTokenRequest(tokenParams);
    
    return res.status(200).json(tokenRequest);
  } catch (error) {
    console.error('Ably token error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate token' });
  }
}
