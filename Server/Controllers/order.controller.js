import crypto from "crypto";
import mongoose from "mongoose";
import Customer from "../Models/customer.model.js";
import Order from "../Models/order.model.js";
import getRazorpayClient from "../config/razorpay.js";

const addressFields = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];

const validateShippingAddress = (address) => {
  if (!address || typeof address !== "object") return "Shipping address is required";

  const normalized = {};
  for (const field of addressFields) {
    if (typeof address[field] !== "string" || !address[field].trim()) {
      return `${field} is required`;
    }
    normalized[field] = address[field].trim();
  }

  if (!/^\d{10}$/.test(normalized.phone)) {
    return "Phone number must contain 10 digits";
  }
  if (!/^\d{6}$/.test(normalized.pincode)) {
    return "Pincode must contain 6 digits";
  }
  return normalized;
};

const createPaymentOrder = async (req, res) => {
  let shopKartOrder;

  try {
    const shippingAddress = validateShippingAddress(req.body.shippingAddress);
    if (typeof shippingAddress === "string") {
      return res.status(400).json({ message: shippingAddress });
    }

    let razorpayConfig;
    try {
      razorpayConfig = getRazorpayClient();
    } catch {
      return res.status(503).json({
        message: "Add Razorpay Test Mode keys to Server/.env before starting checkout.",
      });
    }

    const customer = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price image stock",
    });
    if (!customer) return res.status(401).json({ message: "User is not authenticated" });
    if (!customer.cart.length) return res.status(400).json({ message: "Your cart is empty" });

    const items = [];
    let totalAmount = 0;

    for (const cartItem of customer.cart) {
      const product = cartItem.product;
      if (!product) {
        return res.status(400).json({ message: "A product in your cart is no longer available" });
      }
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Only ${product.stock} unit(s) remain.`,
        });
      }

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });
      totalAmount += product.price * cartItem.quantity;
    }

    totalAmount = Number(totalAmount.toFixed(2));
    shopKartOrder = await Order.create({
      user: customer._id,
      items,
      shippingAddress,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    const razorpayOrder = await razorpayConfig.client.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: shopKartOrder._id.toString(),
    });

    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: razorpayConfig.keyId,
    });
  } catch (error) {
    if (shopKartOrder?._id) {
      await Order.deleteOne({ _id: shopKartOrder._id, paymentStatus: "PENDING" }).catch(
        (cleanupError) => console.error("Could not remove pending order:", cleanupError),
      );
    }
    console.error("Create payment order failed:", error);
    return res.status(502).json({
      message: "Unable to start payment. Your cart has not been changed.",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({ message: "Invalid ShopKart order ID" });
    }
    if (![razorpayOrderId, razorpayPaymentId, razorpaySignature].every(
      (value) => typeof value === "string" && value.length > 0,
    )) {
      return res.status(400).json({ message: "Payment details are incomplete" });
    }

    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: "Payment order does not match" });
    }
    if (order.paymentStatus === "PAID") {
      if (order.razorpayPaymentId !== razorpayPaymentId) {
        return res.status(409).json({ message: "This order has already been paid" });
      }
      return res.status(200).json({ success: true, message: "Payment already verified", order });
    }

    if (
      !process.env.RAZORPAY_KEY_SECRET ||
      !process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")
    ) {
      return res.status(503).json({ message: "Razorpay Test Mode keys are not configured" });
    }
    if (!/^[a-f\d]{64}$/i.test(razorpaySignature)) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpaySignature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed",
      order,
    });
  } catch (error) {
    console.error("Verify payment failed:", error);
    return res.status(500).json({ message: "Unable to verify payment" });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get orders failed:", error);
    return res.status(500).json({ message: "Unable to load orders" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Including the authenticated customer in the query prevents access to
    // another customer's order, even when its ID is known.
    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order failed:", error);
    return res.status(500).json({ message: "Unable to load the order" });
  }
};

export { createPaymentOrder, verifyPayment, getMyOrders, getOrderById };
