import express from 'express';
import Cita from '../models/Cita.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

// GET: Obtener todas las citas del usuario autenticado
router.get('/', protegerRuta, async (req, res) => {
  try {
    const citas = await Cita.find({ usuario: req.usuario._id })
      .sort({ fecha: 1 })
      .exec();
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener citas de un rango de fechas
router.get('/rango/:desde/:hasta', protegerRuta, async (req, res) => {
  try {
    const desde = new Date(req.params.desde);
    const hasta = new Date(req.params.hasta);

    const citas = await Cita.find({
      usuario: req.usuario._id,
      fecha: { $gte: desde, $lte: hasta }
    })
      .sort({ fecha: 1 })
      .exec();

    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener una cita específica
router.get('/:id', protegerRuta, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Verificar que la cita pertenece al usuario
    if (cita.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json(cita);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Crear una nueva cita
router.post('/', protegerRuta, async (req, res) => {
  try {
    const { paciente, tratamiento, fecha, hora, notas, telefono, email, reminderMethod } = req.body;

    // Validaciones
    if (!paciente || !tratamiento || !fecha || !hora) {
      return res.status(400).json({
        error: 'Paciente, tratamiento, fecha y hora son requeridos'
      });
    }

    // Crear fecha-hora completa
    const [hours, minutes] = hora.split(':');
    const fechaCompleta = new Date(fecha);
    fechaCompleta.setHours(parseInt(hours), parseInt(minutes), 0);

    // Validar que la fecha sea futura
    if (fechaCompleta < new Date()) {
      return res.status(400).json({ error: 'No puedes agendar citas en el pasado' });
    }

    // Evitar solapamientos: comprobar si ya existe una cita en la misma fecha/hora para el mismo usuario
    const conflicto = await Cita.findOne({ usuario: req.usuario._id, fecha: fechaCompleta }).exec();
    if (conflicto) {
      return res.status(409).json({ error: 'Ya existe una cita en ese horario' });
    }

    const nuevaCita = new Cita({
      usuario: req.usuario._id,
      paciente,
      tratamiento,
      fecha: fechaCompleta,
      hora,
      notas,
      telefono,
      email
    });

    // Programar recordatorio 24 horas antes si el usuario desea
    const reminderAt = new Date(fechaCompleta);
    reminderAt.setHours(reminderAt.getHours() - 24);
    nuevaCita.reminderScheduledAt = reminderAt;
    nuevaCita.reminderMethod = reminderMethod || 'email';

    await nuevaCita.save();
    res.status(201).json({
      mensaje: 'Cita creada exitosamente',
      cita: nuevaCita
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Horarios disponibles para una fecha
// Query params: fecha=YYYY-MM-DD, slot=minutes (por defecto 30), order=popular|spread
router.get('/horarios', protegerRuta, async (req, res) => {
  try {
    const { fecha, slot = 30, order = 'popular' } = req.query;
    if (!fecha) return res.status(400).json({ error: 'Parametro fecha requerido (YYYY-MM-DD)' });

    const fechaStart = new Date(fecha + 'T00:00:00');
    const fechaEnd = new Date(fecha + 'T23:59:59');

    // Define horario laboral (puedes exponer en config/env)
    const workStartHour = parseInt(process.env.WORK_START_HOUR || '9');
    const workEndHour = parseInt(process.env.WORK_END_HOUR || '18');

    const slots = [];
    for (let h = workStartHour; h < workEndHour; h++) {
      for (let m = 0; m < 60; m += parseInt(slot)) {
        const s = new Date(fechaStart);
        s.setHours(h, m, 0, 0);
        if (s >= new Date()) slots.push(s);
      }
    }

    // Obtener citas existentes de ese día para el usuario
    const existing = await Cita.find({ usuario: req.usuario._id, fecha: { $gte: fechaStart, $lte: fechaEnd } }).exec();

    // Historial: contar demanda por hora:minuto en últimos 30 días
    const pasado = new Date();
    pasado.setDate(pasado.getDate() - 30);
    const hist = await Cita.aggregate([
      { $match: { usuario: req.usuario._id, fecha: { $gte: pasado } } },
      { $group: { _id: '$hora', count: { $sum: 1 } } }
    ]).exec();
    const histMap = {};
    hist.forEach(h => { histMap[h._id] = h.count; });

    const result = slots.map(s => {
      const horaStr = s.toTimeString().slice(0,5);
      const occupied = existing.some(ex => new Date(ex.fecha).getHours() === s.getHours() && new Date(ex.fecha).getMinutes() === s.getMinutes());
      return { time: horaStr, iso: s.toISOString(), occupied, count: histMap[horaStr] || 0 };
    }).filter(r => !r.occupied);

    // Ordenar según demanda (popular por defecto: mayor count primero)
    if (order === 'popular') result.sort((a,b) => b.count - a.count);
    else if (order === 'spread') result.sort((a,b) => a.count - b.count);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Editar una cita
router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Verificar pertenencia
    if (cita.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { paciente, tratamiento, fecha, hora, notas, telefono, email, estado } = req.body;

    // Actualizar campos
    if (paciente) cita.paciente = paciente;
    if (tratamiento) cita.tratamiento = tratamiento;
    if (telefono) cita.telefono = telefono;
    if (email) cita.email = email;
    if (notas !== undefined) cita.notas = notas;
    if (estado) cita.estado = estado;

    // Actualizar fecha y hora
    if (fecha && hora) {
      const [hours, minutes] = hora.split(':');
      const fechaCompleta = new Date(fecha);
      fechaCompleta.setHours(parseInt(hours), parseInt(minutes), 0);

      if (fechaCompleta < new Date()) {
        return res.status(400).json({ error: 'No puedes agendar citas en el pasado' });
      }

      cita.fecha = fechaCompleta;
      cita.hora = hora;
      // actualizar recordatorio 24h antes
      const reminderAt = new Date(fechaCompleta);
      reminderAt.setHours(reminderAt.getHours() - 24);
      cita.reminderScheduledAt = reminderAt;
    }

    await cita.save();
    res.json({
      mensaje: 'Cita actualizada exitosamente',
      cita
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Cambiar estado de la cita
router.patch('/:id/estado', protegerRuta, async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado || !['pendiente', 'confirmada', 'cancelada', 'completada'].includes(estado)) {
      return res.status(400).json({
        error: 'Estado inválido. Debe ser: pendiente, confirmada, cancelada o completada'
      });
    }

    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (cita.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    cita.estado = estado;
    await cita.save();

    res.json({
      mensaje: `Cita ${estado} exitosamente`,
      cita
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Cancelar/Eliminar una cita
router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (cita.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await Cita.findByIdAndDelete(req.params.id);

    res.json({ mensaje: 'Cita eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener citas del día
router.get('/dia/:fecha', protegerRuta, async (req, res) => {
  try {
    const fecha = new Date(req.params.fecha);
    const proximoDia = new Date(fecha);
    proximoDia.setDate(proximoDia.getDate() + 1);

    const citas = await Cita.find({
      usuario: req.usuario._id,
      fecha: { $gte: fecha, $lt: proximoDia }
    })
      .sort({ hora: 1 })
      .exec();

    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET /api/citas/ocupadas
router.get("/ocupadas", async (req, res) => {
  try {
    const citas = await Cita.find(); // Trae todas o solo futuras
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

export default router;
