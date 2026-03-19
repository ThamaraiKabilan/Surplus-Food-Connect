import { useEffect, useState } from "react";
import { 
  ShieldCheck, MapPin, RefreshCw, ExternalLink, 
  CheckCircle2, XCircle, Clock, Image as ImageIcon, 
  History, ClipboardList, Info, AlertCircle, 
  ChevronRight, ArrowUpRight, Search, Activity
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest, buildAssetUrl } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const ProviderActivityPage = () => {
  const { user } = useAuth();
  const [nearbyNgos, setNearbyNgos] = useState([]);
  const [claims, setClaims] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ngoData, claimData, proofData] = await Promise.all([
        apiRequest("/food/nearby-ngos", {}, user.token),
        apiRequest("/claims", {}, user.token),
        apiRequest("/proof", {}, user.token)
      ]);
      setNearbyNgos(ngoData);
      setClaims(claimData);
      setProofs(proofData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const reviewProof = async (proofId, status) => {
    setError(""); setSuccess("");
    try {
      await apiRequest(`/proof/${proofId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      }, user.token);
      setSuccess(`Record successfully updated to: ${status}`);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  return (
    <Layout>
      {/* --- 1. DASHBOARD HEADER --- */}
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
              <Activity className="w-4 h-4" /> Operations Dashboard
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">
              Operations <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Hub</span>
            </h1>
            <p className="text-slate-500 font-medium">Verify community impact and manage distribution logistics.</p>
          </div>
          
          <button 
            onClick={fetchData} 
            className="group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-slate-200 transition-all hover:bg-black active:scale-95"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"} /> 
            SYNC RECENT DATA
          </button>
        </header>

        {/* --- 2. NOTIFICATIONS --- */}
        {(error || success) && (
          <div className={`mb-10 p-5 rounded-3xl flex items-center gap-4 font-bold border animate-in slide-in-from-top-4 ${
            error ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${error ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
               {error ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
            </div>
            {error || success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- 3. LEFT COLUMN: TRUSTED PARTNERS --- */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-2 px-2">
              <ShieldCheck className="text-cyan-600" size={20} />
              <h2 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Trusted Partners</h2>
            </div>
            
            <div className="space-y-4">
              {nearbyNgos.length ? (
                nearbyNgos.slice(0, 5).map((ngo) => (
                  <div key={ngo._id} className="bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <h3 className="font-black text-slate-800 group-hover:text-cyan-600 transition-colors leading-tight mb-3">{ngo.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">Score: {ngo.trustScore}</span>
                      <span className="bg-cyan-50 text-cyan-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">Near: {Number(ngo.distanceScore || 0).toFixed(1)}km</span>
                    </div>

                    <a href={ngo.mapsUrl} target="_blank" className="flex items-center justify-between text-[11px] font-black text-slate-400 hover:text-cyan-600 transition-colors">
                      LOCATE ON MAP <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))
              ) : (
                <div className="bg-slate-100 rounded-[2rem] p-10 text-center border-2 border-dashed border-slate-200">
                  <Search className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">No NGOs found nearby.</p>
                </div>
              )}
            </div>
          </aside>

          {/* --- 4. MIDDLE COLUMN: AWAITING APPROVAL --- */}
          <section className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 px-2">
              <ClipboardList className="text-blue-600" size={20} />
              <h2 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Awaiting Verification</h2>
            </div>

            <div className="space-y-6">
              {claims.filter(c => c.proof?.status === "pending").length ? (
                claims.filter(c => c.proof?.status === "pending").map((claim) => (
                  <div key={claim._id} className="bg-white border-2 border-cyan-100 p-8 rounded-[2.5rem] shadow-2xl shadow-cyan-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-cyan-600 text-white text-[10px] font-black px-5 py-2 rounded-bl-2xl tracking-[0.1em]">
                      REVIEW REQUIRED
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{claim.foodId?.foodName || "Food Batch"}</h3>
                    <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                      <Info size={14} className="text-cyan-500" /> Handed over to {claim.ngo?.name}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Geo-Location</p>
                        <div className={`flex items-center gap-2 text-xs font-black ${claim.proof?.geoTagMatched ? "text-emerald-600" : "text-rose-600"}`}>
                          {claim.proof?.geoTagMatched ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                          {claim.proof?.geoTagMatched ? "MATCHED" : "MISMATCH"}
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">SLA Deadline</p>
                        <div className={`flex items-center gap-2 text-xs font-black ${claim.proof?.submittedWithinDeadline ? "text-emerald-600" : "text-rose-600"}`}>
                           <Clock size={14}/>
                           {claim.proof?.submittedWithinDeadline ? "ON TIME" : "DELAYED"}
                        </div>
                      </div>
                    </div>

                    <a 
                      href={buildAssetUrl(claim.proof?.imageUrl)} 
                      target="_blank" 
                      className="mt-6 flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-black transition-all group/btn"
                    >
                      <ImageIcon size={20} className="text-cyan-400 group-hover/btn:scale-110 transition-transform" /> 
                      OPEN PROOF IMAGE
                    </a>

                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => reviewProof(claim.proof._id, "approved")} 
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => reviewProof(claim.proof._id, "denied")} 
                        className="flex-1 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 font-black py-4 rounded-2xl transition-all active:scale-95"
                      >
                        Deny Proof
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">Clear Workspace</h3>
                  <p className="text-slate-400 font-bold text-sm mt-2">All pending proofs have been reviewed.</p>
                </div>
              )}
            </div>
          </section>

          {/* --- 5. RIGHT COLUMN: ACTIVITY TIMELINE --- */}
          <section className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2 px-2">
              <History className="text-slate-400" size={20} />
              <h2 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Recent Activity</h2>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-2 space-y-1">
                {proofs.length ? (
                  proofs.slice(0, 8).map((proof, idx) => (
                    <div key={proof._id} className={`p-5 flex items-start gap-4 rounded-[1.5rem] transition-colors hover:bg-slate-50 ${idx !== proofs.length -1 ? "border-b border-slate-50" : ""}`}>
                      <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-inner ${
                        proof.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {proof.status === 'approved' ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                           <h4 className="font-black text-slate-800 text-sm truncate">{proof.claim?.foodId?.foodName || "Distribution"}</h4>
                           <ChevronRight size={14} className="text-slate-300 mt-1" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{proof.ngo?.name}</p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest ${
                            proof.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {proof.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 tabular-nums">
                            {new Date(proof.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-300 font-black italic uppercase text-xs tracking-widest">
                    History Empty
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                 <button className="text-[10px] font-black text-slate-400 hover:text-cyan-600 uppercase tracking-widest transition-colors">
                    View Full Archive
                 </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default ProviderActivityPage;
