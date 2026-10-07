// lib/fuelhub/types.ts

export interface ApiErrorBody {
  readonly error?: string;
  readonly message?: string;
  readonly details?: unknown;
}

export type TipoComprobante = "FACTURA" | "BOLETA" | "DESCONOCIDO";

// Respuesta de GET /v1/comprobantes/consulta. Con dia+serie+correlativo trae un
// solo PDF (urlPdf, mismo shape que el endpoint individual); sin ellos trae un
// ZIP del anio o del mes (urlZip). ASUNCION: los nombres exactos del caso ZIP
// (urlZip) no vienen en el contrato -- confirmar contra fuelhub-core.
export interface ComprobanteConsulta {
  readonly ruc?: string;
  readonly numeracion?: string;
  readonly serie?: string;
  readonly correlativo?: string;
  readonly tipoComprobante?: TipoComprobante;
  readonly urlPdf?: string;
  readonly urlZip?: string;
  readonly urlXml?: string;
  readonly urlCdr?: string;
  readonly expiraEnSegundos?: number;
  readonly fechaEmision?: string;
  readonly importeTotal?: number;
  readonly moneda?: string;
  readonly estadoSunat?: string;
}
