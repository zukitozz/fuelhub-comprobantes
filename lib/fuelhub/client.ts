// lib/fuelhub/client.ts
//
// Cliente HTTP hacia FuelHub Cloud, usado SOLO desde el servidor de este
// proyecto (rutas de API) -- el navegador nunca llama esto directo, misma
// regla de arquitectura BFF que fuelhub-web. Agrega el Bearer M2M, maneja
// el cold-start de Aurora (503 + Retry-After) -- aunque consulta-comprobante
// no toca Aurora, se deja el mismo manejo por si el backend cambia, y
// normaliza los errores al shape uniforme de la API.

import { getM2mToken, invalidateM2mToken } from "./m2mToken";
import type { ApiErrorBody } from "./types";

export class FuelHubApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `FuelHub Cloud respondió HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

const MAX_RETRY_AFTER_SECONDS = 10;

function baseUrl(): string {
  const url = process.env.FUELHUB_API_BASE_URL;
  if (!url) {
    throw new Error("Falta la variable de entorno FUELHUB_API_BASE_URL -- ver .env.example");
  }
  return url.replace(/\/$/, "");
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody> {
  try {
    const json = (await res.json()) as ApiErrorBody;
    if (json && typeof json.error === "string") return json;
  } catch {
    // respuesta sin body JSON parseable
  }
  return { error: "ERROR_DESCONOCIDO", message: `HTTP ${res.status}` };
}

interface FuelHubFetchOptions {
  method?: "GET" | "POST" | "PUT";
  query?: Record<string, string | number | boolean | undefined>;
}

function buildQueryString(query?: FuelHubFetchOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Llama a un endpoint de FuelHub Cloud con el token M2M vigente. Reintenta UNA vez ante 503/401. */
export async function fuelhubFetch<T>(path: string, options: FuelHubFetchOptions = {}): Promise<T> {
  const doFetch = async (): Promise<Response> => {
    const token = await getM2mToken();
    return fetch(`${baseUrl()}${path}${buildQueryString(options.query)}`, {
      method: options.method ?? "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  };

  let res = await doFetch();

  if (res.status === 503) {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfterSeconds = Math.min(retryAfterHeader ? Number(retryAfterHeader) || 1 : 1, MAX_RETRY_AFTER_SECONDS);
    await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
    res = await doFetch();
  }

  if (res.status === 401) {
    invalidateM2mToken();
    res = await doFetch();
  }

  if (!res.ok) {
    throw new FuelHubApiError(res.status, await parseErrorBody(res));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
