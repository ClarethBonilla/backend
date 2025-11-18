import express from 'express';
import Paciente from '../models/Paciente.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los pacientes
router.get('/', protegerRuta, async (req, res, next) => {
  try {
    const pacientes = await Paciente.find().sort({ createdAt: -1 });
    res.json(pacientes);
  } catch (error) {
    next(error);
  }
});

// Obtener un paciente por ID
router.get('/:id', protegerRuta, async (req, res, next) => {
  try {
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(paciente);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo paciente
router.post('/', protegerRuta, async (req, res, next) => {
  try {
    const { nombre, ultimaCita, historia } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const paciente = new Paciente({
      nombre,
      ultimaCita: ultimaCita || new Date(),
      historia: historia || ''
    });

    await paciente.save();
    res.status(201).json(paciente);
  } catch (error) {
    next(error);
  }
});

// Actualizar un paciente
router.put('/:id', protegerRuta, async (req, res, next) => {
  try {
    const { nombre, ultimaCita, historia, consultaFecha, tratamientoTipo, tratamientoEstado, proximaCita } = req.body;

    const paciente = await Paciente.findByIdAndUpdate(
      req.params.id,
      {
        nombre: nombre || undefined,
        ultimaCita: ultimaCita || undefined,
        historia: historia !== undefined ? historia : undefined,
        consultaFecha: consultaFecha || undefined,
        tratamientoTipo: tratamientoTipo || undefined,
        tratamientoEstado: tratamientoEstado || undefined,
        proximaCita: proximaCita || undefined
      },
      { new: true, runValidators: true }
    );

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json(paciente);
  } catch (error) {
    next(error);
  }
});

// Eliminar un paciente
router.delete('/:id', protegerRuta, async (req, res, next) => {
  try {
    const paciente = await Paciente.findByIdAndDelete(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json({ mensaje: 'Paciente eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

// Agregar actividad a un paciente
router.post('/:id/actividades', protegerRuta, async (req, res, next) => {
  try {
    const { titulo, fecha, notas } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    paciente.actividad.push({
      titulo,
      fecha: fecha || new Date(),
      notas: notas || ''
    });

    await paciente.save();
    res.status(201).json(paciente);
  } catch (error) {
    next(error);
  }
});

// Actualizar una actividad
router.put('/:id/actividades/:actId', protegerRuta, async (req, res, next) => {
  try {
    const { titulo, fecha, notas } = req.body;

    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const actividad = paciente.actividad.id(req.params.actId);
    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    if (titulo) actividad.titulo = titulo;
    if (fecha) actividad.fecha = fecha;
    if (notas) actividad.notas = notas;

    await paciente.save();
    res.json(paciente);
  } catch (error) {
    next(error);
  }
});

// Eliminar una actividad
router.delete('/:id/actividades/:actId', protegerRuta, async (req, res, next) => {
  try {
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    paciente.actividad.id(req.params.actId).deleteOne();
    await paciente.save();
    res.json({ mensaje: 'Actividad eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
