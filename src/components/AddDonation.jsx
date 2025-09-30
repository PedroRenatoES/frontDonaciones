import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import '../styles/AddDonation.css';
import axios from '../axios';
import DonorFormModal from '../components/DonorFormModal';
import DonacionDineroForm from '../components/DonacionDineroForm';
import DonacionEspecieForm from '../components/DonacionEspecieForm';
import Select from 'react-select';
import CampanaModal from '../components/CampanaModal';


Modal.setAppElement('#root');


function AddDonation() {
  const [tipoDonacion, setTipoDonacion] = useState('');
  const [donantes, setDonantes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [nombresCuenta, setNombresCuenta] = useState([]);
  const [numerosCuenta, setNumerosCuenta] = useState([]);
  const [loading, setLoading] = useState(false);
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

const handleCreateDonor = async () => {
  if (loading) return; // evita múltiples clics
  setLoading(true);
  try {
    const res = await axios.post('/donantes', donorFormData);
    const newDonor = res.data;

    setDonorModalOpen(false);
    setDonantes(prev => [...prev, newDonor]);
    setFormData(prev => ({ ...prev, id_donante: newDonor.id_donante }));

    alert('Donante registrado con éxito');
  } catch (error) {
    console.error('Error al crear donante desde donación', error);
    alert('Error al registrar el donante');
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

    const res = await axios.post('/donaciones', basePayload);
    const donacionId = res.data.id_donacion || res.data.id || res.data;

    // 2. Enviar la donación específica
    const endpoint =
      tipoDonacion === 'dinero'
        ? `/donaciones-en-dinero/${donacionId}`
        : `/donaciones-en-especie/${donacionId}`;

    const specificPayload =
      tipoDonacion === 'dinero' ? dineroData : especieData;
    console.log('Payload enviado a', endpoint, ':', specificPayload);
    
    await axios.put(endpoint, specificPayload);
    
    alert('Donación registrada con éxito');
  } catch (error) {
    console.error(error.response?.data || error.message);
    console.error('Error al guardar la donación:', error);
    alert('Error al guardar la donación');
  }
};

  // Definición de las variables y funciones faltantes
const [campanaModalOpen, setCampanaModalOpen] = useState(false);
const [donorModalOpen, setDonorModalOpen] = useState(false);
const [campañas, setCampañas] = useState([]);

  return (
    <div className="add-donation">
      <h1>Agregar Nueva Donación</h1>
      
      {/* Formulario Principal */}
      <div className="donation-form">
        <div className="form-section-header">
          <h2>Información General</h2>
          <p>Completa los datos básicos de la donación</p>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de Donación</label>
            <select name="tipo_donacion" onChange={handleBaseChange}>
              <option value="">Selecciona el tipo</option>
              <option value="Dinero">Dinero</option>
              <option value="especie">Especie</option>
            </select>
          </div>

          <div className="form-group">
            <label>Donante</label>
            <Select
              options={donantes.map(d => ({
                value: d.id_donante,
                label: `${d.nombres} ${d.apellido_paterno || ''}`
              }))}
              onChange={(selected) => {
                setFormData(prev => ({
                  ...prev,
                  id_donante: selected?.value || '',
                  nombre_donante: selected?.label || ''
                }));
              }}
              value={
                formData.id_donante
                  ? {
                      value: formData.id_donante,
                      label: formData.nombre_donante
                    }
                  : null
              }
              placeholder="Buscar donante por nombre"
              isClearable
            />
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

          <div className="form-group">
            <label>Campaña</label>
            <Select
              options={campañas.map(c => ({
                value: c.id_campana,
                label: c.nombre_campana
              }))}
              onChange={(selected) => {
                setFormData(prev => ({
                  ...prev,
                  id_campana: selected?.value || '',
                  nombre_campana: selected?.label || ''
                }));
              }}
              value={
                formData.id_campana
                  ? {
                      value: formData.id_campana,
                      label: formData.nombre_campana
                    }
                  : null
              }
              placeholder="Buscar campaña por nombre"
              isClearable
            />
            <button
              type="button"
              className="btn-add-campaign"
              onClick={() => setCampanaModalOpen(true)}
            >
              + Crear Campaña
            </button>
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
        
        {/* Botón de guardar integrado */}
        <div className="form-submit-section">
          <button className="submit-btn" onClick={handleSubmit}>
            Guardar Donación
          </button>
        </div>
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
