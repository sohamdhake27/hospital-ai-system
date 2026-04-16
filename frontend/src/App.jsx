import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Beds from "./pages/beds";
import AIPrediction from "./pages/AIPrediction";
import AddExpense from "./pages/AddExpense";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import RiskPredictor from "./components/RiskPredictor";

function App() {
  return (
    <Routes>

      {/* Login */}
      <Route path="/" element={<Login />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients/bill/:id"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
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
          <ProtectedRoute>
            <Layout>
              <AIPrediction />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Risk Predictor */}
      <Route path="/predict" element={<RiskPredictor />} />

    </Routes>
  );
}

export default App;
