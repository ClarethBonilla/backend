import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const router = express.Router();

export const generarToken = (usuarioId, rol) => {
  return jwt.sign({ id: usuarioId, rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Registro
router.post('/registro', async (req, res, next) => {
  try {
    const { nombre, email, contraseña, rol} = req.body;

    if (!nombre || !email || !contraseña || !rol) {
      return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos' });
    }

    let usuario = await Usuario.findOne({ email });
    if (usuario) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const salt = await bcryptjs.genSalt(10);
    const contraseñaEncriptada = await bcryptjs.hash(contraseña, salt);

    usuario = new Usuario({
      nombre,
      email,
      contraseña: contraseñaEncriptada,
      rol 
    });

    await usuario.save();

    const token = generarToken(usuario._id, usuario.rol);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await Usuario.findOne({ email }).select('+contraseña');
    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña inválidos' });
    }

    const esValida = await bcryptjs.compare(contraseña, usuario.contraseña);
    if (!esValida) {
      return res.status(401).json({ error: 'Email o contraseña inválidos' });
    }

    const token = generarToken(usuario._id, usuario.rol);

    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Obtener perfil
router.get('/perfil', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    next(error);
  }
});

export default router;
