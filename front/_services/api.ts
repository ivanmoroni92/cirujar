import axios, { type AxiosRequestConfig } from 'axios';
import { API_URL } from '../_config';
import { getBearerAuthHeaders } from './authToken';

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

  const auth = await getBearerAuthHeaders();
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: auth,
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

export async function fetchProductById(id: string): Promise<ApiProduct> {
  const data = await get(`products/${id}`);
  if (!data) throw new Error('No se pudo cargar el producto');
  return data as ApiProduct;
}

export const updateProduct = async (id: string, data: FormData) => {
  const auth = await getBearerAuthHeaders();
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PATCH', // ✅ era PUT
    headers: auth,
    body: data,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Backend respondió:', res.status, errorBody);
    throw new Error(`Error ${res.status}: ${errorBody}`);
  }

  return res.json();
};

export async function deleteProduct(id: string): Promise<void> {
  const auth = await getBearerAuthHeaders();
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...auth,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error ${response.status}: ${body}`);
  }
}

/** Same rule as backend: local@domain.tld */
export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export const REGISTER_EMAIL_ERROR = 'Ingresá un email válido';
export const REGISTER_PASSWORD_ERROR = 'La contraseña debe tener al menos 6 caracteres';
export const REGISTER_DUPLICATE_EMAIL_ERROR = 'Este email ya tiene una cuenta';

export interface RegisterUserPayload {
  alias: string;
  email: string;
  contraseña: string;
}

export interface ApiUser {
  _id: string;
  alias: string;
  email: string;
  imagenPerfil?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * POST /api/users — creates account (password hashed on server).
 */
export async function registerUser(payload: RegisterUserPayload): Promise<ApiUser> {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alias: payload.alias.trim(),
      email: payload.email.trim(),
      contraseña: payload.contraseña,
    }),
  });

  if (res.status === 409) {
    throw new Error(REGISTER_DUPLICATE_EMAIL_ERROR);
  }

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

  return res.json() as Promise<ApiUser>;
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
}

/**
 * POST /api/auth/login — returns JWT; store with {@link setStoredToken} from `./authToken`.
 */
export async function loginUser(email: string, contraseña: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), contraseña }),
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

  return res.json() as Promise<LoginResponse>;
}