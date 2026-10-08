// app/api/comprobantes/route.ts
//
// BFF (regla de arquitectura, igual que fuelhub-web): el navegador solo
// habla con /api/* de este mismo proyecto. Este handler valida el captcha y
// llama a GET /v1/comprobantes/consulta de FuelHub Cloud con el token M2M
// propio (comprobantes.read).
//
// Contrato de FuelHub:
//   rucEmisor, numeroDocumentoReceptor, anio -> requeridos
//   mes                                      -> requerido por nosotros (ZIP del mes)
//   dia + serie + correlativo                -> opcionales, los 3 juntos (un PDF)

import { NextRequest, NextResponse } from "next/server";
import { verificarCaptcha } from "@/lib/captcha";
import { FuelHubApiError, fuelhubFetch } from "@/lib/fuelhub/client";
import type { ComprobanteConsulta } from "@/lib/fuelhub/types";

function badRequest(message: string, error = "PARAMETROS_INVALIDOS") {
  return NextResponse.json({ error, message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const get = (k: string) => searchParams.get(k)?.trim() ?? "";

  const rucEmisor = get("rucEmisor");
  const numeroDocumentoReceptor = get("numeroDocumentoReceptor");
  const anio = get("anio");
  const mes = get("mes");
  const dia = get("dia");
  const serie = get("serie").toUpperCase();
  const correlativo = get("correlativo");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const captchaOk = await verificarCaptcha(request.headers.get("x-captcha-token"), ip);
  if (!captchaOk) {
    return badRequest("No pudimos verificar el captcha. Inténtalo de nuevo.", "CAPTCHA_INVALIDO");
  }

  if (!/^\d{11}$/.test(rucEmisor)) return badRequest("El RUC debe tener 11 dígitos.");
  if (!numeroDocumentoReceptor) return badRequest("El documento del receptor es requerido.");
  if (!/^\d{4}$/.test(anio)) return badRequest("El año no es válido.");
  // El mes es obligatorio a proposito: evita ZIP del año completo (costo y timeouts).
  if (!/^(0?[1-9]|1[0-2])$/.test(mes)) return badRequest("Elige un mes válido.");

  const datosPuntuales = [dia, serie, correlativo].filter(Boolean).length;
  if (datosPuntuales !== 0 && datosPuntuales !== 3) {
    return badRequest("Para buscar un comprobante puntual completa día, serie y correlativo.");
  }

  try {
    const data = await fuelhubFetch<ComprobanteConsulta>("/v1/comprobantes/consulta", {
      query: {
        rucEmisor,
        numeroDocumentoReceptor,
        anio,
        mes: mes.padStart(2, "0"),
        dia: dia ? dia.padStart(2, "0") : undefined,
        serie: serie || undefined,
        correlativo: correlativo || undefined,
      },
    });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof FuelHubApiError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    console.error("Error consultando comprobantes:", err);
    return NextResponse.json({ error: "ERROR_INTERNO", message: "Ocurrió un error inesperado." }, { status: 500 });
  }
}
