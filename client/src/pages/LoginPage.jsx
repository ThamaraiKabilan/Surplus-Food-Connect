import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Mail, Lock, ArrowRight,
  ShieldCheck, AlertCircle, RefreshCw, UserPlus,
  ChevronRight
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const PROVIDER_MODE_KEY = "provider-source-settings";
const AUTH_STORAGE_KEY = "surplus-user";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      setUser(data);
      if (data.role === "provider") {
        navigate(localStorage.getItem(PROVIDER_MODE_KEY) ? "/provider" : "/provider-mode");
      } else if (data.role === "ngo") {
        navigate(data.fullAddress || data.location ? "/ngo" : "/ngo-profile");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showTopbar={false}>
      <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* --- LEFT SIDE: HERO CONTENT --- */}
          <div className="hidden lg:block space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.9]">
              Reduce waste. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Feed communities.</span>
            </h1>
            
            <p className="text-lg text-slate-500 font-medium max-w-md leading-relaxed">
              The bridge between surplus kitchens and verified NGOs. Simple, fast, and impact-driven redistribution.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
               <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <ShieldCheck className="text-cyan-500 mb-2" size={24} />
                  <p className="text-sm font-black text-slate-800">Verified NGOs</p>
                  <p className="text-xs text-slate-400 font-medium">Trusted handoffs only</p>
               </div>
               <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <RefreshCw className="text-blue-500 mb-2" size={24} />
                  <p className="text-sm font-black text-slate-800">Real-time Feed</p>
                  <p className="text-xs text-slate-400 font-medium">Instant redistribution</p>
               </div>
            </div>
          </div>

          {/* --- RIGHT SIDE: LOGIN FORM --- */}
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white/80 backdrop-blur-2xl border border-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-900">Welcome Back</h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">Sign in to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-slate-700"
                      type="email"
                      name="email"
                      placeholder="e.g. john@provider.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-slate-700"
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-shake">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full group bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      Login to Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                <p className="text-slate-400 font-bold text-sm">
                  New to the platform?
                </p>
                <Link to="/register" className="flex items-center gap-2 px-8 py-3 rounded-xl border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition-all shadow-sm">
                  <UserPlus size={18} className="text-cyan-600" /> Create Account <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
