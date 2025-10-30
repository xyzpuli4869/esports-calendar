export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { game, token } = req.query;
  
  if (!game || !token) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const response = await fetch(
      `https://api.pandascore.co/${game}/matches?per_page=100&token=${token}`
    );
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'API request failed' });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}