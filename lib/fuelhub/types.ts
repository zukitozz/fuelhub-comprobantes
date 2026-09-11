// lib/fuelhub/types.ts

export interface ApiErrorBody {
  readonly error?: string;
  readonly message?: string;
  readonly details?: unknown;
}

export type TipoComprobante = "FACTURA" | "BOLETA" | "DESCONOCIDO";

export interface ComprobanteConsulta {
  readonly ruc: string;
  readonly numeracion: string;
  readonly serie: string;
  readonly correlativo: string;
  readonly tipoComprobante: TipoComprobante;
  readonly urlPdf: string;
  readonly urlXml?: string;
  readonly urlCdr?: string;
  readonly expiraEnSegundos: number;
  readonly fechaEmision?: string;
  readonly importeTotal?: number;
  readonly moneda?: string;
  readonly estadoSunat?: string;
}
