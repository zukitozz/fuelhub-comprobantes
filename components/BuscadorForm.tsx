"use client";

import { useState, type FormEvent } from "react";
import type { ComprobanteConsulta } from "@/lib/fuelhub/types";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "buscando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "encontrado"; comprobante: ComprobanteConsulta };

const MONEDA_SIMBOLO: Record<string, string> = { PEN: "S/", USD: "US$" };

export default function BuscadorForm() {
  const [ruc, setRuc] = useState("");
  const [serie, setSerie] = useState("");
  const [correlativo, setCorrelativo] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const rucLimpio = ruc.trim();
    const serieLimpia = serie.trim().toUpperCase();
    const correlativoLimpio = correlativo.trim();

    if (!/^\d{11}$/.test(rucLimpio)) {
      setEstado({ tipo: "error", mensaje: "El RUC debe tener 11 dígitos." });
      return;
    }
    if (!serieLimpia || !correlativoLimpio) {
      setEstado({ tipo: "error", mensaje: "Completa la serie y el correlativo." });
      return;
    }

    setEstado({ tipo: "buscando" });
    try {
      const params = new URLSearchParams({ ruc: rucLimpio, serie: serieLimpia, correlativo: correlativoLimpio });
      const res = await fetch(`/api/comprobantes?${params.toString()}`);
      const body = await res.json();

      if (!res.ok) {
        const mensaje =
          res.status === 404
            ? "No encontramos un comprobante con esos datos. Revisa el RUC, la serie y el correlativo."
            : body?.message || "Ocurrió un error al buscar el comprobante.";
        setEstado({ tipo: "error", mensaje });
        return;
      }

      setEstado({ tipo: "encontrado", comprobante: body as ComprobanteConsulta });
    } catch {
      setEstado({ tipo: "error", mensaje: "No se pudo conectar. Intenta de nuevo en unos segundos." });
    }
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="ruc">RUC del negocio</label>
          <input
            id="ruc"
            inputMode="numeric"
            maxLength={11}
            placeholder="20123456789"
            value={ruc}
            onChange={(e) => setRuc(e.target.value)}
          />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="serie">Serie</label>
            <input id="serie" placeholder="F001" value={serie} onChange={(e) => setSerie(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="correlativo">Correlativo</label>
            <input
              id="correlativo"
              inputMode="numeric"
              placeholder="000123"
              value={correlativo}
              onChange={(e) => setCorrelativo(e.target.value)}
            />
          </div>
        </div>
        <p className="hint">La serie y el correlativo están impresos en tu boleta o factura (ej. F001-000123).</p>
        <button className="primary" type="submit" disabled={estado.tipo === "buscando"}>
          {estado.tipo === "buscando" ? "Buscando…" : "Buscar comprobante"}
        </button>
      </form>

      {estado.tipo === "error" && (
        <div className="banner error" style={{ marginTop: 20 }}>
          {estado.mensaje}
        </div>
      )}

      {estado.tipo === "encontrado" && <Resultado comprobante={estado.comprobante} />}
    </>
  );
}

function Resultado({ comprobante }: { comprobante: ComprobanteConsulta }) {
  const etiquetaTipo =
    comprobante.tipoComprobante === "FACTURA" ? "Factura" : comprobante.tipoComprobante === "BOLETA" ? "Boleta" : "Comprobante";

  return (
    <div className="resultado">
      <span className="tipo">{etiquetaTipo}</span>
      <p className="numeracion">{comprobante.numeracion}</p>

      <div className="detalle">
        {comprobante.fechaEmision && (
          <div className="item">
            <div className="k">Fecha de emisión</div>
            <div className="v">{comprobante.fechaEmision}</div>
          </div>
        )}
        {comprobante.importeTotal !== undefined && (
          <div className="item">
            <div className="k">Importe</div>
            <div className="v">
              {MONEDA_SIMBOLO[comprobante.moneda ?? ""] ?? ""} {comprobante.importeTotal.toFixed(2)}
            </div>
          </div>
        )}
        {comprobante.estadoSunat && (
          <div className="item">
            <div className="k">Estado SUNAT</div>
            <div className="v">{comprobante.estadoSunat}</div>
          </div>
        )}
      </div>

      <div className="descargas">
        <a className="principal" href={comprobante.urlPdf} target="_blank" rel="noreferrer">
          Descargar PDF
        </a>
        {comprobante.urlXml && (
          <a href={comprobante.urlXml} target="_blank" rel="noreferrer">
            Descargar XML
          </a>
        )}
        {comprobante.urlCdr && (
          <a href={comprobante.urlCdr} target="_blank" rel="noreferrer">
            Descargar CDR (SUNAT)
          </a>
        )}
      </div>
    </div>
  );
}
