import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';

const productRoutes = Router();
const productController = new ProductController();

// GET /api/products
productRoutes.get('/', productController.index);

export { productRoutes };