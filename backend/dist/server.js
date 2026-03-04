import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes.js';
import { AppDataSource } from './config/data-source.js';
dotenv.config();
const { PORT = '4000', FRONTEND_ORIGIN = 'http://localhost:5173,https://localhost:5173' } = process.env;
async function bootstrap() {
    await AppDataSource.initialize();
    const app = express();
    app.use(cors({
        origin: FRONTEND_ORIGIN.split(',').map((o) => o.trim()),
        credentials: true,
    }));
    app.use(express.json({ limit: '2mb' }));
    app.get('/health', (_req, res) => res.json({ ok: true }));
    app.use('/api', router);
    app.listen(parseInt(PORT, 10), () => {
        console.log(`API escuchando en puerto ${PORT}`);
    });
}
bootstrap().catch((err) => {
    console.error('Error iniciando el backend', err);
    process.exit(1);
});
