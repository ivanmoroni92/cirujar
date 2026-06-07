import mongoose from 'mongoose';

/**
 * Connects to MongoDB with an explicit URI (ignores _config.js toggle).
 */
export async function connectMongoUri(uri: string): Promise<void> {
  await mongoose.connect(uri);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
