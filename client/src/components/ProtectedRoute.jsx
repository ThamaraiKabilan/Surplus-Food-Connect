import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ShieldCheck } from "lucide-react";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // --- 1. WONDERFUL LOADING STATE ---
  // Shows a high-end spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="relative flex items-center justify-center">
          {/* Animated Outer Ring */}
          <div className="absolute w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          {/* Inner Logo Icon */}
          <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 relative z-10">
            <ShieldCheck className="text-cyan-600" size={24} />
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600 mb-2">Security</p>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Authenticating Session</h2>
          <p className="text-xs font-bold text-slate-400 mt-1 italic">Securing your redistribution hub...</p>
        </div>
      </div>
    );
  }

  // --- 2. NO USER LOGGED IN ---
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- 3. ROLE UNAUTHORIZED ---
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackPath = 
      user.role === "ngo" ? "/ngo" : 
      user.role === "admin" ? "/admin" : 
      "/provider";
      
    return <Navigate to={fallbackPath} replace />;
  }

  // --- 4. ACCESS GRANTED ---
  // We wrap the children in a small transition to make the entry feel "Wonderful"
  return (
    <div className="animate-in fade-in duration-500">
      {children || <Outlet />}
    </div>
  );
};

export default ProtectedRoute;
