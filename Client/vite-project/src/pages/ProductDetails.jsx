import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useCart } from "../context/useCart";

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [result, setResult] = useState({ id: null, product: null, error: "" });
  const [cartStatus, setCartStatus] = useState("idle");
  const loading = result.id !== id;
  const product = loading ? null : result.product;
  const error = loading ? "" : result.error;

  const handleAddToCart = async () => {
    if (!product || product.stock < 1 || cartStatus === "adding") return;
    setCartStatus("adding");
    try {
      await addToCart(product._id);
      setCartStatus("added");
    } catch {
      setCartStatus("error");
    }
  };

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/products/${id}`)
      .then((res) => {
        if (isMounted) setResult({ id, product: res.data.product, error: "" });
      })
      .catch(() => {
        if (isMounted) {
          setResult({
            id,
            product: null,
            error: "Something went wrong while loading this product.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="product-details-screen">
      <Navbar />
      <main className="product-details-content">
        {loading && <p className="state-message">Loading products...</p>}
        {!loading && error && <p className="state-message error">{error}</p>}
        {!loading && !error && product && (
          <div className="product-details-card">
            <img
              src={product.image}
              alt={product.name}
              className="product-details-image"
            />
            <div className="product-details-info">
              <span className="product-card-category">{product.category}</span>
              <h1>{product.name}</h1>
              <p className="product-details-description">{product.description}</p>
              <p className="product-details-price">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              <p className={`product-card-stock ${product.stock > 0 ? "" : "out"}`}>
                {product.stock > 0 ? `${product.stock} units left` : "Out of stock"}
              </p>
              <button
                type="button"
                className="btn-primary product-details-btn"
                onClick={handleAddToCart}
                disabled={product.stock < 1 || cartStatus === "adding"}
              >
                {cartStatus === "adding" ? "Adding..." : cartStatus === "added" ? "Add Another" : "Add to Cart"}
              </button>
              {cartStatus === "error" && <p className="wishlist-error">Unable to add this product to your cart.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProductDetails;
