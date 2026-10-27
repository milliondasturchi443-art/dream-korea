import { GridFSBucket, MongoClient, ObjectId } from "mongodb";

// MongoDB GridFS — katta PDF fayllarni (16MB hujjat chegarasidan tashqari) bazada saqlash.
// MongoDB Atlas shu instance'da saqlanadi, qayta deploy ham yo'qolmaydi.
type GlobalWithMongo = typeof globalThis & { __dkMongo?: Promise<MongoClient> };
const g = globalThis as GlobalWithMongo;

async function client(): Promise<MongoClient> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL sozlanmagan");
  if (!g.__dkMongo) {
    g.__dkMongo = new MongoClient(url, { maxPoolSize: 5 }).connect().catch(e => {
      g.__dkMongo = undefined;
      throw e;
    });
  }
  return g.__dkMongo;
}

export async function booksBucket(): Promise<GridFSBucket> {
  const c = await client();
  return new GridFSBucket(c.db(), { bucketName: "books" });
}

// Tinglash bo'limi uchun ovoz fayllari (mp3/m4a/… — 16MB hujjat chegarasidan katta bo'lishi mumkin)
export async function audioBucket(): Promise<GridFSBucket> {
  const c = await client();
  return new GridFSBucket(c.db(), { bucketName: "audio" });
}

export { ObjectId };
