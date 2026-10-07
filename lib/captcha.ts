// lib/captcha.ts
//
// Verificacion server-side de Cloudflare Turnstile. El token lo genera el
// widget en el navegador; aqui se valida contra Cloudflare ANTES de llamar a
// FuelHub Cloud, asi un bot sin captcha valido nunca llega al backend.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verificarCaptcha(token: string | null | undefined, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error("Falta la variable de entorno TURNSTILE_SECRET_KEY -- ver .env.example");
  }
  if (!token) return false;

  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: form, cache: "no-store" });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
