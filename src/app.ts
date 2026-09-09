import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { orderRoutes } from './routes/order.routes';
import { productRoutes } from './routes/product.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { kitRoutes } from './routes/kit.routes';
import { customerRoutes } from './routes/customer.routes';
import { contactRoutes } from './routes/contact.routes';
import { interactionRoutes } from './routes/interaction.routes';
import { requestLogger } from './middlewares/logging.middleware';

import { AppError } from './errors/AppError';

const app: Application = express();

// Trust reverse proxy (e.g., Render / Cloudflare) so express-rate-limit captures real IP
app.set('trust proxy', 1);

// Global Middlewares
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:3000").split(",");
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError("Not allowed by CORS policy", 403));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(requestLogger);

// Healthcheck endpoint (BEFORE rate limiter)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Rate limiting against brute-force attacks on API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Add your other routes here...
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/interactions', interactionRoutes);

// Global Error Handler MUST be the last middleware
app.use(errorHandler);

export default app;