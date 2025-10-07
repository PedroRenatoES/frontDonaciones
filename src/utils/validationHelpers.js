// Utilidades de validación y formateo de errores para alertas

export const formatErrorsForAlert = (errors) => {
  if (!Array.isArray(errors) || errors.length === 0) return '';
  return `Por favor corrige lo siguiente:\n\n- ${errors.join('\n- ')}`;
};

export const collectDonationErrors = ({ basePayload, formData, tipoDonacion, dineroData, especieData }) => {
  const errors = [];

  if (!basePayload.id_donante || Number.isNaN(basePayload.id_donante)) {
    errors.push('Selecciona un donante.');
  }

  if (!formData.tipo_donacion) {
    errors.push('Selecciona el tipo de donación.');
  }

  const tipoNormalized = (tipoDonacion || formData.tipo_donacion || '').toLowerCase();

  if (tipoNormalized === 'dinero') {
    const montoNumber = parseFloat(String(dineroData?.monto ?? '').replace(',', '.'));
    if (Number.isNaN(montoNumber) || montoNumber <= 0) {
      errors.push('Monto: ingresa un valor numérico mayor a 0.');
    }
    if (!dineroData?.divisa) {
      errors.push('Divisa: selecciona una divisa.');
    }
    if (!dineroData?.nombre_cuenta) {
      errors.push('Nombre de la cuenta: es requerido.');
    }
    if (!dineroData?.numero_cuenta) {
      errors.push('Número de cuenta: es requerido.');
    }
    // Si el comprobante es obligatorio, descomentar:
    // if (!dineroData?.comprobante_url) {
    //   errors.push('Comprobante: sube una imagen de comprobante.');
    // }
  } else if (tipoNormalized === 'especie') {
    if (!especieData?.id_articulo) {
      errors.push('Artículo: selecciona un artículo.');
    }
    if (!especieData?.id_espacio) {
      errors.push('Espacio: selecciona un espacio/almacén.');
    }
    const cantNumber = parseFloat(String(especieData?.cantidad ?? '').replace(',', '.'));
    if (Number.isNaN(cantNumber) || cantNumber <= 0) {
      errors.push('Cantidad: ingresa un valor numérico mayor a 0.');
    }
    if (!especieData?.estado_articulo) {
      errors.push('Estado del artículo: es requerido.');
    }
  }

  return errors;
};


