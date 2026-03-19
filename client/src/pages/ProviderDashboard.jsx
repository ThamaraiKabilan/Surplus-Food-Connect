import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  PlusCircle, MapPin, Clock, RefreshCw, Package, 
  Navigation, AlertCircle, CheckCircle2, LogOut, 
  LayoutDashboard, Map, Trophy, ClipboardList, ExternalLink, User, Info 
} from "lucide-react";
import { apiRequest } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getCurrentLocationDetails } from "../utils/location.js";

const PROVIDER_MODE_KEY = "provider-source-settings";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, logout } = useAuth();

  // --- State Logic ---
  const [formData, setFormData] = useState({
    foodName: "", quantity: "", location: user?.location || "",
    fullAddress: user?.fullAddress || "", latitude: "", longitude: "", expiryTime: ""
  });
  const [foodListings, setFoodListings] = useState([]);
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locating, setLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchListings = async () => {
    setIsRefreshing(true);
    try {
      const data = await apiRequest("/food?mine=true", {}, user.token);
      setFoodListings(data);
    } catch (err) { setError(err.message); }
    finally { setIsRefreshing(false); }
  };

  const fetchVerification = async () => {
    try {
      const data = await apiRequest("/verification/mine", {}, user.token);
      setVerification(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchListings();
    fetchVerification();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const useCurrentLocation = async () => {
    setLocating(true);
    setError("");
    try {
      const loc = await getCurrentLocationDetails();
      setFormData(prev => ({ ...prev, ...loc }));
      setSuccess("GPS Location synchronized!");
    } catch (err) { setError("Location access denied."); }
    finally { setLocating(false); }
  };

  const getSavedMode = () => {
    const stored = localStorage.getItem(PROVIDER_MODE_KEY);
    return stored ? JSON.parse(stored) : null;
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const savedMode = getSavedMode();

    if (!savedMode) { navigate("/provider-mode"); return; }

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      payload.append("sourceType", savedMode.sourceType === "hotel" ? "event" : "home");
      payload.append("homeTermsAccepted", "true");
      payload.append("eventProofMode", "existing");

      await apiRequest("/food", { method: "POST", body: payload }, user.token);
      setSuccess("Food listing published successfully!");
      setFormData({ foodName: "", quantity: "", location: user?.location || "", fullAddress: user?.fullAddress || "", expiryTime: "" });
      fetchListings();
    } catch (err) { setError(err.message); }
  };

  const savedMode = getSavedMode();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-cyan-100">
      
      {/* --- 1. NAVIGATION (Shared across all pages) --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Package className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              SFC<span className="text-cyan-600">.</span>
            </span>
          </Link>

          {/* Pill-style Tab Navigation */}
          <div className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/40">
            {[
              { label: "Dashboard", path: "/provider", icon: LayoutDashboard },
              { label: "Operations", path: "/provider-activity", icon: ClipboardList },
              { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
              { label: "Map View", path: "/map", icon: Map },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  location.pathname === item.path ? "bg-white text-cyan-600 shadow-sm" : "text-slate-400 hover:text-slate-900"
                }`}
              >
                <item.icon size={14} /> {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end border-r border-slate-200 pr-4 mr-1">
              <span className="text-sm font-black text-slate-800 leading-none">{user?.name || "Provider"}</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-600 mt-1">{savedMode?.sourceType || 'Profile'}</span>
            </div>
            <button onClick={handleLogout} className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* --- 2. HERO HEADER --- */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-cyan-600 font-black text-xs uppercase tracking-[0.3em] mb-3">
             <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div> Provider Command Center
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
            Provider <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Hub</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-4 max-w-xl italic border-l-4 border-cyan-100 pl-4">
            Transforming surplus into community impact. Manage your listings and track your handoffs in real-time.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* --- 3. CREATE LISTING (BENTO LEFT) --- */}
          <aside className="lg:col-span-4 sticky top-32">
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-200">
                  <PlusCircle size={28} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Post Surplus</h2>
              </div>

              <form onSubmit={handleCreateListing} className="space-y-6">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Food Details</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 focus:bg-white transition-all font-bold text-slate-700" 
                    name="foodName" placeholder="e.g. Freshly Baked Pasta" value={formData.foodName} onChange={handleChange} required />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 focus:bg-white transition-all font-bold text-slate-700" 
                    name="quantity" placeholder="e.g. 15 Containers" value={formData.quantity} onChange={handleChange} required />
                </div>

                <div className="pt-2">
                  <button type="button" onClick={useCurrentLocation}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:border-cyan-500 hover:bg-cyan-50/30 hover:text-cyan-600 transition-all active:scale-95 group"
                  >
                    {locating ? <RefreshCw className="animate-spin" size={18} /> : <Navigation size={18} className="group-hover:rotate-12 transition-transform" />}
                    {locating ? "PINPOINTING..." : "SYNC GPS LOCATION"}
                  </button>
                  {formData.fullAddress && (
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3 items-start animate-in zoom-in-95 duration-300">
                      <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                      <p className="text-xs text-emerald-800 font-bold leading-relaxed">{formData.fullAddress}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Consumption Deadline</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-4.5 text-slate-400" size={18} />
                    <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 focus:bg-white transition-all font-bold text-slate-700" 
                      name="expiryTime" value={formData.expiryTime} onChange={handleChange} required />
                  </div>
                </div>

                {(error || success) && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-tight animate-in slide-in-from-top-2 ${error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                    {error ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}
                    {error || success}
                  </div>
                )}

                <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-slate-300 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3 group">
                  PUBLISH TO NETWORK <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </form>
            </div>
          </aside>

          {/* --- 4. LISTINGS FEED (BENTO RIGHT) --- */}
          <section className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Your Live Posts</h2>
              </div>
              <button onClick={fetchListings} className="group p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-cyan-600 transition-all shadow-sm active:scale-95">
                <RefreshCw size={20} className={isRefreshing ? "animate-spin text-cyan-600" : "group-active:rotate-180 transition-transform duration-500"} />
              </button>
            </div>

            {foodListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {foodListings.map((food) => (
                  <div key={food._id} className="group bg-white border border-slate-200/80 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                        food.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {food.status}
                      </span>
                      <div className="text-right">
                        <span className="text-3xl font-black text-slate-900 block tracking-tighter">{food.quantity}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servings</span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-6 group-hover:text-cyan-600 transition-colors leading-tight">
                      {food.foodName}
                    </h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <Clock size={16} className="text-cyan-600" />
                        <span className="text-xs font-black italic">Valid until {new Date(food.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-start gap-3 px-1">
                        <MapPin size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2 uppercase tracking-tight">{food.location}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white border-2 border-white shadow-xl">
                          <User size={16} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provider</p>
                           <span className="text-xs font-black text-slate-800 tracking-tight">{food.providerName || "Official User"}</span>
                        </div>
                      </div>
                      <a href={`https://www.google.com/maps?q=${food.latitude},${food.longitude}`} target="_blank"
                        className="p-3.5 rounded-2xl bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white hover:rotate-12 transition-all shadow-sm">
                        <ExternalLink size={20} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-24 px-10 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Package size={40} className="text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-300 tracking-tighter">SURPLUS FEED IS EMPTY</h3>
                <p className="text-slate-400 font-bold text-sm max-w-xs mt-2 italic uppercase tracking-tighter">Help us fill the gap. Start by listing your first meal on the left.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
