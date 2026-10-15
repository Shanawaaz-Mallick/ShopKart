import { useState } from "react";
import { useCart } from "../context/useCart";

function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [busy, setBusy] = useState(false);
  const { product, quantity } = item;

  const changeQuantity = async (nextQuantity) => {
    setBusy(true);
    try {
      await updateQuantity(product._id, nextQuantity);
    } catch {
      // The shared cart error is displayed by the Cart page.
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async () => {
    setBusy(true);
    try {
      await removeFromCart(product._id);
    } catch {
      // Keep the item visible when the server could not remove it.
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="cart-item">
      <img className="cart-item-image" src={product.image} alt={product.name} />
      <div className="cart-item-main">
        <span className="product-card-category">{product.category}</span>
        <h2>{product.name}</h2>
        <p className="product-card-price">₹{product.price.toLocaleString("en-IN")}</p>
        <p className={`product-card-stock ${product.stock > 0 ? "" : "out"}`}>
          {product.stock > 0 ? `${product.stock} units left` : "Out of stock"}
        </p>
        <div className="quantity-controls" aria-label={`Quantity for ${product.name}`}>
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => changeQuantity(quantity - 1)}
            disabled={busy || quantity <= 1}
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => changeQuantity(quantity + 1)}
            disabled={busy || quantity >= product.stock}
          >
            +
          </button>
        </div>
        <button type="button" className="text-action" onClick={removeItem} disabled={busy}>
          {busy ? "Updating..." : "Remove"}
        </button>
      </div>
      <strong className="cart-line-total">
        ₹{(product.price * quantity).toLocaleString("en-IN")}
      </strong>
    </article>
  );
}

export default CartItem;
