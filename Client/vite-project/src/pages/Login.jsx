import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/useCart";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshCart } = useCart();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Enter your email";
    if (!form.password) next.password = "Enter your password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      // withCredentials (set in services/api.js) is what lets the browser
      // store the HttpOnly cookie the server sends back on a successful login.
      await api.post("/customers/login", form);
      await refreshCart();
      navigate("/home");
    } catch (err) {
      if (err.response?.status === 401) {
        setServerError("Invalid Credentials");
      } else if (!err.response) {
        setServerError(
          "Can't reach the server. Make sure the backend is running on http://localhost:8000."
        );
      } else {
        setServerError(
          err.response?.data?.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <span className="brand-mark">ShopKart</span>
        <h1>Welcome back</h1>
        <p className="auth-subtext">Log in to continue to your account.</p>

        {location.state?.justRegistered && (
          <div className="form-banner success">Account created. Please log in.</div>
        )}
        {serverError && <div className="form-banner error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New to ShopKart? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
