import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <h2 className="mt-10 text-center text-2xl font-semibold text-slate-900">Access Denied</h2>;
  }

  return children;
}

export default ProtectedRoute;
