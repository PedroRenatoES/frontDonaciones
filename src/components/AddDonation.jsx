import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import '../styles/AddDonation.css';
import axios from '../axios';
import DonorFormModal from '../components/DonorFormModal';
import Toast from '../components/Toast';
import DonacionDineroForm from '../components/DonacionDineroForm';
import DonacionEspecieForm from '../components/DonacionEspecieForm';
import Select from 'react-select';
import CampanaModal from '../components/CampanaModal';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { collectDonationErrors, formatErrorsForAlert } from '../utils/validationHelpers';


Modal.setAppElement('#root');


function AddDonation() {
  const [tipoDonacion, setTipoDonacion] = useState('');
  const [donantes, setDonantes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [nombresCuenta, setNombresCuenta] = useState([]);
  const [numerosCuenta, setNumerosCuenta] = useState([]);
  const { modalState, showAlert } = useConfirmModal();
  const [loading, setLoading] = useState(false);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('');
  const [dineroData, setDineroData] = useState({
  monto: '',
  divisa: 'Bs',
  nombre_cuenta: '',
  numero_cuenta: '',
  comprobante_url: '',
  estado_validacion: 'pendiente',
});

const [especieData, setEspecieData] = useState({
  id_articulo: '',
  id_espacio: '',
  cantidad: '',
  estado_articulo: 'Nuevo',
  destino_donacion: '',
});


useEffect(() => {
  const fetchDonantes = async () => {
    try {
      const res = await axios.get('/donantes');
      setDonantes(res.data);
    } catch (error) {
      console.error('Error al obtener donantes:', error);
    }
  };

  const fetchCampañas = async () => {
    try {
      const res = await axios.get('/campanas');
      setCampañas(res.data);
    } catch (error) {
      console.error('Error al obtener campañas:', error);
    }
  };

  const fetchExtras = async () => {
    try {
      const [articulosRes, espaciosRes, almacenesRes] = await Promise.all([
        axios.get('/catalogo'),
        axios.get('/espacios'),
        axios.get('/almacenes'),
      ]);
      setArticulos(articulosRes.data);
      setEspacios(espaciosRes.data);
      setAlmacenes(almacenesRes.data);
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
    }
  };

  const fetchDatosCuenta = async () => {
    try {
      const [nombresRes, numerosRes] = await Promise.all([
        axios.get('/donaciones-en-dinero/nombres-cuenta'),
        axios.get('/donaciones-en-dinero/numeros-cuenta'),
      ]);
      setNombresCuenta(nombresRes.data);
      setNumerosCuenta(numerosRes.data);
    } catch (error) {
      console.error('Error al obtener datos de cuenta:', error);
    }
  };

  // Ejecutar todas las funciones de carga de datos
  fetchDatosCuenta();
  fetchDonantes();
  fetchCampañas();
  fetchExtras();
}, []);

// Función para refrescar campañas desde el modal
const fetchCampañas = async () => {
  try {
    const res = await axios.get('/campanas');
    setCampañas(res.data);
  } catch (error) {
    console.error('Error al obtener campañas:', error);
  }
};

const [formData, setFormData] = useState({
  id_donante: '',
  fecha_donacion: new Date().toISOString().split('T')[0], 
  id_campana: '',
  tipo_donacion: '',
});
const [donationNotice, setDonationNotice] = useState({ success: '', error: '' });

// Modal para crear un nuevo donante
const [editMode, setEditMode] = useState(false);
const [donorFormData, setDonorFormData] = useState({
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  correo: '',
  telefono: '',
  usuario: '',
  contraseña_hash: '',
});
const [donorNotice, setDonorNotice] = useState({ success: '', error: '' });

const handleCreateDonor = async () => {
  if (loading) return; // evita múltiples clics
  setLoading(true);
  try {
    const res = await axios.post('/donantes', donorFormData);
    const newDonor = res.data;

    setDonorModalOpen(false);
    setDonantes(prev => [...prev, newDonor]);
    setFormData(prev => ({ ...prev, id_donante: newDonor.id_donante }));
    // Limpiar notificaciones ya que no se muestra modal de éxito
    setDonorNotice({ success: '', error: '' });
  } catch (error) {
    console.error('Error al crear donante desde donación', error);
    setDonorNotice({ success: '', error: 'Error al registrar el donante' });
  } finally {
    setLoading(false);
  }
};

// Fin modal

  const handleBaseChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === 'tipo_donacion') {
      setTipoDonacion(e.target.value);
    }
  };

const handleSubmit = async () => {
  try {
    // 1. Enviar la donación base
    const basePayload = {
      ...formData,
      id_donante: parseInt(formData.id_donante),
      id_campana: parseInt(formData.id_campana),
    };

    // Imprimir el body que se envía al backend
    console.log('Payload enviado a /donaciones:', basePayload);

    // Validaciones previas unificadas
    const errors = collectDonationErrors({ basePayload, formData, tipoDonacion, dineroData, especieData });
    if (errors.length > 0) {
      await showAlert({
        title: 'Campos inválidos o incompletos',
        message: formatErrorsForAlert(errors),
        type: 'alert',
        confirmText: 'Entendido'
      });
      return;
    }

    const res = await axios.post('/donaciones', basePayload);
    const donacionId = res.data.id_donacion || res.data.id || res.data;

    // 2. Enviar la donación específica
    const tipoNormalized = (tipoDonacion || formData.tipo_donacion || '').toLowerCase();

    const endpoint =
      tipoNormalized === 'dinero'
        ? `/donaciones-en-dinero/${donacionId}`
        : `/donaciones-en-especie/${donacionId}`;

    const specificPayload =
      tipoNormalized === 'dinero'
        ? { ...dineroData, monto: parseFloat(String(dineroData.monto).replace(',', '.')) }
        : especieData;
    console.log('Payload enviado a', endpoint, ':', specificPayload);
    
    await axios.put(endpoint, specificPayload);
    setDonationNotice({ success: 'Donación registrada con éxito', error: '' });
    await showAlert({ title: 'Éxito', message: 'La donación se agregó exitosamente', type: 'success', confirmText: 'Aceptar' });
    // Reiniciar campos tras éxito
    setTipoDonacion('');
    setFormData({
      id_donante: '',
      fecha_donacion: new Date().toISOString().split('T')[0],
      id_campana: '',
      tipo_donacion: '',
    });
    setDineroData({
      monto: '',
      divisa: 'Bs',
      nombre_cuenta: '',
      numero_cuenta: '',
      comprobante_url: '',
      estado_validacion: 'pendiente',
    });
    setEspecieData({
      id_articulo: '',
      id_espacio: '',
      cantidad: '',
      estado_articulo: 'Nuevo',
      destino_donacion: '',
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    console.error('Error al guardar la donación:', error);
    setDonationNotice({ success: '', error: '' });
    await showAlert({ title: 'Error', message: 'Error al guardar la donación', type: 'error', confirmText: 'Entendido' });
  }
};

  // Definición de las variables y funciones faltantes
const [campanaModalOpen, setCampanaModalOpen] = useState(false);
const [donorModalOpen, setDonorModalOpen] = useState(false);
const [campañas, setCampañas] = useState([]);

  return (
    <div className="add-donation">
      <Toast
        show={!!donationNotice.success}
        type="success"
        message={donationNotice.success}
        onClose={() => setDonationNotice({ success: '', error: '' })}
      />
      <Toast
        show={!!donationNotice.error}
        type="error"
        message={donationNotice.error}
        onClose={() => setDonationNotice({ success: '', error: '' })}
      />
      <h1>Agregar Nueva Donación</h1>
      <ConfirmModal
        show={modalState.show}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
      
      {/* Formulario Principal */}
      <div className="donation-form">
        <div className="form-section-header">
          <h2>Información General</h2>
          <p>Completa los datos básicos de la donación</p>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de Donación</label>
            <div className="form-input-container">
              <select name="tipo_donacion" onChange={handleBaseChange} value={formData.tipo_donacion}>
                <option value="">Selecciona el tipo</option>
                <option value="Dinero">Dinero</option>
                <option value="especie">Especie</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Donante</label>
            <div className="form-input-container" style={{marginTop: '-7px'} }>
              <div className="custom-dropdown-container">
                <input style={{height: '43px'} }
                  type="text"
                  className="custom-dropdown-input"
                  placeholder="Buscar donante por nombre"
                  value={formData.nombre_donante || ''}
                  onChange={(e) => {
                    const searchTerm = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      nombre_donante: searchTerm,
                      id_donante: searchTerm ? formData.id_donante : ''
                    }));
                    setDonorSearchTerm(searchTerm);
                  }}
                  onFocus={() => setShowDonorDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDonorDropdown(false), 200)}
                />
                {showDonorDropdown && (
                  <div className="custom-dropdown-list">
                    {donantes
                      .filter(d => 
                        `${d.nombres} ${d.apellido_paterno || ''} ${d.apellido_materno || ''}`
                          .toLowerCase()
                          .includes(donorSearchTerm.toLowerCase())
                      )
                      .map(donante => (
                        <div
                          key={donante.id_donante}
                          className="custom-dropdown-item"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              id_donante: donante.id_donante,
                              nombre_donante: `${donante.nombres} ${donante.apellido_paterno || ''} ${donante.apellido_materno || ''}`
                            }));
                            setShowDonorDropdown(false);
                          }}
                        >
                          {donante.nombres} {donante.apellido_paterno || ''} {donante.apellido_materno || ''}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-add-donor"
                onClick={() => {
                  setDonorFormData({
                    nombres: '',
                    apellido_paterno: '',
                    apellido_materno: '',
                    correo: '',
                    telefono: '',
                    usuario: '',
                    contraseña_hash: '',
                  });
                  setEditMode(false);
                  setDonorModalOpen(true);
                }}
              >
                + Agregar Donante
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Campaña</label>
            <div className="form-input-container" style={{marginTop: '-7px'} }>
              <div className="custom-dropdown-container">
                <input style={{height: '43px'} }
                  type="text"
                  className="custom-dropdown-input"
                  placeholder="Buscar campaña por nombre"
                  value={formData.nombre_campana || ''}
                  onChange={(e) => {
                    const searchTerm = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      nombre_campana: searchTerm,
                      id_campana: searchTerm ? formData.id_campana : ''
                    }));
                    setCampaignSearchTerm(searchTerm);
                  }}
                  onFocus={() => setShowCampaignDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCampaignDropdown(false), 200)}
                />
                {showCampaignDropdown && (
                  <div className="custom-dropdown-list">
                    {campañas
                      .filter(c => 
                        c.nombre_campana
                          .toLowerCase()
                          .includes(campaignSearchTerm.toLowerCase())
                      )
                      .map(campana => (
                        <div
                          key={campana.id_campana}
                          className="custom-dropdown-item"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              id_campana: campana.id_campana,
                              nombre_campana: campana.nombre_campana
                            }));
                            setShowCampaignDropdown(false);
                          }}
                        >
                          {campana.nombre_campana}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-add-campaign"
                onClick={() => setCampanaModalOpen(true)}
              >
                + Crear Campaña
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Fecha de Donación</label>
            <input
              type="date"
              name="fecha_donacion"
              value={formData.fecha_donacion}
              readOnly
            />
          </div>
        </div>
        
        {/* Botón de guardar (solo arriba cuando no hay tipo seleccionado) */}
        {!tipoDonacion && (
          <div className="form-submit-section">
            <button className="submit-btn" onClick={handleSubmit}>
              Guardar Donación
            </button>
          </div>
        )}
      </div>
      
      {/* Formulario Específico */}
      {tipoDonacion && (  
        <div className="specific-donation-form">
          <div className="form-section-header">
            <h2>
              {tipoDonacion === 'Dinero' ? 'Detalles de Donación en Dinero' : 'Detalles de Donación en Especie'}
            </h2>
            <p>
              {tipoDonacion === 'Dinero' 
                ? 'Completa la información específica de la donación monetaria'
                : 'Completa la información específica de la donación en especie'
              }
            </p>
          </div>
          
          {tipoDonacion === 'Dinero' ? (
            <DonacionDineroForm
              data={dineroData}
              setData={setDineroData}
              nombresCuenta={nombresCuenta}
              numerosCuenta={numerosCuenta}
            />
          ) : (
            <DonacionEspecieForm
              data={especieData}
              setData={setEspecieData}
              articulos={articulos}
              espacios={espacios}
              almacenes={almacenes}
            />
          )}

          {/* Botón de guardar integrado abajo cuando hay tipo seleccionado */}
          <div className="form-submit-section">
            <button className="submit-btn" onClick={handleSubmit}>
              Guardar Donación
            </button>
          </div>
        </div>
      )}

      {/* MODAL DONANTE */}
      <DonorFormModal
        isOpen={donorModalOpen}
        onClose={() => setDonorModalOpen(false)}
        onSubmit={handleCreateDonor}
        formData={donorFormData}
        setFormData={setDonorFormData}
        editMode={editMode}
        loading={loading}
        serverError={donorNotice.error}
        serverSuccess={donorNotice.success}
        clearNotices={() => setDonorNotice({ success: '', error: '' })}
      />

      {/* MODAL CAMPAÑA */}
      <CampanaModal
        show={campanaModalOpen}
        onClose={() => setCampanaModalOpen(false)}
        onCreated={() => {
          setCampanaModalOpen(false);
          fetchCampañas();
        }}
      />
    </div>
  );
}

export default AddDonation;
