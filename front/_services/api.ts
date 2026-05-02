import axios, { type AxiosRequestConfig } from 'axios';
import { API_URL } from '../_config';

/** Product shape returned by GET /api/products */
export interface ApiProduct {
  _id: string;
  titulo: string;
  detalles: string;
  ubicacion?: {
    type: 'Point';
    coordinates: [number, number];
  };
  ubicacionTexto?: string;
  fotos: string[];
  createdAt?: string;
  updatedAt?: string;
}


export async function fetchProducts(): Promise<ApiProduct[]> {
  const data = await get('products');
  return Array.isArray(data) ? data : [];
}

export interface CreateProductPayload {
  titulo: string;
  detalles: string;
  ubicacionTexto: string;
  /** Local URIs from expo-image-picker (file:// or content://) */
  imageUris: string[];
}

/**
 * POST multipart /products — field `ubicacion` as plain text maps to ubicacionTexto on server.
 */
export async function createProduct(payload: CreateProductPayload): Promise<ApiProduct> {
  const form = new FormData();
  form.append('titulo', payload.titulo.trim());
  if (payload.detalles.trim()) {
    form.append('detalles', payload.detalles.trim());
  }
  form.append('ubicacion', payload.ubicacionTexto.trim());

  for (const uri of payload.imageUris) {
    const nameFromUri = uri.split('/').pop() ?? 'photo.jpg';
    const ext = nameFromUri.includes('.') ? nameFromUri.split('.').pop()?.toLowerCase() : 'jpg';
    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    form.append('fotos', { uri, name: nameFromUri, type: mime } as unknown as Blob);
  }

  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json() as Promise<ApiProduct>;
}

export const get = async (resource: string, params?: AxiosRequestConfig['params']) => {
    const url = `${API_URL}/${resource}`;
  
    return axios
      .get(url, { params })
      .then((response) => response.data)
      .catch((error) => {
        console.error(error);
    });
};

export const post = async (resource: string, data: unknown) => {
  const url = `${API_URL}/${resource}`;
  return axios
    .post(url, data)
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });
};

export const put = async (resource: string, id: string, data: unknown) => {
  const url = `${API_URL}/${resource}/${id}`;
  return axios
    .put(url, data)
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });
};
