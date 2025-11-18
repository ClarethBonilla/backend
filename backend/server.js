import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { conectarDB } from './config/db.js';
import { manejarErrores, notFound } from './middleware/errores.js';
import authRoutes from './routes/auth.js';
import pacientesRoutes from './routes/pacientes.js';
import citasRoutes from './routes/citas.js';
import { startReminderScheduler } from './utils/reminderScheduler.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a BD
conectarDB();

// Iniciar scheduler de recordatorios
startReminderScheduler();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ estado: 'OK', timestamp: new Date().toISOString() });
});

// Rutas no encontradas
app.use(notFound);

// Manejo de errores
app.use(manejarErrores);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en puerto ${PORT}`);
  console.log(`✓ Frontend esperado en: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
