import mongoose from 'mongoose';

const actividadSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  notas: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const pacienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del paciente es requerido'],
    trim: true
  },
  id: {
    type: String,
    unique: true,
    default: () => `#MS-${Math.floor(Math.random() * 9000) + 1000}`
  },
  ultimaCita: {
    type: Date,
    default: Date.now
  },
  historia: {
    type: String,
    default: ''
  },
  consultaFecha: Date,
  tratamientoTipo: String,
  tratamientoEstado: {
    type: String,
    enum: ['En curso', 'Terminado', 'Pendiente'],
    default: 'Pendiente'
  },
  proximaCita: Date,
  actividad: [actividadSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar fecha de modificación antes de guardar
pacienteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Paciente', pacienteSchema);
