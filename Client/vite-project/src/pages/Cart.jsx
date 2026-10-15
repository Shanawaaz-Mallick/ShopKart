import { Link } from "react-router-dom";
import CartItem from "../components/CartItem";
import Navbar from "../components/Navbar";
import { useCart } from "../context/useCart";

function Cart() {
  const { cartItems, cartCount, subtotal, loading, error, refreshCart } = useCart();

  return (
    <div className="products-screen">
      <Navbar />
      <main className="products-content">
        <h1>My Cart</h1>

        {loading && <p className="state-message">Loading your cart...</p>}

        {!loading && error && (
          <div className="state-message error">
            <p>{error === "User is not authenticated" ? "Please log in to view your cart." : "Unable to load your cart."}</p>
            <button type="button" className="btn-primary retry-button" onClick={refreshCart}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && cartItems.length === 0 && (
          <div className="state-message">
            <p className="empty-cart-icon">🛒</p>
            <p>Your cart is empty.</p>
            <p>Looks like you haven't added anything yet.</p>
            <Link to="/products" className="btn-primary inline-button">Browse Products</Link>
          </div>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="cart-layout">
            <div className="cart-list">
              {cartItems.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </div>
            <aside className="order-summary">
              <h2>Order Summary</h2>
              <div className="summary-row"><span>Items</span><span>{cartCount}</span></div>
              <div className="summary-row total">
                <span>Subtotal</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>
              <p className="summary-note">Shipping and final stock are confirmed at checkout.</p>
              <Link to="/checkout" className="btn-primary checkout-link">Proceed to Checkout</Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;
