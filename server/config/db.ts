import { MongoClient, type Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB ?? 'sheetflow'

export async function initDb(): Promise<void> {

  if (db) return

  try {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
    
    console.log(`✅ Connected to MongoDB: ${dbName}`)


    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    
    await db.collection('documents').createIndex({ ownerUserId: 1, updatedAt: -1 })

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialised. Did you forget to call initDb() in server.ts?')
  }
  return db
}