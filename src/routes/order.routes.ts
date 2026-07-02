import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { OrderController } from '../controllers/order.controller';
import { CreateQuoteService } from '../services/CreateQuoteService';
import { ConfirmOrderService } from '../services/ConfirmOrderService';
import { FinishOrderService } from '../services/FinishOrderService';
import { ListOrdersService } from '../services/ListOrdersService';
import { UpdateOrderService } from '../services/UpdateOrderService';
import { DeleteOrderService } from '../services/DeleteOrderService';
import { OrderRepository } from '../repositories/OrderRepository';
import { AssetRepository } from '../repositories/AssetRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { ProductRepository } from '../repositories/ProductRepository';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const orderRepository = new OrderRepository(prisma);
const assetRepository = new AssetRepository(prisma);
const customerRepository = new CustomerRepository(prisma);
const productRepository = new ProductRepository(prisma);

const createQuoteService = new CreateQuoteService(orderRepository, assetRepository, customerRepository, productRepository);
const confirmOrderService = new ConfirmOrderService(orderRepository);
const finishOrderService = new FinishOrderService(orderRepository);
const listOrdersService = new ListOrdersService(orderRepository);
const updateOrderService = new UpdateOrderService(orderRepository);
const deleteOrderService = new DeleteOrderService(orderRepository);

const orderController = new OrderController(createQuoteService, confirmOrderService, finishOrderService, listOrdersService, updateOrderService, deleteOrderService);

export const orderRoutes = Router();

orderRoutes.post('/quotes', (req, res, next) => orderController.createQuote(req, res, next));
orderRoutes.post('/:orderId/confirm', (req, res, next) => orderController.confirmOrder(req, res, next));
orderRoutes.post('/:id/finish', (req, res, next) => orderController.finishOrder(req, res, next));
orderRoutes.get('/', (req, res, next) => orderController.listOrders(req, res, next));
orderRoutes.put('/:id', (req, res, next) => orderController.update(req, res, next));
orderRoutes.delete('/:id', (req, res, next) => orderController.delete(req, res, next));