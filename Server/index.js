import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import customerRoutes from "./Routes/customer.routes.js";
import productRoutes from "./Routes/product.routes.js";
import wishlistRoutes from "./Routes/wishlist.routes.js";
import cartRoutes from "./Routes/cart.routes.js";
import orderRoutes from "./Routes/order.routes.js";

// Load .env from this file's own folder (Server/), not from whatever
// directory the process happens to be started in. This is what was
// causing "dbUrl" and "JWT_SECRET" to come through as undefined when
// the server was launched from the project root.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

const app = express();

const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

const mountApiRoutes = (prefix) => {
  app.use(`${prefix}/customers`, customerRoutes);
  app.use(`${prefix}/products`, productRoutes);
  app.use(`${prefix}/wishlist`, wishlistRoutes);
  app.use(`${prefix}/cart`, cartRoutes);
  app.use(`${prefix}/orders`, orderRoutes);
};

mountApiRoutes("/api");

// Keep the original paths working for the existing local Vite setup.
if (process.env.NODE_ENV !== "production") {
  mountApiRoutes("");
}

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    success: connected,
    database: connected ? "connected" : "disconnected",
  });
});

if (process.env.NODE_ENV === "production") {
  const clientBuildPath = join(__dirname, "../Client/vite-project/dist");
  app.use(express.static(clientBuildPath));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res, next) => {
    res.sendFile(join(clientBuildPath, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

const startServer = async () => {
  try {
    await mongoose.connect(process.env.dbUrl);
    console.log("DB Connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server started at ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
