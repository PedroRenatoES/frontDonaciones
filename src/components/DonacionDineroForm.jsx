import React, { useState } from 'react';
import axios from '../axios';
function DonacionDineroForm({ data, setData, nombresCuenta = [], numerosCuenta = [], fieldErrors = {}, setFieldErrors }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('imagen', file); 
  
    setUploading(true);
    setUploadError(null);
  
    try {
      const response = await axios.post(
        'http://localhost:5001/api/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      const { url } = response.data;
      if (url) {
        setData({ ...data, comprobante_url: url });
      } else {
        throw new Error('Respuesta del servidor sin URL');
      }
    } catch (error) {
      setUploadError(
        error.response?.data?.message || 'Error al subir el comprobante'
      );
    } finally {
      setUploading(false);
    }
  };

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
              className={`form-control ${fieldErrors.monto ? 'field-error' : ''}`}
              placeholder="Ingrese el monto"
              value={data.monto}
              onChange={e => {
                const valor = e.target.value;
                if (parseFloat(valor) >= 0 || valor === '') {
                  setData({ ...data, monto: valor });
                  
                  // Limpiar error del monto cuando el usuario interactúa
                  if (fieldErrors.monto && setFieldErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      monto: ''
                    }));
                  }
                }
              }}
            />
            {fieldErrors.monto && (
              <div className="field-error-message">{fieldErrors.monto}</div>
            )}
          </div>
        </div>

        {/* 2. Información de cuenta */}
        <div className="form-section">
          <div className="mb-3">
            <label><strong>Nombre de la cuenta</strong></label>
            <input
              className={`form-control ${fieldErrors.nombre_cuenta ? 'field-error' : ''}`}
              placeholder="Nombre de cuenta"
              list="nombresCuenta"
              value={data.nombre_cuenta}
              onChange={e => {
                const valor = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(valor)) {
                  setData({ ...data, nombre_cuenta: valor });
                  
                  // Limpiar error del nombre de cuenta cuando el usuario interactúa
                  if (fieldErrors.nombre_cuenta && setFieldErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      nombre_cuenta: ''
                    }));
                  }
                }
              }}
            />
            <datalist id="nombresCuenta">
              {nombresCuenta.map((c, index) => (
                <option key={index} value={c.nombre_cuenta} />
              ))}
            </datalist>
            {fieldErrors.nombre_cuenta && (
              <div className="field-error-message">{fieldErrors.nombre_cuenta}</div>
            )}
          </div>

          <div className="mb-3">
            <label><strong>Número de cuenta</strong></label>
            <input
              className={`form-control ${fieldErrors.numero_cuenta ? 'field-error' : ''}`}
              placeholder="Número de cuenta"
              list="numerosCuenta"
              value={data.numero_cuenta}
              onChange={e => {
                const valor = e.target.value;
                if (/^\d*$/.test(valor)) {
                  setData({ ...data, numero_cuenta: valor });
                  
                  // Limpiar error del número de cuenta cuando el usuario interactúa
                  if (fieldErrors.numero_cuenta && setFieldErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      numero_cuenta: ''
                    }));
                  }
                }
              }}
            />
            <datalist id="numerosCuenta">
              {numerosCuenta.map((n, index) => (
                <option key={index} value={n.numero_cuenta} />
              ))}
            </datalist>
            {fieldErrors.numero_cuenta && (
              <div className="field-error-message">{fieldErrors.numero_cuenta}</div>
            )}
          </div>
        </div>

        {/* 3. Comprobante */}
        <div className="form-section">
          <div className="mb-3">
            <label className={fieldErrors.comprobante_url ? 'field-error-label' : ''}>
              Imagen del comprobante:
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  handleFileChange(e);
                  
                  // Limpiar error del comprobante cuando el usuario interactúa
                  if (fieldErrors.comprobante_url && setFieldErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      comprobante_url: ''
                    }));
                  }
                }} 
                required 
              />
            </label>

            {uploadError && <p className="error-msg">{uploadError}</p>}

            {uploading && <p style={{ color: 'blue' }}>Subiendo imagen...</p>}
            {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
            {data.comprobante_url && (
              <p style={{ color: 'green' }}>
                Comprobante subido: <a href={data.comprobante_url} target="_blank" rel="noreferrer">Ver imagen</a>
              </p>
            )}
            {fieldErrors.comprobante_url && (
              <div className="field-error-message">{fieldErrors.comprobante_url}</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default DonacionDineroForm;
