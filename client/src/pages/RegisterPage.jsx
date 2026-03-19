import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  UserPlus, Mail, Lock, ChefHat, Building2, 
  ArrowRight, ShieldCheck, Sparkles, AlertCircle, 
  RefreshCw, ChevronRight, CheckCircle2 
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const AUTH_STORAGE_KEY = "surplus-user";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "provider"
  });
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
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      setUser(data);
      navigate(data.role === "provider" ? "/provider-mode" : "/ngo-profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showTopbar={false}>
      <div className="min-h-[95vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* --- LEFT SIDE: BRAND CONTENT --- */}
          <div className="hidden lg:block space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Join the Movement</span>
            </div>
            
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.9]">
              Start your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 font-outline-2">Impact Journey.</span>
            </h1>
            
            <p className="text-lg text-slate-500 font-medium max-w-md leading-relaxed">
              Whether you're a kitchen with surplus or an NGO with a mission, our platform makes redistribution effortless.
            </p>

            <div className="space-y-4 pt-4">
               <div className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm transition-transform hover:scale-105">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-200">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Quick Signup</p>
                    <p className="text-xs text-slate-400 font-medium italic">Verified in minutes, not days.</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm transition-transform hover:scale-105">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Secure & Private</p>
                    <p className="text-xs text-slate-400 font-medium italic">Your data is protected by industry standards.</p>
                  </div>
               </div>
            </div>
          </div>

          {/* --- RIGHT SIDE: REGISTRATION FORM --- */}
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white/80 backdrop-blur-2xl border border-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full"></div>
              
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 leading-none">Create Account</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3">Enter your details below</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                
                {/* ROLE SELECTOR ( wonderful replacement for dropdown ) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'provider'})}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        formData.role === 'provider' ? 'bg-cyan-50 border-cyan-500 ring-4 ring-cyan-500/10' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <ChefHat size={20} className={formData.role === 'provider' ? 'text-cyan-600' : 'text-slate-400'} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${formData.role === 'provider' ? 'text-cyan-600' : 'text-slate-500'}`}>Provider</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'ngo'})}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        formData.role === 'ngo' ? 'bg-blue-50 border-blue-600 ring-4 ring-blue-600/10' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <Building2 size={20} className={formData.role === 'ngo' ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${formData.role === 'ngo' ? 'text-blue-600' : 'text-slate-500'}`}>NGO</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-slate-700"
                      type="email"
                      name="email"
                      placeholder="e.g. hello@impact.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-slate-700"
                      type="password"
                      name="password"
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-white/10">
                   <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">
                     Tip: You'll provide organizational proof (like FSSAI or NGO Certs) during your first activity. Start simple today.
                   </p>
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
                      Create Free Account <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-400 font-bold text-sm">
                  Member already? <Link to="/login" className="text-cyan-600 hover:text-blue-700 transition-colors ml-1">Login here <ChevronRight className="inline" size={14} /></Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
