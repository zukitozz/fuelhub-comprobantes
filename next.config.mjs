/** @type {import('next').NextConfig} */

// Cabeceras de seguridad estandar. No se define Content-Security-Policy a
// proposito: Turnstile carga un script e iframes de challenges.cloudflare.com y
// una CSP mal ajustada rompe el captcha; agregarla con pruebas en un paso aparte.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
