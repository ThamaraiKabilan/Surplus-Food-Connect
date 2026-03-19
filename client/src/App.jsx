import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProviderDashboard from "./pages/ProviderDashboard.jsx";
import ProviderFoodDetailsPage from "./pages/ProviderFoodDetailsPage.jsx";
import ProviderActivityPage from "./pages/ProviderActivityPage.jsx";
import NGODashboard from "./pages/NGODashboard.jsx";
import NGOProfilePage from "./pages/NGOProfilePage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import VerificationPage from "./pages/VerificationPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import ComplaintPage from "./pages/ComplaintPage.jsx";
import MapViewPage from "./pages/MapViewPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import './styles.css'; 

const App = () => {
  const { user } = useAuth();

  const homePath = user
    ? user.role === "provider"
      ? "/provider"
      : user.role === "ngo"
        ? "/ngo"
        : "/admin"
    : "/login";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/provider-dashboard" element={<Navigate to="/provider" replace />} />
      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider-mode"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderFoodDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/operations" element={<Navigate to="/provider-activity" replace />} />
      <Route
        path="/provider-activity"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderActivityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ngo"
        element={
          <ProtectedRoute allowedRoles={["ngo"]}>
            <NGODashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ngo-profile"
        element={
          <ProtectedRoute allowedRoles={["ngo"]}>
            <NGOProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verification"
        element={
          <ProtectedRoute allowedRoles={["provider", "ngo", "admin"]}>
            <VerificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute allowedRoles={["provider", "ngo", "admin"]}>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute allowedRoles={["ngo", "admin"]}>
            <ComplaintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute allowedRoles={["provider", "ngo", "admin"]}>
            <MapViewPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
