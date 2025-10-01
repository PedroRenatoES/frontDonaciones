import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from '../axios';
import '../styles/Campains.css';

// Portal component for rendering modals outside the card
function Portal({ children }) {
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(children, document.body);
}

function CampanaDetailsModal({ show, onClose, campana, formatearFecha }) {
  const [donacionesDinero, setDonacionesDinero] = useState([]);
  const [donacionesEspecie, setDonacionesEspecie] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !campana) return;
    
    setLoading(true);
    
    // Cargar donaciones en dinero
    axios
      .get(
        `https://donacionesbackendpsiii.onrender.com/api/donaciones-en-dinero/por-campana/${campana.id_campana}`
      )
      .then((res) => setDonacionesDinero(res.data))
      .catch((err) => console.error(err));

    // Cargar donaciones en especie
    axios
      .get(
        `https://donacionesbackendpsiii.onrender.com/api/donaciones-en-especie/por-campana/${campana.id_campana}`
      )
      .then((res) => setDonacionesEspecie(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [show, campana]);

  // Lock background scroll when modal is open
  useEffect(() => {
    const body = document.body;
    if (show) {
      body.classList.add("no-scroll");
    } else {
      body.classList.remove("no-scroll");
    }
    return () => body.classList.remove("no-scroll");
  }, [show]);

  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal-backdrop') {
      onClose();
    }
  };

  if (!show || !campana) return null;

  const defaultImage = "banner.jpg";

  return (
    <Portal>
      <div className="modal-backdrop" onClick={handleBackdropClick} style={{ background: "rgba(0, 0, 0, 0)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: "1000", animation: "modalFadeIn 0.3s ease-out" }}>
        <div className="modal-content campana-details-modal" style={{ maxWidth: "1400px", background: "white", borderRadius: "20px" }}>
          <div className="modal-header">
            <h2>Detalles de la Campaña</h2>
            <button
              className="modal-close-x"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="modal-body details-modal-body" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Header con imagen y título */}
            <div className="campana-header-section">
              <div className="campana-image-container" style={{ borderRadius: "20px", width: "100%", height: "100%" }}>
                <img
                  src={campana.imagen_url || defaultImage}
                  alt="Imagen de campaña"
                  className="campana-detail-img"
                />
                <div className="image-overlay">
                  <h3 className="campana-detail-title">{campana.nombre_campana}</h3>
                </div>
              </div>
            </div>

            {/* Información básica en grid */}
            <div className="campana-info-section">
              <div className="campana-info-grid">
                <div className="info-card">
                  <div className="info-icon">👤</div>
                  <div className="info-content">
                    <strong>Organizador</strong>
                    <span>{campana.organizador}</span>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon">📅</div>
                  <div className="info-content">
                    <strong>Fecha de Inicio</strong>
                    <span>{formatearFecha(campana.fecha_inicio)}</span>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon">🏁</div>
                  <div className="info-content">
                    <strong>Fecha de Fin</strong>
                    <span>{formatearFecha(campana.fecha_fin)}</span>
                  </div>
                </div>
              </div>

              <div className="campana-description">
                <div className="description-header">
                  <div className="description-icon">📝</div>
                  <strong>Descripción de la Campaña</strong>
                </div>
                <p>{campana.descripcion}</p>
              </div>
            </div>

            {/* Donaciones */}
            <div className="donaciones-section">
              {loading ? (
                <div className="loading-container">
                  <p>Cargando donaciones...</p>
                </div>
              ) : (
                <>
                  {donacionesDinero.length > 0 || donacionesEspecie.length > 0 ? (
                    <div className="donaciones-grid">
                      {donacionesDinero.length > 0 && (
                        <div className="donaciones-subsection">
                          <div className="subsection-header">
                            <div className="subsection-icon">💰</div>
                            <h3>Donaciones en Dinero</h3>
                            <div className="donation-count">{donacionesDinero.length}</div>
                          </div>
                          <div className="table-container">
                            <table className="campain-table">
                              <thead>
                                <tr>
                                  <th>Monto</th>
                                  <th>Divisa</th>
                                  <th>Cuenta</th>
                                  <th>Número</th>
                                  <th>Comprobante</th>
                                </tr>
                              </thead>
                              <tbody>
                                {donacionesDinero.map((d) => (
                                  <tr key={d.id_donacion}>
                                    <td className="amount-cell">${d.monto}</td>
                                    <td className="currency-cell">{d.divisa}</td>
                                    <td>{d.nombre_cuenta}</td>
                                    <td className="account-cell">{d.numero_cuenta}</td>
                                    <td>
                                      <a
                                        href={d.comprobante_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="comprobante-link"
                                      >
                                        📄 Ver
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {donacionesEspecie.length > 0 && (
                        <div className="donaciones-subsection">
                          <div className="subsection-header">
                            <div className="subsection-icon">📦</div>
                            <h3>Donaciones en Especie</h3>
                            <div className="donation-count">{donacionesEspecie.length}</div>
                          </div>
                          <div className="table-container">
                            <table className="campain-table">
                              <thead>
                                <tr>
                                  <th>Artículo</th>
                                  <th>Espacio</th>
                                  <th>Cantidad</th>
                                  <th>Estado</th>
                                  <th>Unidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {donacionesEspecie.map((d) => (
                                  <tr key={d.id_donacion}>
                                    <td className="item-cell">{d.nombre_articulo}</td>
                                    <td className="space-cell">{d.id_espacio}</td>
                                    <td className="quantity-cell">{d.cantidad}</td>
                                    <td className="status-cell">{d.estado_articulo}</td>
                                    <td className="unit-cell">{d.simbolo}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-donaciones">
                      <p>No hay donaciones registradas para esta campaña</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="modal-close-btn"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export default CampanaDetailsModal;
