import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ProductController } from '../controllers/ProductController';
import { ProductRepository } from '../repositories/ProductRepository';
import { SearchProductsService } from '../services/SearchProductsService';
import { CreateProductService } from '../services/CreateProductService';
import { UpdateProductService } from '../services/UpdateProductService';
import { UpdateProductStockService } from '../services/UpdateProductStockService';
import { DeleteProductService } from '../services/DeleteProductService';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const productRepository = new ProductRepository(prisma);
const searchService = new SearchProductsService(productRepository);
const createService = new CreateProductService(productRepository);
const updateService = new UpdateProductService(productRepository);
const updateStockService = new UpdateProductStockService(productRepository);
const deleteService = new DeleteProductService(productRepository);

const productRoutes = Router();
const productController = new ProductController(
  searchService,
  createService,
  updateService,
  updateStockService,
  deleteService
);

// GET /api/products
productRoutes.get('/', (req, res) => productController.index(req, res));

// POST /api/products
productRoutes.post('/', (req, res) => productController.create(req, res));

// PUT /api/products/:id
productRoutes.put('/:id', (req, res) => productController.update(req, res));

// PATCH /api/products/:id/stock
productRoutes.patch('/:id/stock', (req, res) => productController.updateStock(req, res));

// DELETE /api/products/:id
productRoutes.delete('/:id', (req, res) => productController.delete(req, res));

export { productRoutes };