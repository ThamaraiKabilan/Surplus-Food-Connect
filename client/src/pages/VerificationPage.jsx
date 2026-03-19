import { useEffect, useState } from "react";
import { 
  ShieldCheck, UserCheck, MapPin, Navigation, 
  RefreshCw, FileText, ExternalLink, CheckCircle2, 
  XCircle, Clock, AlertCircle, ShieldAlert, 
  User, Mail, LayoutDashboard, Search, Eye
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest, buildAssetUrl } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getCurrentLocationDetails } from "../utils/location.js";

const VerificationPage = () => {
  const { user, setUser } = useAuth();
  const isAdmin = user.role === "admin";
  const [profile, setProfile] = useState({
    name: user.name || "",
    location: user.location || "",
    fullAddress: user.fullAddress || "",
    latitude: user.latitude || "",
    longitude: user.longitude || ""
  });
  const [verification, setVerification] = useState(null);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locating, setLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      if (isAdmin) {
        const data = await apiRequest("/verification", {}, user.token);
        setQueue(data);
      } else {
        const data = await apiRequest("/verification/mine", {}, user.token);
        setVerification(data);
      }
    } catch (err) { setError(err.message); }
    finally { setIsRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const useCurrentLocation = async () => {
    setLocating(true); setError(""); setSuccess("");
    try {
      const loc = await getCurrentLocationDetails();
      const updatedUser = await apiRequest("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ ...profile, ...loc, name: profile.name || user.name })
      }, user.token);
      setUser(updatedUser);
      setProfile((prev) => ({ ...prev, ...loc, name: updatedUser.name }));
      setSuccess("GPS coordinates captured.");
    } catch (err) { setError(err.message); }
    finally { setLocating(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const data = await apiRequest("/auth/profile", { method: "PUT", body: JSON.stringify(profile) }, user.token);
      setUser(data);
      setSuccess("Profile address updated.");
    } catch (err) { setError(err.message); }
  };

  const updateStatus = async (verificationId, status) => {
    try {
      await apiRequest(`/verification/${verificationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      }, user.token);
      setSuccess(`Account marked as ${status}.`);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  return (
    <Layout title="Verification Center" subtitle="Managing organizational trust and identity validation">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
        {/* --- HEADER ACTIONS --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-600 rounded-2xl text-white shadow-lg shadow-cyan-200">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {isAdmin ? "Global Review Queue" : "Identity Status"}
              </h2>
           </div>
           <button onClick={fetchData} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:text-cyan-600 transition-all shadow-sm">
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} /> Sync Data
           </button>
        </div>

        {(error || success) && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold animate-in fade-in slide-in-from-top-4 ${
            error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            {error ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
            <span className="text-sm">{error || success}</span>
          </div>
        )}

        {isAdmin ? (
          /* --- ADMIN VIEW: REVIEW QUEUE --- */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {queue.map((item) => (
              <div key={item._id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <User size={120} />
                </div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.email}`} className="w-14 h-14 rounded-2xl bg-slate-100 p-1 border border-slate-200" alt="avatar" />
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{item.user?.name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.role}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    item.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="space-y-4 mb-8 relative z-10">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Mail size={16} className="text-cyan-600" /> {item.user?.email}
                  </div>
                  <div className="flex items-start gap-3 text-sm font-medium text-slate-600">
                    <MapPin size={16} className="text-cyan-600 shrink-0 mt-0.5" /> 
                    <span className="leading-snug">{item.locationSnapshot?.fullAddress || item.user?.fullAddress || "No address captured"}</span>
                  </div>
                  {item.expiryTime && (
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 italic">
                      <Clock size={14} /> Expiry: {new Date(item.expiryTime).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
                  {item.documents.map((doc, idx) => (
                    <a 
                      key={idx} 
                      href={doc.isDemo ? "#" : buildAssetUrl(doc.fileUrl)} 
                      target={doc.isDemo ? "_self" : "_blank"}
                      className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-cyan-50 hover:border-cyan-200 transition-all group/doc"
                    >
                      <FileText size={16} className="text-slate-400 group-hover/doc:text-cyan-600" />
                      <span className="text-[11px] font-black text-slate-600 truncate uppercase tracking-tighter">{doc.label}</span>
                      <ExternalLink size={12} className="ml-auto text-slate-300" />
                    </a>
                  ))}
                </div>

                <div className="flex gap-3 relative z-10">
                   <button onClick={() => updateStatus(item._id, "verified")} className="flex-1 py-4 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95">
                      APPROVE
                   </button>
                   <button onClick={() => updateStatus(item._id, "rejected")} className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-600 font-black rounded-2xl transition-all active:scale-95">
                      REJECT
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- USER VIEW: PROFILE & STATUS --- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Address Management */}
            <form onSubmit={saveProfile} className="lg:col-span-5 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h3 className="text-2xl font-black text-slate-800 mb-2">Location Snapshot</h3>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Profile Display Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-bold mt-1" name="name" value={profile.name} onChange={handleProfileChange} />
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full"></div>
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <MapPin size={12} /> Active Geofence
                   </p>
                   <h4 className="text-2xl font-black tracking-tight leading-tight">{profile.location || "Coordinates not set"}</h4>
                   <p className="text-xs font-medium text-slate-400 mt-2 italic leading-relaxed">{profile.fullAddress || "Sync GPS to verify your distribution zone."}</p>
                </div>
              </div>

              <button type="button" onClick={useCurrentLocation} className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-black text-xs tracking-widest hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50/30 transition-all active:scale-95 group">
                {locating ? <RefreshCw className="animate-spin" /> : <Navigation size={18} className="group-hover:rotate-12 transition-transform" />}
                {locating ? "CAPTURING..." : "SYNC GPS LOCATION"}
              </button>

              <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                UPDATE PROFILE ADDRESS
              </button>
            </form>

            {/* Right: Verification Proof */}
            <div className="lg:col-span-7 space-y-8">
              <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Account Trust Proof</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Validation Documents</p>
                  </div>
                  {verification && (
                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      verification.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      Status: {verification.status}
                    </span>
                  )}
                </div>

                {verification ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <FileText size={14} className="text-cyan-600" /> Digital Identity Locker
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {verification.documents?.map((doc, idx) => (
                          <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between group">
                            <div>
                               <p className="text-xs font-black text-slate-800 truncate max-w-[120px]">{doc.label}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                                 {doc.isDemo ? "Demo Asset" : "Uploaded Proof"}
                               </p>
                            </div>
                            {doc.isDemo ? (
                              <Info size={16} className="text-slate-300" />
                            ) : (
                              <a href={buildAssetUrl(doc.fileUrl)} target="_blank" className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-cyan-600 hover:text-white transition-all">
                                <Eye size={16} />
                              </a>
                            )}
                          </div>
                        ))}
                       </div>
                    </div>
                    {verification.adminNotes && (
                      <div className="flex gap-4 p-5 bg-amber-50 rounded-3xl border border-amber-100">
                         <ShieldAlert className="text-amber-600 shrink-0" size={20} />
                         <div>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Admin Note</p>
                            <p className="text-xs font-bold text-amber-800 mt-1 italic leading-relaxed">"{verification.adminNotes}"</p>
                         </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
                    <ShieldAlert size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-lg font-black text-slate-400">Identity Not Verified</p>
                    <p className="text-xs font-bold text-slate-400 mt-2 max-w-xs mx-auto italic leading-relaxed">
                      {user.role === 'provider' 
                        ? "Providers upload proof during their first food post. Once uploaded, your status will appear here." 
                        : "Upload organization certificates from the NGO Profile page to start verification."}
                    </p>
                  </div>
                )}
              </section>

              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <UserCheck size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black">Provisional Account</h4>
                    <p className="text-sm font-medium text-slate-400 mt-1">Verified accounts gain priority listing and higher trust visibility.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerificationPage;