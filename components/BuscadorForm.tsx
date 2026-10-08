"use client";

import { useState, type FormEvent } from "react";
import type { ComprobanteConsulta } from "@/lib/fuelhub/types";
import Turnstile from "./Turnstile";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "buscando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "encontrado"; comprobante: ComprobanteConsulta };

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MONEDA_SIMBOLO: Record<string, string> = { PEN: "S/", USD: "US$" };

export default function BuscadorForm() {
  const [rucEmisor, setRucEmisor] = useState("");
  const [receptor, setReceptor] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [mes, setMes] = useState("");
  const [dia, setDia] = useState("");
  const [serie, setSerie] = useState("");
  const [correlativo, setCorrelativo] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const rucLimpio = rucEmisor.trim();
    const receptorLimpio = receptor.trim();
    const serieLimpia = serie.trim().toUpperCase();
    const correlativoLimpio = correlativo.trim();
    const diaLimpio = dia.trim();

    if (!/^\d{11}$/.test(rucLimpio)) {
      setEstado({ tipo: "error", mensaje: "El RUC debe tener 11 dígitos." });
      return;
    }
    if (!receptorLimpio) {
      setEstado({ tipo: "error", mensaje: "Ingresa tu DNI o RUC (documento del receptor)." });
      return;
    }
    if (!/^\d{4}$/.test(anio.trim())) {
      setEstado({ tipo: "error", mensaje: "Ingresa un año válido (ej. 2026)." });
      return;
    }
    const puntuales = [diaLimpio, serieLimpia, correlativoLimpio].filter(Boolean).length;
    if (puntuales !== 0 && puntuales !== 3) {
      setEstado({ tipo: "error", mensaje: "Para un comprobante puntual completa día, serie y correlativo." });
      return;
    }
    if (!mes) {
      setEstado({ tipo: "error", mensaje: "Elige el mes." });
      return;
    }
    if (!captchaToken) {
      setEstado({ tipo: "error", mensaje: "Completa la verificación de seguridad (captcha)." });
      return;
    }

    setEstado({ tipo: "buscando" });
    try {
      const params = new URLSearchParams({
        rucEmisor: rucLimpio,
        numeroDocumentoReceptor: receptorLimpio,
        anio: anio.trim(),
      });
      params.set("mes", mes);
      if (puntuales === 3) {
        params.set("dia", diaLimpio);
        params.set("serie", serieLimpia);
        params.set("correlativo", correlativoLimpio);
      }
      const res = await fetch(`/api/comprobantes?${params.toString()}`, {
        headers: { "x-captcha-token": captchaToken },
      });
      const body = await res.json();

      if (!res.ok) {
        const mensaje =
          res.status === 404
            ? "No encontramos comprobantes con esos datos. Revisa el RUC, tu documento y el periodo."
            : body?.message || "Ocurrió un error al buscar los comprobantes.";
        setEstado({ tipo: "error", mensaje });
        return;
      }

      setEstado({ tipo: "encontrado", comprobante: body as ComprobanteConsulta });
    } catch {
      setEstado({ tipo: "error", mensaje: "No se pudo conectar. Intenta de nuevo en unos segundos." });
    } finally {
      // el token de Turnstile es de un solo uso
      setCaptchaReset((n) => n + 1);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="ruc">RUC del negocio (emisor)</label>
          <input
            id="ruc"
            inputMode="numeric"
            maxLength={11}
            placeholder="20123456789"
            value={rucEmisor}
            onChange={(e) => setRucEmisor(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="receptor">Tu DNI o RUC (receptor)</label>
          <input
            id="receptor"
            inputMode="numeric"
            maxLength={11}
            placeholder="Documento con el que compraste"
            value={receptor}
            onChange={(e) => setReceptor(e.target.value)}
          />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="anio">Año</label>
            <input id="anio" inputMode="numeric" maxLength={4} value={anio} onChange={(e) => setAnio(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mes">Mes</label>
            <select id="mes" value={mes} onChange={(e) => setMes(e.target.value)}>
              <option value="">Elige un mes</option>
              {MESES.map((nombre, i) => (
                <option key={nombre} value={String(i + 1).padStart(2, "0")}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="hint">Sin más datos descargas un ZIP con todos tus comprobantes del mes.</p>

        <p className="hint" style={{ marginTop: 16 }}>
          ¿Buscas un comprobante puntual? Completa día, serie y correlativo:
        </p>
        <div className="row3">
          <div className="field">
            <label htmlFor="dia">Día</label>
            <input
              id="dia"
              inputMode="numeric"
              maxLength={2}
              placeholder="06"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            />
          </div>
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

        <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />

        <button className="primary" type="submit" disabled={estado.tipo === "buscando"}>
          {estado.tipo === "buscando" ? "Buscando…" : "Buscar comprobantes"}
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
  const ETIQUETAS: Record<string, string> = { FACTURA: "Factura", BOLETA: "Boleta" };
  const etiquetaTipo = comprobante.urlZip
    ? "Comprobantes del periodo"
    : (ETIQUETAS[comprobante.tipoComprobante ?? ""] ?? "Comprobante");

  return (
    <div className="resultado">
      <span className="tipo">{etiquetaTipo}</span>
      {comprobante.numeracion && <p className="numeracion">{comprobante.numeracion}</p>}

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
        {comprobante.urlZip && (
          <a className="principal" href={comprobante.urlZip} target="_blank" rel="noreferrer">
            Descargar ZIP
          </a>
        )}
        {comprobante.urlPdf && (
          <a className="principal" href={comprobante.urlPdf} target="_blank" rel="noreferrer">
            Descargar PDF
          </a>
        )}
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
