import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Home, Hotel, ShieldCheck, FileText, Camera, 
  MapPin, Navigation, RefreshCw, CheckCircle2, 
  AlertCircle, Eye, ArrowLeft, CloudUpload, Lock,
  ShieldAlert, Info, ChevronRight, BookmarkCheck
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest, buildAssetUrl } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getCurrentLocationDetails } from "../utils/location.js";

const PROVIDER_MODE_KEY = "provider-source-settings";

const ProviderFoodDetailsPage = () => {
  const { user, setUser } = useAuth();
  const [sourceType, setSourceType] = useState("home");
  const [homeTermsAccepted, setHomeTermsAccepted] = useState(false);
  const [verification, setVerification] = useState(null);
  const [profile, setProfile] = useState({
    name: user.name || "",
    location: user.location || "",
    fullAddress: user.fullAddress || "",
    latitude: user.latitude || "",
    longitude: user.longitude || ""
  });
  const [providerFiles, setProviderFiles] = useState({
    foodSafetyCertificate: null,
    businessProof: null,
    foodPreparationProof: null
  });
  const [providerMeta, setProviderMeta] = useState({
    expiryTime: "",
    selfDeclarationAccepted: false
  });
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedMode = localStorage.getItem(PROVIDER_MODE_KEY);
    if (storedMode) {
      try {
        const parsedMode = JSON.parse(storedMode);
        setSourceType(parsedMode.sourceType || "home");
        setHomeTermsAccepted(Boolean(parsedMode.homeTermsAccepted));
      } catch (err) { localStorage.removeItem(PROVIDER_MODE_KEY); }
    }
  }, []);

  const fetchVerification = async () => {
    try {
      const data = await apiRequest("/verification/mine", {}, user.token);
      setVerification(data);
      setProviderMeta({
        expiryTime: data?.expiryTime ? new Date(data.expiryTime).toISOString().slice(0, 16) : "",
        selfDeclarationAccepted: Boolean(data?.selfDeclarationAccepted)
      });
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { fetchVerification(); }, [user.token]);

  const reusableProof = useMemo(() =>
      verification?.documents?.find((item) => item.label.toLowerCase().includes("business proof")) ||
      verification?.documents?.[0] || null,
    [verification]
  );

  const handleSaveMode = (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (sourceType === "home" && !homeTermsAccepted) {
      setError("Please accept hygiene responsibility first."); return;
    }
    if (sourceType === "hotel" && !reusableProof) {
      setError("Upload provider proof first before switching to Hotel mode."); return;
    }
    localStorage.setItem(PROVIDER_MODE_KEY, JSON.stringify({ sourceType, homeTermsAccepted }));
    setSuccess("Supply profile updated successfully!");
  };

  const useCurrentLocation = async () => {
    setLocating(true); setError("");
    try {
      const loc = await getCurrentLocationDetails();
      const updatedUser = await apiRequest("/auth/profile", {
          method: "PUT",
          body: JSON.stringify({ ...profile, ...loc, name: profile.name || user.name })
      }, user.token);
      setUser(updatedUser);
      setProfile((prev) => ({ ...prev, ...loc, name: updatedUser.name }));
      setSuccess("GPS Snapshot captured.");
    } catch (err) { setError(err.message); }
    finally { setLocating(false); }
  };

  const uploadProviderProof = async (e) => {
    e.preventDefault();
    setUploading(true); setError(""); setSuccess("");
    try {
      const payload = new FormData();
      payload.append("expiryTime", providerMeta.expiryTime);
      payload.append("selfDeclarationAccepted", String(providerMeta.selfDeclarationAccepted));
      if (providerFiles.foodSafetyCertificate) payload.append("foodSafetyCertificate", providerFiles.foodSafetyCertificate);
      if (providerFiles.businessProof) payload.append("businessProof", providerFiles.businessProof);
      if (providerFiles.foodPreparationProof) payload.append("foodPreparationProof", providerFiles.foodPreparationProof);

      await apiRequest("/verification/upload", { method: "POST", body: payload }, user.token);
      setProviderFiles({ foodSafetyCertificate: null, businessProof: null, foodPreparationProof: null });
      setSuccess("Verification documents secured.");
      fetchVerification();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  return (
    <Layout>
      {/* --- 1. HEADER --- */}
      <header className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <ShieldCheck className="w-4 h-4" /> Identity & Trust
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
            Supply <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Profile</span>
          </h1>
          <p className="text-slate-500 font-medium mt-4 max-w-xl italic border-l-4 border-cyan-100 pl-4">
            Manage your supply source and verification documents to ensure high community trust.
          </p>
        </div>
        <Link to="/provider" className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 font-black text-xs text-slate-500 hover:text-cyan-600 transition-all shadow-sm">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> BACK TO HUB
        </Link>
      </header>

      {/* --- 2. NOTIFICATIONS --- */}
      {(error || success) && (
        <div className={`mb-10 p-5 rounded-[2rem] flex items-center gap-4 font-bold border animate-in slide-in-from-top-4 ${
          error ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${error ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
             {error ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
          </div>
          <span className="text-sm tracking-tight">{error || success}</span>
        </div>
      )}

      <div className="space-y-10">
        
        {/* --- 3. SECTION: SUPPLY MODE SELECTION --- */}
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <BookmarkCheck className="text-cyan-600" size={24} /> Supply Source Configuration
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Changes here will apply to all your future food listings.</p>
          </div>

          <form onSubmit={handleSaveMode} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              onClick={() => setSourceType("home")}
              className={`cursor-pointer p-8 rounded-[2rem] border-2 transition-all relative overflow-hidden group/card ${
                sourceType === "home" ? "border-cyan-500 bg-cyan-50/20 ring-4 ring-cyan-500/10 shadow-lg" : "border-slate-100 bg-slate-50 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${sourceType === "home" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-200" : "bg-white text-slate-400 shadow-inner"}`}>
                  <Home size={32} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">Residential</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Home Kitchen Surplus</p>
                </div>
              </div>
              {sourceType === "home" && <CheckCircle2 size={24} className="absolute top-6 right-6 text-cyan-600" />}
            </div>

            <div 
              onClick={() => setSourceType("hotel")}
              className={`cursor-pointer p-8 rounded-[2rem] border-2 transition-all relative overflow-hidden group/card ${
                sourceType === "hotel" ? "border-blue-600 bg-blue-50/20 ring-4 ring-blue-600/10 shadow-lg" : "border-slate-100 bg-slate-50 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${sourceType === "hotel" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-slate-400 shadow-inner"}`}>
                  <Hotel size={32} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">Commercial</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Hotels & Institutions</p>
                </div>
              </div>
              {sourceType === "hotel" && <CheckCircle2 size={24} className="absolute top-6 right-6 text-blue-600" />}
            </div>

            <div className="md:col-span-2 p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
              {sourceType === "home" ? (
                <label className="flex items-center gap-4 cursor-pointer group/label">
                  <input type="checkbox" checked={homeTermsAccepted} onChange={(e) => setHomeTermsAccepted(e.target.checked)} className="w-6 h-6 rounded-lg text-cyan-500 focus:ring-cyan-500 border-none bg-white/10 transition-all cursor-pointer" />
                  <span className="text-sm font-bold text-slate-300 group-hover/label:text-white transition-colors italic">
                    "I accept responsibility for the safety and hygiene of my home-prepared surplus."
                  </span>
                </label>
              ) : (
                <div className="flex items-center gap-4">
                  <Lock className="text-cyan-400 shrink-0" size={20} />
                  <p className="text-sm font-bold text-slate-300">
                    {reusableProof ? `Verified via: ${reusableProof.label}` : "Upload Business Identity below to activate Hotel mode."}
                  </p>
                </div>
              )}
              <button type="submit" className="hidden md:flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg active:scale-95">
                SAVE CONFIG <ChevronRight size={18} />
              </button>
            </div>
            
            <button type="submit" className="md:hidden w-full bg-cyan-600 text-white font-black py-4 rounded-2xl">
              SAVE CONFIGURATION
            </button>
          </form>
        </section>

        {/* --- 4. BENTO: DOCUMENT VAULT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* UPLOAD FORM (LEFT) */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <CloudUpload className="text-cyan-600" size={24} /> Verification Vault
            </h3>

            <form onSubmit={uploadProviderProof} className="space-y-6">
              <button type="button" onClick={useCurrentLocation} className="w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] border-2 border-dashed border-slate-200 hover:border-cyan-500 hover:text-cyan-600 font-black text-xs uppercase tracking-widest text-slate-400 transition-all bg-slate-50/50 group">
                {locating ? <RefreshCw className="animate-spin" /> : <Navigation size={18} className="group-hover:rotate-12 transition-transform"/>}
                {locating ? "PINPOINTING GPS..." : "SYNC LOCATION SNAPSHOT"}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'foodSafetyCertificate', title: 'Food Safety', sub: 'FSSAI License' },
                  { key: 'businessProof', title: 'Business ID', sub: 'GST / License' },
                  { key: 'foodPreparationProof', title: 'Kitchen', sub: 'Recent Photo' }
                ].map((item) => (
                  <label key={item.key} className="relative cursor-pointer group/upload">
                    <div className={`p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 group-hover/upload:border-cyan-200 transition-all h-full flex flex-col items-center text-center ${providerFiles[item.key] ? 'border-emerald-200 bg-emerald-50' : ''}`}>
                      <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-all ${providerFiles[item.key] ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                        {providerFiles[item.key] ? <CheckCircle2 size={24}/> : <FileText size={24}/>}
                      </div>
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1.5">{item.title}</h5>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{providerFiles[item.key] ? providerFiles[item.key].name : item.sub}</p>
                    </div>
                    <input 
                      type="file" className="hidden" 
                      onChange={(e) => setProviderFiles(prev => ({ ...prev, [item.key]: e.target.files?.[0] || null }))} 
                    />
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Document Expiry</p>
                   <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="datetime-local" 
                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all"
                        value={providerMeta.expiryTime}
                        onChange={(e) => setProviderMeta(prev => ({ ...prev, expiryTime: e.target.value }))}
                        required
                      />
                   </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 cursor-pointer group/check">
                  <input type="checkbox" checked={providerMeta.selfDeclarationAccepted} onChange={(e) => setProviderMeta(prev => ({ ...prev, selfDeclarationAccepted: e.target.checked }))} className="w-6 h-6 rounded-lg text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight group-hover/check:text-slate-700 transition-colors leading-relaxed">
                    I confirm all documents provided are current and legally valid.
                  </span>
                </div>
              </div>

              <button disabled={uploading} type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                {uploading ? <RefreshCw className="animate-spin" /> : <CloudUpload size={20} />}
                {uploading ? "SECURING VAULT..." : verification ? "RE-SUBMIT VERIFICATION" : "SUBMIT INITIAL PROOF"}
              </button>
            </form>
          </section>

          {/* STORAGE PREVIEW (RIGHT) */}
          <section className="lg:col-span-5 space-y-6 flex flex-col h-full">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <Lock className="text-cyan-400" size={22} /> Stored Identity
                </h3>
                {verification && (
                  <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border tracking-widest ${
                    verification.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                  }`}>
                    {verification.status}
                  </span>
                )}
              </div>

              {verification?.documents?.length ? (
                <div className="space-y-4 relative z-10">
                  {verification.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-cyan-400">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black truncate">{doc.label}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Digital Copy</p>
                        </div>
                      </div>
                      <a href={buildAssetUrl(doc.fileUrl)} target="_blank" className="p-3 rounded-xl bg-white/10 text-white hover:bg-cyan-600 transition-all">
                        <Eye size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 relative z-10">
                  <ShieldAlert size={64} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-[0.3em]">Identity Vault Empty</p>
                </div>
              )}
            </div>

            <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex gap-4">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <p className="text-xs font-bold text-amber-800 leading-relaxed italic">
                Verified status increases your visibility to NGOs. If your document status is "Pending", a moderator will review your submission within 24h.
              </p>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default ProviderFoodDetailsPage;
