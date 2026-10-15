import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function OrderDetails({ success = false }) {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, order: null, error: "" });
  const loading = result.id !== id;
  const order = loading ? null : result.order;
  const error = loading ? "" : result.error;

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/orders/${id}`)
      .then((response) => {
        if (isMounted) setResult({ id, order: response.data.order, error: "" });
      })
      .catch((requestError) => {
        if (isMounted) {
          setResult({
            id,
            order: null,
            error: requestError.response?.data?.message || "Unable to load this order.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="products-screen">
      <Navbar />
      <main className="products-content order-detail-content">
        {loading && <p className="state-message">Loading order...</p>}
        {!loading && error && <p className="state-message error">{error}</p>}
        {!loading && !error && order && (
          <>
            {success && order.paymentStatus === "PAID" && (
              <div className="success-banner" role="status">
                <span>✓</span>
                <div><h1>Order placed successfully</h1><p>Your payment was verified and your order is saved.</p></div>
              </div>
            )}
            <section className="order-detail-card">
              <span className={`order-status ${order.status.toLowerCase()}`}>{order.status.replaceAll("_", " ")}</span>
              <h1>Order #{order._id}</h1>
              <p>Placed {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
              <h2>Items</h2>
              <div className="detail-items">
                {order.items.map((item, index) => (
                  <div className="summary-row" key={`${item.product}-${index}`}>
                    <span>{item.name} × {item.quantity}</span>
                    <strong>₹{(item.price * item.quantity).toLocaleString("en-IN")}</strong>
                  </div>
                ))}
              </div>
              <div className="summary-row total">
                <span>Total paid</span><strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
              </div>
              <h2>Shipping Address</h2>
              <p>
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.addressLine1}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                {order.shippingAddress.phone}
              </p>
              <div className="order-actions">
                <Link to="/orders">View My Orders</Link>
                <Link to="/products" className="btn-primary inline-button">Continue Shopping</Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default OrderDetails;
