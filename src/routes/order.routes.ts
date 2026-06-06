import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { OrderController } from '../controllers/order.controller';
import { CreateQuoteService } from '../services/CreateQuoteService';
import { ConfirmOrderService } from '../services/ConfirmOrderService';
import { OrderRepository } from '../repositories/OrderRepository';
import { AssetRepository } from '../repositories/AssetRepository';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const orderRepository = new OrderRepository(prisma);
const assetRepository = new AssetRepository(prisma);

const createQuoteService = new CreateQuoteService(orderRepository, assetRepository);
const confirmOrderService = new ConfirmOrderService(orderRepository);

const orderController = new OrderController(createQuoteService, confirmOrderService);

export const orderRoutes = Router();

orderRoutes.post('/quotes', (req, res, next) => orderController.createQuote(req, res, next));
orderRoutes.post('/:orderId/confirm', (req, res, next) => orderController.confirmOrder(req, res, next));