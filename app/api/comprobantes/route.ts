// app/api/comprobantes/route.ts
//
// BFF (regla de arquitectura, igual que fuelhub-web): el navegador solo
// habla con /api/* de este mismo proyecto. Este handler arma `numeracion`
// (serie-correlativo) y llama a GET /v1/comprobantes/{numeracion}?ruc=...
// de FuelHub Cloud con el token M2M propio (comprobantes.read).

import { NextRequest, NextResponse } from "next/server";
import { FuelHubApiError, fuelhubFetch } from "@/lib/fuelhub/client";
import type { ComprobanteConsulta } from "@/lib/fuelhub/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ruc = searchParams.get("ruc")?.trim() ?? "";
  const serie = searchParams.get("serie")?.trim() ?? "";
  const correlativo = searchParams.get("correlativo")?.trim() ?? "";

  if (!ruc || !serie || !correlativo) {
    return NextResponse.json(
      { error: "PARAMETROS_INVALIDOS", message: "RUC, serie y correlativo son requeridos." },
      { status: 400 }
    );
  }

  const numeracion = `${serie}-${correlativo}`;

  try {
    const data = await fuelhubFetch<ComprobanteConsulta>(`/v1/comprobantes/${encodeURIComponent(numeracion)}`, {
      query: { ruc },
    });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof FuelHubApiError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    console.error("Error consultando comprobante:", err);
    return NextResponse.json({ error: "ERROR_INTERNO", message: "Ocurrió un error inesperado." }, { status: 500 });
  }
}
