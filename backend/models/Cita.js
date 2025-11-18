import mongoose from 'mongoose';

const citaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario es requerido']
  },
  paciente: {
    type: String,
    required: [true, 'El nombre del paciente es requerido'],
    trim: true
  },
  tratamiento: {
    type: String,
    enum: [
      'Limpieza',
      'Blanqueamiento',
      'Ortodoncia',
      'Endodoncia',
      'Extracción',
      'Implante',
      'Consulta general'
    ],
    required: [true, 'El tratamiento es requerido']
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida']
  },
  hora: {
    type: String,
    required: [true, 'La hora es requerida'],
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  },
  notas: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
    default: 'pendiente'
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  // Reminder fields
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderMethod: {
    type: String,
    enum: ['email', 'whatsapp', 'both', 'none'],
    default: 'email'
  },
  reminderScheduledAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice para búsquedas rápidas por usuario y fecha
citaSchema.index({ usuario: 1, fecha: 1 });

// Middleware para actualizar updatedAt
citaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Cita = mongoose.model('Cita', citaSchema);
export default Cita;

