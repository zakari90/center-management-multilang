import { MongoClient } from 'mongodb';

let cachedClient = null;

export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  
  cachedClient = client;
  return client;
}