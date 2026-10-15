import mongoose from "mongoose";
import Customer from "../Models/customer.model.js";
import Product from "../Models/product.model.js";

const populatedCart = async (customerId) => {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: "name description price category image stock",
  });

  return (customer?.cart ?? [])
    .filter((item) => item.product)
    .map((item) => ({ product: item.product, quantity: item.quantity }));
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const customer = await Customer.findById(req.user._id);
    if (!customer) return res.status(401).json({ message: "User is not authenticated" });

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId,
    );
    const nextQuantity = (cartItem?.quantity ?? 0) + 1;

    if (nextQuantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} unit(s) are in stock` });
    }

    if (cartItem) cartItem.quantity = nextQuantity;
    else customer.cart.push({ product: product._id, quantity: 1 });

    await customer.save();
    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: await populatedCart(customer._id),
    });
  } catch (error) {
    console.error("Add to cart failed:", error);
    return res.status(500).json({ message: "Unable to update the cart" });
  }
};

const getCart = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      cart: await populatedCart(req.user._id),
    });
  } catch (error) {
    console.error("Get cart failed:", error);
    return res.status(500).json({ message: "Unable to load the cart" });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be a whole number of at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (quantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} unit(s) are in stock` });
    }

    const customer = await Customer.findById(req.user._id);
    const cartItem = customer?.cart.find(
      (item) => item.product.toString() === productId,
    );
    if (!cartItem) return res.status(404).json({ message: "Product is not in the cart" });

    cartItem.quantity = quantity;
    await customer.save();
    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: await populatedCart(customer._id),
    });
  } catch (error) {
    console.error("Update cart quantity failed:", error);
    return res.status(500).json({ message: "Unable to update the cart" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const customer = await Customer.findById(req.user._id);
    const hasItem = customer?.cart.some(
      (item) => item.product.toString() === productId,
    );
    if (!hasItem) return res.status(404).json({ message: "Product is not in the cart" });

    customer.cart = customer.cart.filter(
      (item) => item.product.toString() !== productId,
    );
    await customer.save();
    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: await populatedCart(customer._id),
    });
  } catch (error) {
    console.error("Remove from cart failed:", error);
    return res.status(500).json({ message: "Unable to remove the product" });
  }
};

export { addToCart, getCart, updateCartQuantity, removeFromCart };
