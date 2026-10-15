import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/useCart";

function Navbar() {
  const navigate = useNavigate();
  const { cartCount, clearCart } = useCart();

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");
    } catch {
      // Even if the request fails (e.g. cookie already expired), the user
      // still wants to leave the account view, so send them to login anyway.
    }
    clearCart();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <span className="navbar-brand">ShopKart</span>
      <nav className="navbar-links">
        <Link to="/home">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/cart">Cart ({cartCount})</Link>
      </nav>
      <button type="button" className="btn-logout" onClick={handleLogout}>
        Log out
      </button>
    </header>
  );
}

export default Navbar;
