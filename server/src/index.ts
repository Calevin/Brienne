import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env de la raíz del monorepo
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brienne';

// Middlewares
app.use(cors());
app.use(express.json());

// Routes (Por ahora un healthcheck de integración)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Guardajuramentos Server' });
});

// Iniciamos la BD y luego el servidor
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error on MongoDB Connection:', error);
    process.exit(1);
  }
};

startServer();
