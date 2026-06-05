import fs from 'fs';
import path from 'path';
import '../loadEnv';
import { readDevConfig } from '../config/readDevConfig';
import Product from '../models/Product';
import User from '../models/User';
import { mirrorSeedImages } from './mirrorRemoteImages';
import { connectMongoUri, disconnectMongo } from './scriptUtils';

const SEED_DIR = path.resolve(__dirname, '../../seed');
const EXPORT_JSON = path.join(SEED_DIR, 'sync-export.json');

interface SyncExport {
  users: Record<string, unknown>[];
  products: Record<string, unknown>[];
  exportedAt: string;
}

async function exportCloudToJson(): Promise<SyncExport> {
  const cloudUri = process.env.MONGO_URI_CLOUD;
  if (!cloudUri) {
    throw new Error('MONGO_URI_CLOUD is not defined in back/.env');
  }

  await connectMongoUri(cloudUri);
  const users = await User.find().select('+contraseña').lean();
  const products = await Product.find().lean();
  await disconnectMongo();

  const payload: SyncExport = {
    users: users as unknown as Record<string, unknown>[],
    products: products as unknown as Record<string, unknown>[],
    exportedAt: new Date().toISOString(),
  };

  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.writeFileSync(EXPORT_JSON, JSON.stringify(payload, null, 2));
  console.log(`Exported ${users.length} users and ${products.length} products → ${EXPORT_JSON}`);
  return payload;
}

async function importJsonToLocal(data: SyncExport): Promise<void> {
  const localUri = process.env.MONGO_URI_LOCAL;
  if (!localUri) {
    throw new Error('MONGO_URI_LOCAL is not defined in back/.env');
  }

  const validUserIds = new Set(data.users.map((user) => String(user._id)));

  const products: Record<string, unknown>[] = [];
  for (const raw of data.products) {
    const usuario =
      typeof raw.usuario === 'object' && raw.usuario !== null
        ? String((raw.usuario as { _id?: string })._id)
        : String(raw.usuario ?? '');

    if (!usuario || usuario === 'undefined') {
      continue;
    }

    if (!validUserIds.has(usuario)) {
      console.warn(`Skipping product ${raw._id}: user ${usuario} not found`);
      continue;
    }

    products.push({ ...raw, usuario });
  }

  const skipped = data.products.length - products.length;
  if (skipped > 0) {
    console.warn(`Skipped ${skipped} product(s) without valid usuario.`);
  }

  let usersToImport = data.users;
  let productsToImport = products;

  if (readDevConfig().useLocalDb) {
    const mirrored = await mirrorSeedImages(usersToImport, productsToImport);
    usersToImport = mirrored.users;
    productsToImport = mirrored.products;
    console.log(
      `Local images: ${mirrored.downloaded} downloaded, ${mirrored.failed} failed.`
    );
  }

  await connectMongoUri(localUri);
  await Product.deleteMany({});
  await User.deleteMany({});

  if (usersToImport.length > 0) {
    await User.insertMany(usersToImport, { ordered: false });
  }
  if (productsToImport.length > 0) {
    await Product.insertMany(productsToImport, { ordered: false });
  }

  await disconnectMongo();
  console.log(
    `Imported ${usersToImport.length} users and ${productsToImport.length} products into local MongoDB.`
  );
}

async function sync(): Promise<void> {
  const data = await exportCloudToJson();
  await importJsonToLocal(data);
  console.log('Sync cloud → local completed.');
}

sync().catch((error) => {
  console.error('sync failed:', error);
  process.exit(1);
});
