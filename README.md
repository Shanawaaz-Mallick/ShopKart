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

## Deploy to Render

The included `render.yaml` deploys the Express server and built React site as one web service. This keeps the browser and API on the same origin, which allows the login cookie to work without cross-site cookie settings.

1. Push the latest `main` branch to GitHub.
2. In Render, choose **New → Blueprint** and connect the `ShopKart` GitHub repository. Render reads the service configuration from `render.yaml`.
3. When prompted, enter `dbUrl` and your Razorpay **Test Mode** `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Render generates `JWT_SECRET`; do not put secret values in `render.yaml` or GitHub.
4. If MongoDB Atlas is in use, add the deployed app's outbound addresses to Atlas **Network Access**. Atlas only accepts cluster connections from addresses on the project's IP access list. Avoid `0.0.0.0/0` unless you understand that it allows connection attempts from anywhere; use strong database credentials if a broad rule is temporarily required.
5. Wait for the Render deploy to finish, then open the service URL. Check `<service-url>/api/health`; it should report that the database is connected.

The free Render web service can spin down after inactivity, so its first request after a quiet period may take longer. See [Render's free instance limitations](https://render.com/docs/free).

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
