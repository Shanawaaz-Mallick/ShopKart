import express from "express";
import { isAuthenticated } from "../Middlewares/auth.middleware.js";
import {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
} from "../Controllers/order.controller.js";

const orderRoutes = express.Router();

orderRoutes.use(isAuthenticated);
orderRoutes.post("/create-payment-order", createPaymentOrder);
orderRoutes.post("/verify-payment", verifyPayment);
orderRoutes.get("/", getMyOrders);
orderRoutes.get("/:id", getOrderById);

export default orderRoutes;
