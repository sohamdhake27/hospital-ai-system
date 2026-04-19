import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Beds from "./pages/beds";
import AIPrediction from "./pages/AIPrediction";
import AddExpense from "./pages/AddExpense";
import AdminDashboard from "./pages/AdminDashboard";
import Pharmacy from "./pages/Pharmacy";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import RiskPredictor from "./components/RiskPredictor";
import Bill from "./pages/Bill";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>

      {/* Login */}
      <Route path="/" element={<Login />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "doctor"]}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Patients */}
      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRoles={["admin", "doctor", "reception", "pharmacy"]}>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute allowedRoles={["admin", "pharmacy"]}>
            <Layout>
              <Pharmacy />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRoles={["admin", "reception"]}>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients/bill/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "reception"]}>
            <Layout>
              <AddExpense />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Beds */}
      <Route
        path="/beds"
        element={
          <ProtectedRoute allowedRoles={["admin", "doctor"]}>
            <Layout>
              <Beds />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* AI Prediction */}
      <Route
        path="/ai"
        element={
          <ProtectedRoute allowedRoles={["admin", "doctor"]}>
            <Layout>
              <AIPrediction />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bill/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "reception"]}>
            <Layout>
              <Bill />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Risk Predictor */}
      <Route path="/predict" element={<RiskPredictor />} />

      </Routes>
    </>
  );
}

export default App;
