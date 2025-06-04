import React from 'react';

function DonacionDineroForm({ data, setData, nombresCuenta = [], numerosCuenta = [] }) {
  return (
    <div className="add-donation">
            <h2 style={{ textAlign: 'center' }}>Donación en Dinero</h2>
    <div className="donation-form">


      {/* 1. Monto */}
      <div className="form-section">
        <div className="mb-3">
          <label><strong>Monto</strong></label>
          <input
            type="number"
            min="1"
            className="form-control"
            placeholder="Ingrese el monto"
            value={data.monto}
            onChange={e => {
              const valor = e.target.value;
              if (parseFloat(valor) >= 0 || valor === '') {
                setData({ ...data, monto: valor });
              }
            }}
          />
        </div>
      </div>

      {/* 2. Información de cuenta */}
      <div className="form-section">
        <div className="mb-3">
          <label><strong>Nombre de la cuenta</strong></label>
          <input
            className="form-control"
            placeholder="Nombre de cuenta"
            list="nombresCuenta"
            value={data.nombre_cuenta}
            onChange={e => setData({ ...data, nombre_cuenta: e.target.value })}
          />
          <datalist id="nombresCuenta">
            {nombresCuenta.map((c, index) => (
              <option key={index} value={c.nombre_cuenta} />
            ))}
          </datalist>
        </div>

        <div className="mb-3">
          <label><strong>Número de cuenta</strong></label>
          <input
            className="form-control"
            placeholder="Número de cuenta"
            list="numerosCuenta"
            value={data.numero_cuenta}
            onChange={e => setData({ ...data, numero_cuenta: e.target.value })}
          />
          <datalist id="numerosCuenta">
            {numerosCuenta.map((n, index) => (
              <option key={index} value={n.numero_cuenta} />
            ))}
          </datalist>
        </div>
      </div>

      {/* 3. Comprobante */}
      <div className="form-section">
        <div className="mb-3">
          <label><strong>URL del comprobante</strong></label>
          <input
            className="form-control"
            placeholder="Comprobante URL"
            value={data.comprobante_url}
            onChange={e => setData({ ...data, comprobante_url: e.target.value })}
          />
        </div>
      </div>
    </div>
    </div>
  );
}

export default DonacionDineroForm;
