import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { orderRoutes } from './routes/order.routes';
import { productRoutes } from './routes/product.routes';
import { requestLogger } from './middlewares/logging.middleware';

const app: Application = express();

// Middlewares Globais
app.use(helmet()); // Segurança
app.use(cors()); // Permite acesso do frontend
app.use(express.json()); // Parse de JSON no body
app.use(requestLogger); // Logging middleware

// Exemplo de Rota com validação Zod
app.post('/api/users', (req: Request, res: Response) => {
  // Define o schema do que esperamos receber
  const userSchema = z.object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    age: z.number().int().positive().optional(),
  });

  try {
    // Valida o body da requisição
    const validatedData = userSchema.parse(req.body);
    
    // Se passou, prossegue com a lógica (ex: salvar no banco)
    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      data: validatedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.issues });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Rota de Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Add your other routes here...
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// Global Error Handler MUST be the last middleware
app.use(errorHandler);

export default app;