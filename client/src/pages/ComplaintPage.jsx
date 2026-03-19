import { useEffect, useState } from "react";
import { 
  AlertTriangle, CheckCircle, Clock, Image as ImageIcon, 
  MessageSquare, User, FileText, Search, RefreshCw, 
  ChevronRight, ExternalLink, ShieldAlert
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest, buildAssetUrl } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const ComplaintPage = () => {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [claims, setClaims] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({
    claimId: "",
    providerId: "",
    description: ""
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const complaintsData = await apiRequest("/complaints", {}, user.token);
      setComplaints(complaintsData);

      if (!isAdmin) {
        const claimsData = await apiRequest("/claims/my-claims", {}, user.token);
        setClaims(claimsData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitComplaint = async (event) => {
    event.preventDefault();
    setError(""); setSuccess("");

    if (!formData.claimId) return setError("Please select a specific claim.");

    const payload = new FormData();
    payload.append("claimId", formData.claimId);
    payload.append("providerId", formData.providerId);
    payload.append("description", formData.description);
    if (image) payload.append("image", image);

    try {
      await apiRequest("/complaints", { method: "POST", body: payload }, user.token);
      setFormData({ claimId: "", providerId: "", description: "" });
      setImage(null);
      setSuccess("Report submitted. Our team will investigate immediately.");
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const resolveComplaint = async (complaintId) => {
    try {
      await apiRequest(`/complaints/${complaintId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({})
      }, user.token);
      setSuccess("Issue marked as resolved.");
      fetchData();
    } catch (err) { setError(err.message); }
  };

  return (
    <Layout title="Conflict Resolution" subtitle="Ensuring food safety and community trust">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
        {/* --- 1. HEADER & STATUS --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Complaint Registry</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">{complaints.length} Records Found</p>
            </div>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> Sync Feed
          </button>
        </div>

        {(error || success) && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold animate-in fade-in slide-in-from-top-4 ${
            error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            {error ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
            {error || success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- 2. NGO FILING FORM (LEFT) --- */}
          {!isAdmin && (
            <aside className="lg:col-span-4 sticky top-28">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>
                <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <AlertTriangle className="text-rose-500" size={24} /> File Report
                </h3>
                
                <form onSubmit={submitComplaint} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Related Claim</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-bold text-sm"
                      value={formData.claimId}
                      onChange={(e) => {
                        const selected = claims.find((item) => item._id === e.target.value);
                        setFormData({ ...formData, claimId: e.target.value, providerId: selected?.provider?._id || "" });
                      }}
                    >
                      <option value="">Choose item...</option>
                      {claims.map((claim) => (
                        <option key={claim._id} value={claim._id}>
                          {claim.foodId?.foodName} ({claim.provider?.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Issue Description</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-sm min-h-[120px]"
                      placeholder="Describe spoilage, hygiene or delivery issues..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Visual Evidence</label>
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 group-hover:border-cyan-500 transition-all">
                        <ImageIcon size={24} className="text-slate-300 group-hover:text-cyan-500 mb-2" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">
                          {image ? image.name : "Upload Photo Proof"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                    Raise Complaint <ChevronRight size={18}/>
                  </button>
                </form>
              </div>
            </aside>
          )}

          {/* --- 3. COMPLAINTS LIST (RIGHT) --- */}
          <section className={`${isAdmin ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
            {complaints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {complaints.map((complaint) => (
                  <div key={complaint._id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                        complaint.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {complaint.status === 'open' ? <Clock size={12}/> : <CheckCircle size={12}/>}
                        {complaint.status}
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase italic">
                        ID: {complaint._id.slice(-6)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">
                      {complaint.claim?.foodId?.foodName || "General Report"}
                    </h3>

                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-slate-500">
                        <User size={14} className="text-cyan-600" />
                        <span className="text-xs font-bold truncate">NGO: {complaint.ngo?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <ShieldAlert size={14} className="text-rose-600" />
                        <span className="text-xs font-bold truncate">Provider: {complaint.provider?.name}</span>
                      </div>
                      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={14} className="text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-xs font-medium text-slate-600 italic leading-relaxed">
                            "{complaint.description}"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <a href={buildAssetUrl(complaint.imageUrl)} target="_blank" className="flex items-center gap-2 text-xs font-black text-cyan-600 hover:text-blue-700">
                        <ImageIcon size={14} /> VIEW PROOF <ExternalLink size={12} />
                      </a>
                      
                      {isAdmin && complaint.status === "open" ? (
                        <button 
                          onClick={() => resolveComplaint(complaint._id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
                        >
                          Resolve Now
                        </button>
                      ) : (
                        complaint.status === 'resolved' && (
                          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle size={14} /> Closed
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-24 flex flex-col items-center justify-center text-center px-10">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <ShieldAlert size={40} className="text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-300">Clean Registry</h3>
                <p className="text-slate-400 font-medium max-w-xs mt-2 italic">
                  No issues reported yet. This community is doing a great job maintaining standards!
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ComplaintPage;