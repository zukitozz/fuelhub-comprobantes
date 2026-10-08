// lib/fuelhub/types.ts

export interface ApiErrorBody {
  readonly error?: string;
  readonly message?: string;
  readonly details?: unknown;
}

export type TipoComprobante = "FACTURA" | "BOLETA" | "DESCONOCIDO";

// Respuesta de GET /v1/comprobantes/consulta.
//  - modo "masivo": `url` es un ZIP firmado (anio/mes), `cantidad` = comprobantes incluidos.
//  - lookup puntual (dia+serie+correlativo): mismo shape que el endpoint individual
//    (`urlPdf`, ...). ASUNCION: tambien puede venir como `url` -- no confirmado.
export interface ComprobanteConsulta {
  readonly modo?: string;
  readonly url?: string;
  readonly cantidad?: number;
  readonly ruc?: string;
  readonly numeracion?: string;
  readonly serie?: string;
  readonly correlativo?: string;
  readonly tipoComprobante?: TipoComprobante;
  readonly urlPdf?: string;
  readonly urlXml?: string;
  readonly urlCdr?: string;
  readonly expiraEnSegundos?: number;
  readonly fechaEmision?: string;
  readonly importeTotal?: number;
  readonly moneda?: string;
  readonly estadoSunat?: string;
}
