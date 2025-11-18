import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/misonrisa');
    console.log('✓ Conectado a MongoDB');
  } catch (error) {
    console.error('✗ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

export const desconectarDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB');
  } catch (error) {
    console.error('✗ Error desconectando de MongoDB:', error.message);
  }
};
