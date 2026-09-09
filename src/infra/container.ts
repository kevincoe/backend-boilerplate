import { prisma } from "./database";

// Repositories
import { ProductRepository } from "../repositories/ProductRepository";
import { OrderRepository } from "../repositories/OrderRepository";
import { KitRepository } from "../repositories/KitRepository";
import { AssetRepository } from "../repositories/AssetRepository";
import { CustomerRepository } from "../repositories/CustomerRepository";
import { DashboardRepository } from "../repositories/DashboardRepository";
import { ContactRepository } from "../repositories/ContactRepository";
import { InteractionRepository } from "../repositories/InteractionRepository";
import { MaintenanceLogRepository } from "../repositories/MaintenanceLogRepository";

export const productRepository = new ProductRepository(prisma);
export const orderRepository = new OrderRepository(prisma);
export const kitRepository = new KitRepository(prisma);
export const assetRepository = new AssetRepository(prisma);
export const customerRepository = new CustomerRepository(prisma);
export const dashboardRepository = new DashboardRepository(prisma);
export const contactRepository = new ContactRepository(prisma);
export const interactionRepository = new InteractionRepository(prisma);
export const maintenanceLogRepository = new MaintenanceLogRepository(prisma);

// Order Services
import { CreateQuoteService } from "../services/CreateQuoteService";
import { ConfirmOrderService } from "../services/ConfirmOrderService";
import { FinishOrderService } from "../services/FinishOrderService";
import { ListOrdersService } from "../services/ListOrdersService";
import { UpdateOrderService } from "../services/UpdateOrderService";
import { DeleteOrderService } from "../services/DeleteOrderService";

export const createQuoteService = new CreateQuoteService(
  orderRepository,
  assetRepository,
  customerRepository,
  productRepository,
);
export const confirmOrderService = new ConfirmOrderService(orderRepository);
export const finishOrderService = new FinishOrderService(orderRepository);
export const listOrdersService = new ListOrdersService(orderRepository);
export const updateOrderService = new UpdateOrderService(orderRepository);
export const deleteOrderService = new DeleteOrderService(orderRepository);

// Product Services
import { SearchProductsService } from "../services/SearchProductsService";
import { CreateProductService } from "../services/CreateProductService";
import { UpdateProductService } from "../services/UpdateProductService";
import { UpdateProductStockService } from "../services/UpdateProductStockService";
import { DeleteProductService } from "../services/DeleteProductService";

export const searchProductsService = new SearchProductsService(productRepository);
export const createProductService = new CreateProductService(productRepository);
export const updateProductService = new UpdateProductService(productRepository);
export const updateProductStockService = new UpdateProductStockService(productRepository);
export const deleteProductService = new DeleteProductService(productRepository);

// Kit Services
import { CreateKitService } from "../services/CreateKitService";
import { ListKitsService } from "../services/ListKitsService";
import { ToggleFavoriteKitService } from "../services/ToggleFavoriteKitService";

export const createKitService = new CreateKitService(kitRepository);
export const listKitsService = new ListKitsService(kitRepository);
export const toggleFavoriteKitService = new ToggleFavoriteKitService(kitRepository);

// Dashboard Services
import { GetDashboardStatsService } from "../services/GetDashboardStatsService";

export const getDashboardStatsService = new GetDashboardStatsService(dashboardRepository);

// Customer Services
import { CreateCustomerService } from "../services/CreateCustomerService";
import { GetCustomer360Service } from "../services/GetCustomer360Service";
import { ListCustomersService } from "../services/ListCustomersService";
import { UpdateCustomerService } from "../services/UpdateCustomerService";
import { DeleteCustomerService } from "../services/DeleteCustomerService";

export const createCustomerService = new CreateCustomerService(customerRepository);
export const getCustomer360Service = new GetCustomer360Service(customerRepository);
export const listCustomersService = new ListCustomersService(customerRepository);
export const updateCustomerService = new UpdateCustomerService(customerRepository);
export const deleteCustomerService = new DeleteCustomerService(customerRepository);

// Contact Services
import { CreateContactService } from "../services/CreateContactService";
import { ListContactsByCustomerService } from "../services/ListContactsByCustomerService";
import { UpdateContactService } from "../services/UpdateContactService";
import { DeleteContactService } from "../services/DeleteContactService";

export const createContactService = new CreateContactService(contactRepository, customerRepository);
export const listContactsByCustomerService = new ListContactsByCustomerService(contactRepository);
export const updateContactService = new UpdateContactService(contactRepository);
export const deleteContactService = new DeleteContactService(contactRepository);

// Interaction Services
import { CreateInteractionService } from "../services/CreateInteractionService";
import { ListInteractionsByCustomerService } from "../services/ListInteractionsByCustomerService";
import { DeleteInteractionService } from "../services/DeleteInteractionService";

export const createInteractionService = new CreateInteractionService(interactionRepository, customerRepository);
export const listInteractionsByCustomerService = new ListInteractionsByCustomerService(interactionRepository);
export const deleteInteractionService = new DeleteInteractionService(interactionRepository);

// Controllers
import { OrderController } from "../controllers/OrderController";
import { ProductController } from "../controllers/ProductController";
import { KitController } from "../controllers/KitController";
import { DashboardController } from "../controllers/DashboardController";
import { CustomerController } from "../controllers/CustomerController";
import { ContactController } from "../controllers/ContactController";
import { InteractionController } from "../controllers/InteractionController";

export const orderController = new OrderController(
  createQuoteService,
  confirmOrderService,
  finishOrderService,
  listOrdersService,
  updateOrderService,
  deleteOrderService,
);

export const productController = new ProductController(
  searchProductsService,
  createProductService,
  updateProductService,
  updateProductStockService,
  deleteProductService,
);

export const kitController = new KitController(
  createKitService,
  listKitsService,
  toggleFavoriteKitService,
);

export const dashboardController = new DashboardController(getDashboardStatsService);

export const customerController = new CustomerController(
  createCustomerService,
  getCustomer360Service,
  listCustomersService,
  updateCustomerService,
  deleteCustomerService,
);

export const contactController = new ContactController(
  createContactService,
  listContactsByCustomerService,
  updateContactService,
  deleteContactService,
);

export const interactionController = new InteractionController(
  createInteractionService,
  listInteractionsByCustomerService,
  deleteInteractionService,
);
