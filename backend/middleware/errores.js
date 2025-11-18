export const manejarErrores = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const mensajes = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validación fallida', detalles: mensajes });
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue)[0];
    return res.status(400).json({ error: `${campo} ya existe` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor'
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};
