import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import CartContext from "./cart-context";

const cleanCart = (cart = []) => cart.filter((item) => item?.product);

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/cart");
      setCartItems(cleanCart(response.data.cart));
      return response.data.cart;
    } catch (requestError) {
      setCartItems([]);
      setError(requestError.response?.data?.message || "Unable to load your cart.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api
      .get("/cart")
      .then((response) => {
        if (isMounted) setCartItems(cleanCart(response.data.cart));
      })
      .catch((requestError) => {
        if (isMounted) {
          setCartItems([]);
          setError(requestError.response?.data?.message || "Unable to load your cart.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const applyCartResponse = useCallback((response) => {
    const updatedCart = cleanCart(response.data.cart);
    setCartItems(updatedCart);
    setError("");
    return updatedCart;
  }, []);

  const runMutation = useCallback(async (request) => {
    setError("");
    try {
      const response = await request();
      return applyCartResponse(response);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update your cart.");
      throw requestError;
    }
  }, [applyCartResponse]);

  const addToCart = useCallback(
    (productId) => runMutation(() => api.post(`/cart/${productId}`)),
    [runMutation],
  );

  const updateQuantity = useCallback(
    (productId, quantity) => runMutation(() => api.patch(`/cart/${productId}`, { quantity })),
    [runMutation],
  );

  const removeFromCart = useCallback(
    (productId) => runMutation(() => api.delete(`/cart/${productId}`)),
    [runMutation],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setError("");
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );
  const subtotal = useMemo(
    () => cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    ),
    [cartItems],
  );

  const value = useMemo(() => ({
    cartItems,
    cartCount,
    subtotal,
    loading,
    error,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }), [
    cartItems,
    cartCount,
    subtotal,
    loading,
    error,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
