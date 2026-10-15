# ShopKart

ShopKart is a full-stack shopping app built with React, Express, and MongoDB. It includes customer accounts, a product catalog, a wishlist, a shopping cart, checkout with Razorpay Test Mode, and order history.

## Requirements

- Node.js and npm
- MongoDB (local MongoDB or MongoDB Atlas)
- Razorpay Test Mode API keys for checkout testing

## Setup

### 1. Configure the backend

From the project root, install the backend dependencies:

```powershell
npm install
```

Copy `Server/.env.example` to `Server/.env`, then set your own values:

```powershell
Copy-Item Server/.env.example Server/.env
```

Set `dbUrl` to your MongoDB connection string, create a private `JWT_SECRET`, and add your Razorpay **Test Mode** Key ID and Key Secret. Keep the secret values in `.env`; never commit them.

Start the backend from the project root:

```powershell
npm run dev
```

The API listens on `http://localhost:8000` by default.

### 2. Configure the frontend

Open a second terminal and install the frontend dependencies:

```powershell
cd Client/vite-project
npm install
```

Optionally copy the frontend environment template:

```powershell
Copy-Item .env.example .env
```

Start the frontend:

```powershell
npm run dev
```

Vite prints the local site URL, usually `http://localhost:5173`. The frontend API defaults to `http://localhost:8000`; set `VITE_API_BASE_URL` in `Client/vite-project/.env` only if the backend uses another URL.

### 3. Add catalog products

The project does not include a product seed script. To add a product to an empty database, send a `POST` request to `http://localhost:8000/products` with JSON like this:

```json
{
  "name": "Demo keyboard",
  "description": "A sample product for testing the catalog.",
  "price": 2999,
  "category": "Accessories",
  "image": "https://example.com/keyboard.jpg",
  "stock": 10
}
```

You can send this request from Postman. The product list reads its data from MongoDB.

## Payment testing

Checkout uses Razorpay Test Mode. Test transactions do not charge real money. Use Razorpay's supported test payment details to simulate a successful or failed payment. A successful checkout is verified by the backend before the order is marked paid. See [Razorpay's Test Mode guide](https://razorpay.com/docs/server-integration/python/test-app/).

## Deploy to Vercel

The repository root contains the Express entrypoint that Vercel deploys as a Function. The Vite build writes the React site to the root `public/` directory, so Vercel serves the frontend from its CDN and the API from the same origin.

1. Push the latest `main` branch to GitHub, then import `Shanawaaz-Mallick/ShopKart` in Vercel.
2. Keep the project **Root Directory** set to the repository root (`.`). Use the root `package.json` build script (`npm run build`); it installs the frontend dependencies and builds the Vite app.
3. Add these environment variables for Production (and Preview if you will use preview deployments):
   - `dbUrl` — MongoDB Atlas connection string.
   - `JWT_SECRET` — a long, random private signing secret.
   - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` — Razorpay **Test Mode** credentials.
4. Redeploy after saving environment variables. The frontend uses `/api` automatically, so `VITE_API_BASE_URL` is not required.
5. Open the Vercel deployment and visit `/api/health`; it should return `success: true` and `database: "connected"`.

Never put database, JWT, or Razorpay secrets in a `VITE_` variable or commit them to GitHub. Vercel must be able to connect to MongoDB Atlas; configure Atlas Network Access appropriately and use strong database credentials.

## Main API routes

| Feature | Routes |
| --- | --- |
| Customers | `POST /customers/register`, `POST /customers/login`, `GET /customers/me`, `POST /customers/logout` |
| Products | `GET /products`, `GET /products/:id`, `POST /products` |
| Wishlist | `GET /wishlist`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId` |
| Cart | `GET /cart`, `POST /cart/:productId`, `PATCH /cart/:productId`, `DELETE /cart/:productId` |
| Orders | `POST /orders/create-payment-order`, `POST /orders/verify-payment`, `GET /orders`, `GET /orders/:id` |

Wishlist, cart, and order routes require a logged-in customer. Login uses an HTTP-only cookie.

## Project folders

- `Server/` — Express API, MongoDB models, authentication, and Razorpay integration.
- `Client/vite-project/` — React and Vite frontend.

## Before publishing

- Keep `Server/.env` and `Client/vite-project/.env` out of GitHub. The root `.gitignore` excludes them.
- Commit the `.env.example` templates, which contain placeholders only.
- Use Test Mode keys for the lab demo. Do not publish API secrets in source code, screenshots, or README files.
