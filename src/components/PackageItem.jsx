import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/HelpRequestItem.css';

const PackageItem = ({ paquete, donacionesEspecie, catalogoArticulos, onCompletarPaquete }) => {
  const [expandido, setExpandido] = useState(false);

  const obtenerNombreArticulo = (idDonacionEspecie) => {
    const donacion = donacionesEspecie.find(d => d.id_donacion_especie === idDonacionEspecie);
    if (!donacion) return 'Artículo desconocido';

    const articulo = catalogoArticulos.find(a => a.id_articulo === donacion.id_articulo);
    return articulo ? articulo.nombre_articulo : 'Artículo no encontrado';
  };

  const generarPDF = () => {
    const doc = new jsPDF();
  
    doc.setFontSize(18);
    doc.text(paquete.nombre_paquete, 14, 20);
  
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date(paquete.fecha_creacion).toLocaleDateString()}`, 14, 30);
  
    const tableColumn = ["Artículo", "Cantidad"];
    const tableRows = [];
  
    paquete.donaciones.forEach(don => {
      tableRows.push([
        obtenerNombreArticulo(don.id_donacion_especie),
        don.cantidad_asignada
      ]);
    });
  
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });
  
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 40;
  
    doc.text('Origen: _______________________________', 14, finalY + 20);
    doc.text('Destino: _______________________________', 14, finalY + 30);

    const nombres = localStorage.getItem('nombres') || '__________________';
    const ci = localStorage.getItem('ci') || '__________________';
  
    doc.text(`Firma: _______________________________`, 14, finalY + 40);
    doc.text(`Nombre: ${nombres}`, 14, finalY + 50);
    doc.text(`CI: ${ci}`, 14, finalY + 60);
  
    doc.save(`paquete_${paquete.id_paquete}.pdf`);

    // ✅ Llamar al callback para eliminar el paquete de la lista
    onCompletarPaquete?.(paquete.id_paquete);
  };
  
  return (
    <div className="pedido-card">
      <div className="pedido-header" onClick={() => setExpandido(!expandido)}>
        <strong>{paquete.nombre_paquete}</strong> — {new Date(paquete.fecha_creacion).toLocaleDateString()}
      </div>

      {expandido && (
        <div className="pedido-detalle">
          <p><strong>Descripción:</strong> {paquete.descripcion}</p>

          <p><strong>Donaciones:</strong></p>
          <ul>
            {paquete.donaciones.map((don, idx) => (
              <li key={idx}>
                Artículo: {obtenerNombreArticulo(don.id_donacion_especie)} — Cantidad: {don.cantidad_asignada}
              </li>
            ))}
          </ul>

          <button
            className="btn btn-outline-success mt-3"
            onClick={generarPDF}
          >
            Completar Paquete
          </button>
        </div>
      )}
    </div>
  );
};

export default PackageItem;
