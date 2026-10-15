import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/useCart";
import api from "../services/api";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
};

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existingScript = document.getElementById("razorpay-checkout-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Checkout() {
  const navigate = useNavigate();
  const {
    cartItems,
    subtotal,
    loading: cartLoading,
    error: cartError,
    refreshCart,
    clearCart,
  } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    for (const [field, value] of Object.entries(address)) {
      if (!value.trim()) nextErrors[field] = "This field is required";
    }
    if (address.phone.trim() && !/^\d{10}$/.test(address.phone.trim())) {
      nextErrors.phone = "Enter a valid 10-digit phone number";
    }
    if (address.pincode.trim() && !/^\d{6}$/.test(address.pincode.trim())) {
      nextErrors.pincode = "Pincode must contain 6 digits";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay Checkout. Check your internet connection and try again.");
      }

      // The backend uses only the shipping details and calculates prices from
      // current Product records; the frontend subtotal is display-only.
      const { data } = await api.post("/orders/create-payment-order", {
        shippingAddress: Object.fromEntries(
          Object.entries(address).map(([field, value]) => [field, value.trim()]),
        ),
      });


      const paymentObject = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart order payment",
        order_id: data.razorpayOrderId,
        prefill: { name: address.fullName.trim(), contact: address.phone.trim() },
        handler: async (paymentResponse) => {
          try {
            await api.post("/orders/verify-payment", {
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });
            clearCart();
            navigate(`/order-success/${data.shopKartOrderId}`, { replace: true });
          } catch (verificationError) {
            setServerError(
              verificationError.response?.data?.message ||
                "Payment could not be verified. Your cart has been kept; contact support before trying again.",
            );
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setServerError("Checkout was closed. Your cart is unchanged.");
          },
        },
        theme: { color: "#17332c" },
      });

      paymentObject.on("payment.failed", () => {
        setSubmitting(false);
        setServerError("Payment failed. Your cart is unchanged; please try again.");
      });
      paymentObject.open();
    } catch (error) {
      setServerError(
        error.response?.data?.message || error.message || "Unable to start checkout. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="products-screen">
      <Navbar />
      <main className="products-content checkout-content">
        <h1>Checkout</h1>
        {cartLoading && <p className="state-message">Loading your cart...</p>}
        {!cartLoading && cartError && (
          <div className="state-message error">
            <p>{cartError}</p>
            <button type="button" className="btn-primary retry-button" onClick={refreshCart}>
              Try Again
            </button>
            <Link to="/login" className="back-to-cart">Log in</Link>
          </div>
        )}
        {!cartLoading && !cartError && cartItems.length === 0 && (
          <div className="state-message">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn-primary inline-button">Browse Products</Link>
          </div>
        )}
        {!cartLoading && !cartError && cartItems.length > 0 && (
          <div className="checkout-layout">
            <form className="checkout-panel" onSubmit={handleSubmit} noValidate>
              <h2>Shipping Details</h2>
              {serverError && <div className="form-banner error" role="alert">{serverError}</div>}
              <div className="checkout-fields">
                {[
                  ["fullName", "Full name", "text", "name"],
                  ["phone", "Phone number", "tel", "tel"],
                  ["addressLine1", "Address line", "text", "street-address"],
                  ["city", "City", "text", "address-level2"],
                  ["state", "State", "text", "address-level1"],
                  ["pincode", "Pincode", "text", "postal-code"],
                ].map(([name, label, type, autoComplete]) => (
                  <div className="field" key={name}>
                    <label htmlFor={name}>{label}</label>
                    <input
                      id={name}
                      name={name}
                      type={type}
                      value={address[name]}
                      onChange={handleChange}
                      autoComplete={autoComplete}
                      inputMode={name === "phone" || name === "pincode" ? "numeric" : undefined}
                    />
                    {errors[name] && <span className="field-error">{errors[name]}</span>}
                  </div>
                ))}
              </div>
              <p className="payment-note">Razorpay Test Mode is used for this lab. No real payment will be taken.</p>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Opening secure checkout..." : "Place Order"}
              </button>
              <Link to="/cart" className="back-to-cart">Back to cart</Link>
            </form>

            <aside className="order-summary checkout-summary">
              <h2>Order Summary</h2>
              {cartItems.map(({ product, quantity }) => (
                <div className="summary-row" key={product._id}>
                  <span>{product.name} × {quantity}</span>
                  <strong>₹{(product.price * quantity).toLocaleString("en-IN")}</strong>
                </div>
              ))}
              <div className="summary-row total">
                <span>Total</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default Checkout;
