# FuelHub · Comprobantes

Página pública (sin login) para que un cliente busque y descargue su comprobante electrónico
(PDF, y XML/CDR cuando existan) por **RUC + serie + correlativo**, contra **FuelHub Cloud**
(repo `fuelhub-core`, endpoint nuevo `GET /v1/comprobantes/{numeracion}?ruc=...`, v1.72).

Mismo patrón BFF que `fuelhub-web`: el navegador solo habla con `/api/*` de este mismo
proyecto Next.js -- nunca llama a `api.fuelhub.cloud` directo, así que ninguna credencial
sale del servidor.

## Qué hay construido

- **Buscador** (`components/BuscadorForm.tsx`): RUC + serie + correlativo, sin cuenta ni login.
- **BFF** (`app/api/comprobantes/route.ts`): arma `numeracion` (`serie-correlativo`) y llama a
  FuelHub Cloud con el token M2M del servidor.
- **Sesión M2M propia** (`lib/fuelhub/m2mToken.ts`): App Client **nuevo y acotado**, scope
  `fuelhub-api/comprobantes.read` únicamente -- a propósito NO reusa el cliente "back-office"
  de `fuelhub-web` (ese tiene `cierres.read/write`, de más para un frontend público sin login).
- Resultado: tipo de comprobante, fecha/importe/estado si el PDF se subió con esa metadata
  (opcional, v1.72), botón de descarga del PDF, y de XML/CDR **solo si ya existen** en el
  bucket (pendiente que `fuelhub-facturador` los suba -- ver `specs-cierres-grifo-backend.md`
  sección 3.8.9/3.8.11 en el repo `fuelhub-core`).

## Qué falta para que esto corra contra AWS de verdad

1. **Registrar el scope `comprobantes.read` en el Resource Server de Cognito** (todavía no
   existe -- hoy el Resource Server `fuelhub-api` solo tiene `cierres.read`/`cierres.write`).
   Esto es consola/CLI de AWS, fuera del alcance de esta sesión sin credenciales -- avísame
   cuando quieras el comando exacto (`aws cognito-idp update-resource-server`) para correrlo tú.

2. **Crear el App Client M2M** para este proyecto, con scope `fuelhub-api/comprobantes.read`
   únicamente (sin `custom:station_scope`, este endpoint no es por estación) -- llena
   `FUELHUB_COMPROBANTES_CLIENT_ID`/`_SECRET` en `.env.local`. Mismo criterio que el App Client
   de `notificaciones-whatsapp`: tú lo corres, yo no tengo credenciales de AWS acá.

3. **Confirmar `cdk deploy` de los cambios de `fuelhub-core`** (el endpoint nuevo
   `GET /comprobantes/{numeracion}` todavía no está desplegado a `dev`/`prod`) -- esta sesión
   no pudo correr `cdk synth`/`cdk diff` reales (sin `infra/node_modules` instalado y sin red
   al registry desde este dispositivo en este momento).

4. **Vercel**: importar este repo como proyecto nuevo, completar las env vars de arriba
   (`FUELHUB_TOKEN_URL`, `FUELHUB_COMPROBANTES_CLIENT_ID/SECRET`, `FUELHUB_API_BASE_URL`), y
   asignar el dominio que definas.

## Cómo correrlo localmente

```bash
npm install
cp .env.example .env.local   # y completa los valores reales (nunca los pongas en .env.example)
npm run dev
```

Abre `http://localhost:3000`.
