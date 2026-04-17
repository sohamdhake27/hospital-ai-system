import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem("token");

  // ❌ No token → redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  let decoded;
  try {
    decoded = jwtDecode(token);
    if (!localStorage.getItem("user")) {
      localStorage.setItem("user", JSON.stringify({ role: decoded.role }));
    }
  } catch (error) {
    console.error("Invalid token:", error);
    // ❌ Invalid token → clear & redirect
    localStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }

  // ❌ Role not allowed → redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    return <Navigate to="/" replace />;
  }

  // ✅ Access granted
  return children;
}

export default ProtectedRoute;
