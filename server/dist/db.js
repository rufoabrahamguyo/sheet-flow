import { MongoClient } from 'mongodb';
let client = null;
let db = null;
const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB ?? 'sheetflow';
export async function initDb() {
    if (db)
        return;
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('documents').createIndex({ ownerUserId: 1, updatedAt: -1 });
}
export function getDb() {
    if (!db) {
        throw new Error('Database not initialised');
    }
    return db;
}
export async function listDocumentsForUser(userId) {
    const col = getDb().collection('documents');
    const docs = await col
        .find({ ownerUserId: userId }, {
        projection: { _id: 0, id: 1, title: 1, updatedAt: 1, createdAt: 1 },
        sort: { updatedAt: -1 },
    })
        .toArray();
    return docs.map((d) => ({
        id: d.id,
        title: d.title ?? null,
        updated_at: d.updatedAt,
        created_at: d.createdAt,
    }));
}
export async function getDocumentForUser(userId, docId) {
    const col = getDb().collection('documents');
    const row = (await col.findOne({ id: docId, ownerUserId: userId }));
    return row?.data ?? null;
}
export async function createDocumentForUser(userId, doc) {
    const col = getDb().collection('documents');
    const now = new Date().toISOString();
    await col.insertOne({
        id: doc.id,
        ownerUserId: userId,
        title: doc.name ?? null,
        data: doc,
        createdAt: now,
        updatedAt: now,
    });
}
export async function putDocumentForUser(userId, doc) {
    const col = getDb().collection('documents');
    const now = new Date().toISOString();
    await col.updateOne({ id: doc.id, ownerUserId: userId }, {
        $set: {
            title: doc.name ?? null,
            data: doc,
            updatedAt: now,
        },
        $setOnInsert: {
            createdAt: now,
        },
    }, { upsert: true });
}
