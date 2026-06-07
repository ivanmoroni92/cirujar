import {
  clearLocalUploadsDir,
  fileNameFromUrl,
  isRemoteImageUrl,
  saveBufferToLocalUploads,
} from '../utils/localImageStorage';

const DOWNLOAD_CONCURRENCY = 5;

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  skip (${response.status}): ${url}`);
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  skip (${message}): ${url}`);
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Downloads remote image URLs and rewrites user/product records with local URLs.
 * Only intended for cloud → local sync when USE_LOCAL_DB is true.
 */
export async function mirrorSeedImages(
  users: Record<string, unknown>[],
  products: Record<string, unknown>[]
): Promise<{
  users: Record<string, unknown>[];
  products: Record<string, unknown>[];
  downloaded: number;
  failed: number;
}> {
  const uniqueRemoteUrls = new Set<string>();

  for (const user of users) {
    const imagenPerfil = user.imagenPerfil;
    if (typeof imagenPerfil === 'string' && isRemoteImageUrl(imagenPerfil)) {
      uniqueRemoteUrls.add(imagenPerfil.trim());
    }
  }

  for (const product of products) {
    const fotos = product.fotos;
    if (Array.isArray(fotos)) {
      for (const foto of fotos) {
        if (typeof foto === 'string' && isRemoteImageUrl(foto)) {
          uniqueRemoteUrls.add(foto.trim());
        }
      }
    }
  }

  const remoteUrls = [...uniqueRemoteUrls];
  if (remoteUrls.length === 0) {
    return { users, products, downloaded: 0, failed: 0 };
  }

  console.log(`Mirroring ${remoteUrls.length} remote image(s) to local uploads…`);
  clearLocalUploadsDir();

  const urlMap = new Map<string, string>();

  const outcomes = await mapWithConcurrency(remoteUrls, DOWNLOAD_CONCURRENCY, async (remoteUrl) => {
    const buffer = await downloadImage(remoteUrl);
    if (!buffer) {
      return { ok: false as const, remoteUrl };
    }

    const localUrl = saveBufferToLocalUploads(buffer, fileNameFromUrl(remoteUrl));
    console.log(`  ✓ ${fileNameFromUrl(remoteUrl)}`);
    return { ok: true as const, remoteUrl, localUrl };
  });

  for (const outcome of outcomes) {
    if (outcome.ok) {
      urlMap.set(outcome.remoteUrl, outcome.localUrl);
    }
  }

  const downloaded = outcomes.filter((outcome) => outcome.ok).length;
  const failed = outcomes.length - downloaded;

  const remapUrl = (url: unknown): unknown => {
    if (typeof url !== 'string') {
      return url;
    }
    const trimmed = url.trim();
    return urlMap.get(trimmed) ?? trimmed;
  };

  const mirroredUsers = users.map((user) => ({
    ...user,
    imagenPerfil: remapUrl(user.imagenPerfil),
  }));

  const mirroredProducts = products.map((product) => ({
    ...product,
    fotos: Array.isArray(product.fotos)
      ? product.fotos.map((foto) => remapUrl(foto))
      : product.fotos,
  }));

  return {
    users: mirroredUsers,
    products: mirroredProducts,
    downloaded,
    failed,
  };
}
