// lib/fuelhub/m2mToken.ts
//
// Sesion M2M de fuelhub-comprobantes hacia FuelHub Cloud -- mismo patron
// que lib/fuelhub/m2mToken.ts de fuelhub-web (client_credentials, cacheado
// en memoria del proceso, renovado proactivamente antes de expirar), pero
// con su PROPIO App Client, acotado al scope fuelhub-api/comprobantes.read
// -- a proposito NO reusa el cliente "back-office" de fuelhub-web (ese
// tiene cierres.read/write, mucho mas de lo que este proyecto necesita:
// este frontend es publico, sin login, asi que el principio de minimo
// privilegio importa mas aca que en un frontend de gestion interno).
//
// El client_id/secret vive SOLO en el servidor (variables de entorno),
// nunca llega al navegador.

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cached: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

const RENEW_BUFFER_MS = 5 * 60 * 1000; // renovar 5 min antes de que expire

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name} (sesion M2M hacia FuelHub Cloud) -- ver .env.example`
    );
  }
  return value;
}

async function fetchNewToken(): Promise<CachedToken> {
  const tokenUrl = requiredEnv("FUELHUB_TOKEN_URL");
  const clientId = requiredEnv("FUELHUB_COMPROBANTES_CLIENT_ID");
  const clientSecret = requiredEnv("FUELHUB_COMPROBANTES_CLIENT_SECRET");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`No se pudo obtener el token M2M de FuelHub Cloud (HTTP ${res.status}): ${text}`);
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: body.access_token,
    expiresAtMs: Date.now() + body.expires_in * 1000,
  };
}

/** Devuelve un access token M2M valido, renovandolo si esta por vencer. */
export async function getM2mToken(): Promise<string> {
  const now = Date.now();

  if (cached && cached.expiresAtMs - now > RENEW_BUFFER_MS) {
    return cached.accessToken;
  }

  if (!inFlight) {
    inFlight = fetchNewToken()
      .then((token) => {
        cached = token;
        return token.accessToken;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

/** Fuerza la renovacion en el proximo getM2mToken() -- util si FuelHub Cloud devolvio 401. */
export function invalidateM2mToken(): void {
  cached = null;
}
