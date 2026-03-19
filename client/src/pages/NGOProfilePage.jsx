import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, MapPin, Navigation, RefreshCw, 
  CloudUpload, FileText, CheckCircle2, AlertCircle, 
  ExternalLink, Eye, LayoutDashboard, ArrowRight,
  Building2, Fingerprint 
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest, buildAssetUrl } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getCurrentLocationDetails } from "../utils/location.js";

const NGOProfilePage = () => {
  const { user, setUser } = useAuth();
  const [verification, setVerification] = useState(null);
  const [profile, setProfile] = useState({
    name: user.name || "",
    location: user.location || "",
    fullAddress: user.fullAddress || "",
    latitude: user.latitude || "",
    longitude: user.longitude || ""
  });
  const [ngoFiles, setNgoFiles] = useState({
    ngoRegistrationCertificate: null,
    idProof: null
  });
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchVerification = async () => {
    try {
      const data = await apiRequest("/verification/mine", {}, user.token);
      setVerification(data);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { fetchVerification(); }, [user.token]);

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
      setSuccess("Community location synchronized.");
    } catch (err) { setError(err.message); }
    finally { setLocating(false); }
  };

  const uploadNgoProof = async (e) => {
    e.preventDefault();
    setUploading(true); setError(""); setSuccess("");
    try {
      const payload = new FormData();
      if (ngoFiles.ngoRegistrationCertificate) payload.append("ngoRegistrationCertificate", ngoFiles.ngoRegistrationCertificate);
      if (ngoFiles.idProof) payload.append("idProof", ngoFiles.idProof);

      await apiRequest("/verification/upload", { method: "POST", body: payload }, user.token);
      setNgoFiles({ ngoRegistrationCertificate: null, idProof: null });
      setSuccess("Verification documents updated successfully.");
      fetchVerification();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  return (
    <Layout>
      {/* --- HEADER --- */}
      <header className="mb-12">
        <div className="flex items-center gap-2 text-cyan-600 font-bold text-sm mb-3">
           <Building2 size={18} /> ORGANIZATION IDENTITY
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Community Profile</h1>
        <p className="text-slate-500 font-medium mt-1 max-w-2xl">
          Maintain your organization's location for accurate food matching and keep your trust documents up to date.
        </p>
      </header>

      {/* --- NOTIFICATIONS --- */}
      {(error || success) && (
        <div className={`mb-10 p-5 rounded-2xl flex items-center gap-3 font-bold animate-in fade-in slide-in-from-top-4 ${
          error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
        }`}>
          {error ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* --- LEFT: LOCATION RADAR --- */}
        <section className="lg:col-span-5 space-y-6 sticky top-28">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-cyan-500"></div>
             
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 shadow-inner">
                  <MapPin size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800">NGO Location</h3>
             </div>

             <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 relative">
                  <span className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Matching Spotlight</span>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">{profile.location || "Click detect..."}</h4>
                  <p className="text-sm font-bold text-slate-400 mt-2 leading-relaxed italic">{profile.fullAddress || "Your location is used to filter nearby surplus listings."}</p>
                </div>

                <button onClick={useCurrentLocation} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/30 hover:text-cyan-600 font-black text-slate-500 transition-all active:scale-95 group">
                  {locating ? <RefreshCw className="animate-spin" /> : <Navigation size={20} className="group-hover:rotate-12 transition-transform" />}
                  {locating ? "PINPOINTING..." : "SYNC GPS LOCATION"}
                </button>

                <Link to="/ngo" className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] group">
                  Open Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
             </div>
          </div>

          <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex gap-4">
             <ShieldCheck size={24} className="text-blue-600 shrink-0" />
             <p className="text-xs font-bold text-blue-800 leading-relaxed">
               Updating your location ensures the "Nearby" algorithm prioritizes fresh food listings closest to your distribution center.
             </p>
          </div>
        </section>

        {/* --- RIGHT: DOCUMENT VAULT --- */}
        <section className="lg:col-span-7 space-y-8">
          <form onSubmit={uploadNgoProof} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
               <CloudUpload className="text-cyan-600" /> Document Vault
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Registration Certificate */}
              <label className="relative cursor-pointer group">
                <div className={`h-full p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 flex flex-col items-center text-center transition-all group-hover:border-cyan-200 ${ngoFiles.ngoRegistrationCertificate ? 'border-emerald-200 bg-emerald-50' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${ngoFiles.ngoRegistrationCertificate ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    {ngoFiles.ngoRegistrationCertificate ? <CheckCircle2 size={24}/> : <Building2 size={24}/>}
                  </div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Registration</h5>
                  <p className="text-[10px] font-bold text-slate-400">NGO Certificate / Trust Deed</p>
                  {ngoFiles.ngoRegistrationCertificate && <span className="mt-3 text-[10px] font-black text-emerald-600 truncate max-w-full italic">{ngoFiles.ngoRegistrationCertificate.name}</span>}
                </div>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setNgoFiles(prev => ({ ...prev, ngoRegistrationCertificate: e.target.files?.[0] || null }))} />
              </label>

              {/* ID Proof */}
              <label className="relative cursor-pointer group">
                <div className={`h-full p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 flex flex-col items-center text-center transition-all group-hover:border-cyan-200 ${ngoFiles.idProof ? 'border-emerald-200 bg-emerald-50' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${ngoFiles.idProof ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    {ngoFiles.idProof ? <CheckCircle2 size={24}/> : <Fingerprint size={24}/>}
                  </div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Lead ID Proof</h5>
                  <p className="text-[10px] font-bold text-slate-400">Aadhar / NGO Head Identity</p>
                  {ngoFiles.idProof && <span className="mt-3 text-[10px] font-black text-emerald-600 truncate max-w-full italic">{ngoFiles.idProof.name}</span>}
                </div>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setNgoFiles(prev => ({ ...prev, idProof: e.target.files?.[0] || null }))} />
              </label>
            </div>

            <button disabled={uploading} type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-cyan-200 transition-all active:scale-[0.98]">
              {uploading ? "Securing Documents..." : verification ? "Update Stored Proof" : "Save NGO Proof"}
            </button>
          </form>

          {/* STORED DOCUMENTS LIST */}
          {verification?.documents?.length ? (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
               
               <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10">
                 <ShieldCheck className="text-cyan-400" /> Stored Verification
               </h3>

               <div className="space-y-3 relative z-10">
                 {verification.documents.map((doc, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-cyan-400">
                           <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight">{doc.label}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization Doc</p>
                        </div>
                      </div>
                      <a href={buildAssetUrl(doc.fileUrl)} target="_blank" className="p-3 rounded-xl bg-white/10 text-white hover:bg-cyan-500 transition-all">
                        <Eye size={18} />
                      </a>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
               <FileText size={48} className="mx-auto mb-4 text-slate-200" />
               <p className="font-bold text-slate-400">No organizational proof stored yet.</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default NGOProfilePage;