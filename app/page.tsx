import BuscadorForm from "@/components/BuscadorForm";

export default function Page() {
  return (
    <main>
      <div className="card">
        <h1>Busca tus comprobantes</h1>
        <p className="lead">
          Ingresa el RUC del negocio, tu documento (DNI o RUC) y el mes para descargar todos tus
          comprobantes en un ZIP, o indica día, serie y correlativo para descargar uno solo.
        </p>
        <BuscadorForm />
      </div>
    </main>
  );
}
