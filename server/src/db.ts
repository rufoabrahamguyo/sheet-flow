import { MongoClient, type Db } from 'mongodb'
import type { DocumentData } from './types.js'

let client: MongoClient | null = null
let db: Db | null = null

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB ?? 'sheetflow'

export async function initDb(): Promise<void> {
  if (db) return
  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  await db.collection('documents').createIndex({ ownerUserId: 1, updatedAt: -1 })
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialised')
  }
  return db
}

export type DocumentListItem = {
  id: string
  title: string | null
  updated_at: string
  created_at: string
}

export async function listDocumentsForUser(userId: string): Promise<DocumentListItem[]> {
  const col = getDb().collection('documents')
  const docs = await col
    .find(
      { ownerUserId: userId },
      {
        projection: { _id: 0, id: 1, title: 1, updatedAt: 1, createdAt: 1 },
        sort: { updatedAt: -1 },
      }
    )
    .toArray()
  return docs.map((d: any) => ({
    id: d.id,
    title: d.title ?? null,
    updated_at: d.updatedAt,
    created_at: d.createdAt,
  }))
}

export async function getDocumentForUser(userId: string, docId: string): Promise<DocumentData | null> {
  const col = getDb().collection('documents')
  const row = (await col.findOne({ id: docId, ownerUserId: userId })) as any | null
  return row?.data ?? null
}

export async function createDocumentForUser(userId: string, doc: DocumentData): Promise<void> {
  const col = getDb().collection('documents')
  const now = new Date().toISOString()
  await col.insertOne({
    id: doc.id,
    ownerUserId: userId,
    title: doc.name ?? null,
    data: doc,
    createdAt: now,
    updatedAt: now,
  })
}

export async function putDocumentForUser(userId: string, doc: DocumentData): Promise<void> {
  const col = getDb().collection('documents')
  const now = new Date().toISOString()
  await col.updateOne(
    { id: doc.id, ownerUserId: userId },
    {
      $set: {
        title: doc.name ?? null,
        data: doc,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  )
}
