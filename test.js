import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW();');
    await client.end();
    
    res.status(200).json({
      success: true,
      message: '✓ Connected successfully',
      timestamp: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}