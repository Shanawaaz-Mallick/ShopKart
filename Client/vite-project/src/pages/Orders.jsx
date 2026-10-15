import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Orders() {
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState({ version: -1, orders: [], error: "" });
  const loading = result.version !== reload;
  const orders = loading ? [] : result.orders;
  const error = loading ? "" : result.error;

  useEffect(() => {
    let isMounted = true;
    api
      .get("/orders")
      .then((response) => {
        if (isMounted) setResult({ version: reload, orders: response.data.orders, error: "" });
      })
      .catch((requestError) => {
        if (isMounted) {
          setResult({
            version: reload,
            orders: [],
            error: requestError.response?.data?.message || "Unable to load your orders.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reload]);

  return (
    <div className="products-screen">
      <Navbar />
      <main className="products-content">
        <h1>My Orders</h1>
        {loading && <p className="state-message">Loading your orders...</p>}
        {!loading && error && (
          <div className="state-message error">
            <p>{error}</p>
            <button type="button" className="btn-primary retry-button" onClick={() => setReload((n) => n + 1)}>
              Try Again
            </button>
          </div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="state-message">
            <p>You have not placed any orders yet.</p>
            <Link to="/products" className="btn-primary inline-button">Start Shopping</Link>
          </div>
        )}
        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div className="order-card-heading">
                  <div>
                    <span className="order-label">Order #{order._id}</span>
                    <p>{new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                  </div>
                  <span className={`order-status ${order.status.toLowerCase()}`}>{order.status.replaceAll("_", " ")}</span>
                </div>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={`${item.product}-${index}`}>{item.name} × {item.quantity}</li>
                  ))}
                </ul>
                <div className="order-card-footer">
                  <strong>Total: ₹{order.totalAmount.toLocaleString("en-IN")}</strong>
                  <Link to={`/orders/${order._id}`}>View Details</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Orders;
