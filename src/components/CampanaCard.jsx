import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "../axios";
import "../styles/Campains.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useMapEvents } from "react-leaflet";
import CampanaDetailsModal from "./CampanaDetailsModal";
import EditCampanaModal from "./EditCampanaModal";

// Portal component for rendering modals outside the card
function Portal({ children }) {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
}

// Configure default marker icon
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41], // Adjust anchor to align marker properly
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapClickHandler({ onClick }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onClick(lat, lng);
    },
  });
  return null;
}

function CampanaCard({ campana, formatearFecha, onCampanaUpdated }) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [puntosRecoleccion, setPuntosRecoleccion] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAddPointModal, setShowAddPointModal] = useState(false);
  const [newPoint, setNewPoint] = useState({ nombre_punto: "", direccion: "" });
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [editingPuntoId, setEditingPuntoId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const defaultImage = "banner.jpg";

  const esAdmin = localStorage.getItem('rol') === '1';

  // Lock background scroll when modals are open
  useEffect(() => {
    const anyOpen = showModal || showAddPointModal || showDetailsModal || showEditModal;
    const body = document.body;
    if (anyOpen) {
      body.classList.add("no-scroll");
    } else {
      body.classList.remove("no-scroll");
    }
    return () => body.classList.remove("no-scroll");
  }, [showModal, showAddPointModal, showDetailsModal, showEditModal]);

  const handleShowPuntosRecoleccion = () => {
    axios
      .get(`/puntos-de-recoleccion/campana/${campana.id_campana}`)
      .then((res) => {
        setPuntosRecoleccion(res.data);
        setShowModal(true);
      })
      .catch((err) => console.error(err));
  };

  const handleAddPoint = (e) => {
    e.preventDefault();
    const payload = { ...newPoint, id_campana: campana.id_campana };
    axios
      .post("/puntos-de-recoleccion", payload)
      .then((res) => {
        setPuntosRecoleccion([...puntosRecoleccion, res.data]);
        setShowAddPointModal(false);
        setNewPoint({ nombre_punto: "", direccion: "" }); // Resetear formulario
      })
      .catch((err) => console.error(err));
  };

  const handleEditPunto = (punto) => {
    setNewPoint({
      nombre_punto: punto.nombre_punto,
      direccion: punto.direccion,
    });
    setSelectedPosition(
      punto.direccion.split(",").map((coord) => parseFloat(coord.trim()))
    );
    setShowAddPointModal(true);
    setEditingPuntoId(punto.id_punto);
  };

  const handleSaveEditPunto = (e) => {
    e.preventDefault();
    const payload = {
      nombre_punto: newPoint.nombre_punto,
      direccion: newPoint.direccion,
    };
    axios
      .put(`/puntos-de-recoleccion/${editingPuntoId}`, payload)
      .then(() => {
        setPuntosRecoleccion(
          puntosRecoleccion.map((p) =>
            p.id_punto === editingPuntoId ? { ...p, ...payload } : p
          )
        );
        setShowAddPointModal(false);
        setNewPoint({ nombre_punto: "", direccion: "" });
        setEditingPuntoId(null);
      })
      .catch((err) => console.error(err));
  };

  const handleDeletePunto = (id_punto) => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar este punto de recolección?"
      )
    ) {
      axios
        .delete(`/puntos-de-recoleccion/${id_punto}`)
        .then(() => {
          setPuntosRecoleccion(
            puntosRecoleccion.filter((p) => p.id_punto !== id_punto)
          );
        })
        .catch((err) => console.error(err));
    }
  };

  const handleCampanaUpdated = () => {
    if (onCampanaUpdated) {
      onCampanaUpdated();
    }
    setShowEditModal(false);
  };

  return (
    <div className="camp-card">
      {/* ✅ Botón de editar en esquina superior derecha - solo para admin */}
      {esAdmin && (
        <button
          className="campana-edit-button"
          onClick={() => setShowEditModal(true)}
          title="Editar campaña"
        >
          ⚙️
        </button>
      )}

      <img
        src={campana.imagen_url || defaultImage}
        alt="Imagen de campaña"
        className="camp-card-img"
      />

      <div className="camp-card-content">
        <h2 className="camp-card-title">{campana.nombre_campana}</h2>
        <p>
          <strong>Organizador:</strong> {campana.organizador}
        </p>
        <p>
          <strong>Fecha:</strong> {formatearFecha(campana.fecha_inicio)} -{" "}
          {formatearFecha(campana.fecha_fin)}
        </p>

        <button
          className="camp-card-btn"
          onClick={() => setShowDetailsModal(true)}
        >
          Ver detalles
        </button>

        <button className="camp-card-btn" onClick={handleShowPuntosRecoleccion}>
          Puntos de Recolección
        </button>

      </div>

      {showEditModal && (
        <Portal>
          <EditCampanaModal
            show={showEditModal}
            onClose={() => setShowEditModal(false)}
            campana={campana}
            onUpdated={handleCampanaUpdated}
          />
        </Portal>
      )}

      {/* Modales fuera de la tarjeta para que aparezcan en el centro de la pantalla */}
      {showModal && (
        <Portal>
          <div
            className="modal-backdrop"
            style={{ background: "rgba(0, 0, 0, 0)" }}
          >
            <div className="modal-content puntos-recoleccion-modal" style={{ background: "white" }}>
              <div className="modal-header">
                <h2>Puntos de Recolección</h2>
                <button
                  className="modal-close-x"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="map-container">
                  <h3>Mapa de Ubicaciones</h3>
                  <MapContainer
                    center={[-17.7833, -63.1821]}
                    zoom={12}
                    style={{
                      height: "400px",
                      width: "100%",
                      borderRadius: "16px",
                    }}
                    className="recoleccion-map"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {puntosRecoleccion.map((punto) => {
                      if (!punto.direccion) {
                        console.error(
                          `Direccion is undefined for punto: ${punto.nombre_punto}`
                        );
                        return null;
                      }

                      const [lat, lng] = punto.direccion
                        .split(",")
                        .map((coord) => parseFloat(coord.trim()));
                      if (!isNaN(lat) && !isNaN(lng)) {
                        return (
                          <Marker key={punto.id_punto} position={[lat, lng]}>
                            <div className="marker-popup">
                              <strong>{punto.nombre_punto}</strong>
                              <div className="marker-actions">
                                <button
                                  className="marker-btn edit"
                                  onClick={() => handleEditPunto(punto)}
                                  title="Editar punto"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="marker-btn delete"
                                  onClick={() =>
                                    handleDeletePunto(punto.id_punto)
                                  }
                                  title="Eliminar punto"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </Marker>
                        );
                      } else {
                        console.error(
                          `Invalid coordinates for punto: ${punto.nombre_punto}, direccion: ${punto.direccion}`
                        );
                        return null;
                      }
                    })}
                  </MapContainer>
                </div>

                <div className="puntos-list-container">
                  <h3>Lista de Puntos</h3>
                  <div className="puntos-actions-container">
                    {puntosRecoleccion.length > 0 ? (
                      puntosRecoleccion.map((punto) => (
                        <div key={punto.id_punto} className="punto-action-item">
                          <div className="punto-info">
                            <span className="punto-name">
                              📍 {punto.nombre_punto}
                            </span>
                            <span className="punto-coords">
                              📍 {punto.direccion}
                            </span>
                          </div>
                          <div className="punto-buttons">
                            <button
                              className="punto-btn edit"
                              onClick={() => handleEditPunto(punto)}
                              title="Editar punto"
                            >
                              Editar
                            </button>
                            <button
                              className="punto-btn delete"
                              onClick={() => handleDeletePunto(punto.id_punto)}
                              title="Eliminar punto"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-puntos">
                        <p>No hay puntos de recolección registrados</p>
                        <p>Haz clic en "Agregar Nuevo Punto" para comenzar</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </button>
                <button
                  className="modal-add-btn"
                  onClick={() => setShowAddPointModal(true)}
                >
                  Agregar Nuevo Punto
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showAddPointModal && (
        <Portal>
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>Agregar Nuevo Punto de Recolección</h2>
              <MapContainer
                center={[-17.7833, -63.1821]}
                zoom={12}
                style={{ height: "300px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler
                  onClick={(lat, lng) => {
                    setNewPoint({ ...newPoint, direccion: `${lat},${lng}` });
                    setSelectedPosition([lat, lng]);
                  }}
                />
                {selectedPosition && <Marker position={selectedPosition} />}
              </MapContainer>
              <form
                onSubmit={editingPuntoId ? handleSaveEditPunto : handleAddPoint}
              >
                <label>
                  Nombre del Punto:
                  <input
                    type="text"
                    value={newPoint.nombre_punto}
                    onChange={(e) =>
                      setNewPoint({ ...newPoint, nombre_punto: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Dirección:
                  <input type="text" value={newPoint.direccion} readOnly />
                </label>
                <button type="submit">
                  {editingPuntoId ? "Guardar Cambios" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPointModal(false)}
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de detalles de la campaña */}
      <CampanaDetailsModal
        show={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        campana={campana}
        formatearFecha={formatearFecha}
      />
    </div>
  );
}

export default CampanaCard;
