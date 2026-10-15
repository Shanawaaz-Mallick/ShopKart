import express from "express";
import { isAuthenticated } from "../Middlewares/auth.middleware.js";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} from "../Controllers/cart.controller.js";

const cartRoutes = express.Router();

cartRoutes.use(isAuthenticated);
cartRoutes.post("/:productId", addToCart);
cartRoutes.get("/", getCart);
cartRoutes.patch("/:productId", updateCartQuantity);
cartRoutes.delete("/:productId", removeFromCart);

export default cartRoutes;
