import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { orderRoutes } from './routes/order.routes';
import { productRoutes } from './routes/product.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { requestLogger } from './middlewares/logging.middleware';

const app: Application = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100, // Limite de 100 requests por IP a cada 15 min
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});

// Middlewares Globais
app.use(helmet()); // Segurança
app.use(cors()); // Permite acesso do frontend
app.use(express.json()); // Parse de JSON no body
app.use(requestLogger); // Logging middleware
app.use(limiter); // Rate Limiting contra força bruta

// Rota de Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Add your other routes here...
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler MUST be the last middleware
app.use(errorHandler);

export default app;