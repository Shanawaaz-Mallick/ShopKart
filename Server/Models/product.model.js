import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0.01, "Price must be greater than 0"],
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
    },
  },
  // Only createdAt is needed for this lab, so updatedAt is switched off.
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
