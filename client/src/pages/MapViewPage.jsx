import { useEffect, useMemo, useState } from "react";
import { 
  MapPin, Navigation, RefreshCw, Info, 
  Globe, Navigation2, Target, ExternalLink, 
  Users, ShieldCheck, AlertCircle, CheckCircle2 
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getCurrentLocationDetails } from "../utils/location.js";

const buildEmbedUrl = (item) => {
  const query = (typeof item.latitude === "number" && typeof item.longitude === "number")
    ? `${item.latitude},${item.longitude}`
    : encodeURIComponent(item.fullAddress || item.location || "");
  return `https://maps.google.com/maps?q=${query}&z=14&output=embed`;
};

const buildCurrentUserLocation = (user) => ({
  _id: "current-user-location",
  name: "Your Live Location",
  role: user.role,
  location: user.location || "Detecting...",
  fullAddress: user.fullAddress || "Capture location to see yourself on the map",
  latitude: user.latitude,
  longitude: user.longitude,
  trustScore: 100,
  mapsUrl: (typeof user.latitude === "number") 
    ? `https://www.google.com/maps/search/?api=1&query=${user.latitude},${user.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.fullAddress || user.location || "")}`
});

const MapViewPage = () => {
  const { user, setUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locating, setLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMapData = async () => {
    setIsRefreshing(true);
    try {
      const [mapUsers, nearbyData] = await Promise.all([
        apiRequest("/auth/map-users", {}, user.token),
        apiRequest(`/auth/nearby?role=${user.role === "provider" ? "ngo" : "provider"}`, {}, user.token)
      ]);
      setAllUsers(mapUsers);
      setNearby(nearbyData);
      if (!selected) setSelected(buildCurrentUserLocation(user));
    } catch (err) { setError(err.message); }
    finally { setIsRefreshing(false); }
  };

  useEffect(() => { fetchMapData(); }, []);

  const useCurrentLocation = async () => {
    setLocating(true); setError(""); setSuccess("");
    try {
      const loc = await getCurrentLocationDetails();
      const updatedUser = await apiRequest("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ ...user, ...loc })
      }, user.token);
      setUser(updatedUser);
      setSuccess("Map synchronized with your GPS.");
      fetchMapData();
    } catch (err) { setError(err.message); }
    finally { setLocating(false); }
  };

  const filteredUsers = useMemo(
    () => [buildCurrentUserLocation(user), ...allUsers.filter((u) => u.role !== "admin")],
    [allUsers, user]
  );

  return (
    <Layout title="Geospatial View" subtitle="Real-time proximity tracking for surplus redistribution">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        
        {/* --- 1. BANNER & ACTIONS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-200">
              <Globe size={20} className="animate-pulse" />
            </div>
            <p className="text-xs font-bold text-cyan-800 leading-relaxed">
              <span className="uppercase block text-[10px] opacity-70">Demo Environment</span>
              Browser GPS is live. Other markers are seeded organizations for prototype review.
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={useCurrentLocation} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-2xl font-black text-xs text-slate-600 hover:text-cyan-600 transition-all shadow-sm active:scale-95">
                {locating ? <RefreshCw className="animate-spin" size={16}/> : <Target size={16}/>}
                {locating ? "LOCATING..." : "MY LOCATION"}
             </button>
             <button onClick={fetchMapData} className="px-6 flex items-center justify-center bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg active:scale-95">
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
             </button>
          </div>
        </div>

        {(error || success) && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold animate-in fade-in slide-in-from-top-4 ${
            error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            {error ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}
            <span className="text-sm">{error || success}</span>
          </div>
        )}

        {/* --- 2. MAIN BENTO GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
          
          {/* SIDEBAR: LISTS */}
          <aside className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
            
            {/* Nearby Suggestions */}
            <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                <Navigation2 size={18} className="text-cyan-600" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Nearby Matches</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {nearby.map((item) => (
                  <button 
                    key={item._id} 
                    onClick={() => setSelected(item)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selected?._id === item._id ? "bg-cyan-50 border-cyan-200 ring-2 ring-cyan-500/10" : "bg-white border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-black text-slate-800 text-sm truncate pr-2">{item.name}</span>
                      <span className="text-[10px] font-black text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded">
                        {Number(item.distanceScore || 0).toFixed(1)}km
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                      <MapPin size={10} /> {item.location}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Global Directory */}
            <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                <Users size={18} className="text-slate-400" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">All Entities</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredUsers.map((item) => (
                  <button 
                    key={item._id} 
                    onClick={() => setSelected(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selected?._id === item._id ? "bg-slate-900 text-white border-slate-900" : "bg-white border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                       selected?._id === item._id ? "bg-cyan-500 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      {item._id === "current-user-location" ? <Target size={14}/> : <MapPin size={14}/>}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-black truncate leading-none">{item.name}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selected?._id === item._id ? "text-slate-400" : "text-slate-400"}`}>
                        {item.role}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN MAP PANEL */}
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col relative">
            {selected ? (
              <>
                <div className="p-6 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800">
                      {selected._id === "current-user-location" ? <Target size={24}/> : <MapPin size={24}/>}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{selected.name}</h2>
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-slate-400">
                        <MapPin size={12} className="text-cyan-500" />
                        <span className="truncate max-w-[250px]">{selected.fullAddress || selected.location}</span>
                      </div>
                    </div>
                  </div>
                  <a href={selected.mapsUrl} target="_blank" className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-cyan-200 transition-all active:scale-95">
                    EXTERNAL NAV <ExternalLink size={14} />
                  </a>
                </div>

                <div className="flex-1 relative">
                  <iframe
                    className="w-full h-full grayscale-[0.2] brightness-[1.05]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={buildEmbedUrl(selected)}
                    title={`${selected.name} map`}
                  />
                  
                  {/* Map Overlay Badge */}
                  <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white max-w-xs shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldCheck className="text-cyan-400" size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Metadata Profile</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                      {selected._id === "current-user-location"
                        ? "Synchronized with your device sensor for accurate proximity testing."
                        : `Seeded ${selected.role} profile with a trust score of ${selected.trustScore || 10}.`}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-sm mb-4">
                  <Globe size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Marker Selected</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Select an organization from the sidebar to view their coordinates.</p>
              </div>
            )}
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default MapViewPage;