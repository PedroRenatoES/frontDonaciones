/**
 * Esquemas de validación OWASP para formularios
 */

// Esquema para login
export const loginSchema = {
  ci: {
    type: 'ci',
    required: true,
    minLength: 5,
    maxLength: 15,
    preventSQLInjection: true
  },
  contrasena: {
    type: 'string',
    required: true,
    minLength: 6,
    maxLength: 100,
    preventSQLInjection: true
  }
};

// Esquema para usuarios
export const userSchema = {
  nombres: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
    preventSQLInjection: true
  },
  apellido_paterno: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
    preventSQLInjection: true
  },
  apellido_materno: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 50,
    preventSQLInjection: true
  },
  correo: {
    type: 'email',
    required: true,
    maxLength: 100,
    preventSQLInjection: true
  },
  telefono: {
    type: 'phone',
    required: false,
    minLength: 7,
    maxLength: 15,
    preventSQLInjection: true
  },
  ci: {
    type: 'ci',
    required: true,
    minLength: 5,
    maxLength: 15,
    preventSQLInjection: true
  },
  direccion_domiciliaria: {
    type: 'string',
    required: false,
    maxLength: 200,
    preventSQLInjection: true
  },
  fecha_nacimiento: {
    type: 'string',
    required: false,
    preventSQLInjection: true
  }
};

// Esquema para donantes
export const donorSchema = {
  nombres: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
    preventSQLInjection: true
  },
  apellido_paterno: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
    preventSQLInjection: true
  },
  apellido_materno: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 50,
    preventSQLInjection: true
  },
  correo: {
    type: 'email',
    required: false,
    maxLength: 100,
    preventSQLInjection: true
  },
  telefono: {
    type: 'phone',
    required: false,
    minLength: 7,
    maxLength: 15,
    preventSQLInjection: true
  },
  direccion: {
    type: 'string',
    required: false,
    maxLength: 200,
    preventSQLInjection: true
  }
};

// Esquema para donaciones
export const donationSchema = {
  nombre_articulo: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    preventSQLInjection: true
  },
  descripcion: {
    type: 'string',
    required: false,
    maxLength: 500,
    preventSQLInjection: true
  },
  cantidad: {
    type: 'number',
    required: true,
    preventSQLInjection: true
  },
  unidad_medida: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 20,
    preventSQLInjection: true
  },
  fecha_vencimiento: {
    type: 'string',
    required: false,
    preventSQLInjection: true
  },
  estado: {
    type: 'string',
    required: true,
    preventSQLInjection: true
  }
};

// Esquema para donaciones en dinero
export const moneyDonationSchema = {
  monto: {
    type: 'number',
    required: true,
    preventSQLInjection: true
  },
  nombre_cuenta: {
    type: 'string',
    required: false,
    maxLength: 100,
    preventSQLInjection: true
  },
  numero_cuenta: {
    type: 'string',
    required: false,
    maxLength: 50,
    preventSQLInjection: true
  }
};

// Esquema para campañas
export const campaignSchema = {
  nombre_campana: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 100,
    preventSQLInjection: true
  },
  descripcion: {
    type: 'string',
    required: false,
    maxLength: 1000,
    preventSQLInjection: true
  },
  organizador: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    preventSQLInjection: true
  },
  fecha_inicio: {
    type: 'string',
    required: true,
    preventSQLInjection: true
  },
  fecha_fin: {
    type: 'string',
    required: true,
    preventSQLInjection: true
  }
};

// Esquema para almacenes
export const warehouseSchema = {
  nombre_almacen: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    preventSQLInjection: true
  },
  direccion: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 200,
    preventSQLInjection: true
  },
  capacidad_maxima: {
    type: 'number',
    required: true,
    preventSQLInjection: true
  },
  coordenadas: {
    type: 'coordinates',
    required: false,
    maxLength: 50,
    preventSQLInjection: true
  }
};

// Esquema para puntos de recolección
export const collectionPointSchema = {
  nombre_punto: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    preventSQLInjection: true
  },
  direccion: {
    type: 'coordinates',
    required: true,
    maxLength: 50,
    preventSQLInjection: true
  }
};

// Esquema para paquetes
export const packageSchema = {
  nombre_paquete: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    preventSQLInjection: true
  },
  descripcion: {
    type: 'string',
    required: false,
    maxLength: 500,
    preventSQLInjection: true
  }
};

// Esquema para solicitudes de ayuda
export const helpRequestSchema = {
  nombre_solicitante: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    preventSQLInjection: true
  },
  telefono: {
    type: 'phone',
    required: true,
    minLength: 7,
    maxLength: 15,
    preventSQLInjection: true
  },
  direccion: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 200,
    preventSQLInjection: true
  },
  descripcion_necesidad: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 1000,
    preventSQLInjection: true
  },
  urgencia: {
    type: 'string',
    required: true,
    preventSQLInjection: true
  }
};

// Esquema para cambio de contraseña
export const passwordChangeSchema = {
  currentPassword: {
    type: 'string',
    required: true,
    minLength: 6,
    maxLength: 100,
    preventSQLInjection: true
  },
  newPassword: {
    type: 'string',
    required: true,
    minLength: 8,
    maxLength: 100,
    preventSQLInjection: true
  },
  confirmPassword: {
    type: 'string',
    required: true,
    minLength: 8,
    maxLength: 100,
    preventSQLInjection: true
  }
};

// Función helper para obtener esquema por tipo
export const getSchema = (type) => {
  const schemas = {
    login: loginSchema,
    user: userSchema,
    donor: donorSchema,
    donation: donationSchema,
    moneyDonation: moneyDonationSchema,
    campaign: campaignSchema,
    warehouse: warehouseSchema,
    collectionPoint: collectionPointSchema,
    package: packageSchema,
    helpRequest: helpRequestSchema,
    passwordChange: passwordChangeSchema
  };

  return schemas[type] || {};
};
