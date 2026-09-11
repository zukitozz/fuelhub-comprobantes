import BuscadorForm from "@/components/BuscadorForm";

export default function Page() {
  return (
    <main>
      <div className="card">
        <h1>Busca tu comprobante</h1>
        <p className="lead">
          Ingresa el RUC del negocio, la serie y el número (correlativo) de tu boleta o factura
          para ver y descargar el comprobante.
        </p>
        <BuscadorForm />
      </div>
    </main>
  );
}
