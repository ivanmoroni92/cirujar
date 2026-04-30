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
