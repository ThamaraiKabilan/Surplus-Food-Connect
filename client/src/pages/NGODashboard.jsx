import { useEffect, useState } from "react";
import { 
  MapPin, Navigation, RefreshCw, Search, 
  Package, CheckCircle2, AlertCircle, Clock, 
  ChevronRight, Camera, FileText, ExternalLink,
  ShieldCheck, Info, Utensils, ClipboardList, Mail, User
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import FoodCard from "../components/FoodCard.jsx";
import { apiRequest, buildAssetUrl } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getCurrentLocationDetails } from "../utils/location.js";

const PROOF_DEADLINE_HOURS = 24;

const NGODashboard = () => {
  const { user, setUser } = useAuth();
  const [locationFilter, setLocationFilter] = useState(user?.location || "");
  const [currentAddress, setCurrentAddress] = useState(user?.fullAddress || "");
  const [foodListings, setFoodListings] = useState([]);
  const [claims, setClaims] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [proofForms, setProofForms] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locating, setLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchListings = async (location = locationFilter, latitude = user?.latitude, longitude = user?.longitude) => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (location) params.set("location", location);
      if (latitude) params.set("latitude", latitude);
      if (longitude) params.set("longitude", longitude);
      const query = params.toString() ? `/food?${params.toString()}` : "/food";
      const data = await apiRequest(query, {}, user.token);
      setFoodListings(data);
    } catch (err) { setError(err.message); }
    finally { setIsRefreshing(false); }
  };

  const fetchClaims = async () => {
    try {
      const data = await apiRequest("/claims/my-claims", {}, user.token);
      setClaims(data);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => {
    fetchListings(user?.location || "", user?.latitude, user?.longitude);
    fetchClaims();
  }, []);

  const confirmClaim = async () => {
    if (!selectedFood) return;
    setError(""); setSuccess("");
    try {
      await apiRequest("/claims", { method: "POST", body: JSON.stringify({ foodId: selectedFood._id }) }, user.token);
      setSuccess("Food successfully claimed for your NGO.");
      setSelectedFood(null);
      fetchListings();
      fetchClaims();
    } catch (err) { setError(err.message); }
  };

  const updateProofForm = (claimId, field, value) => {
    setProofForms((prev) => ({ ...prev, [claimId]: { ...(prev[claimId] || {}), [field]: value } }));
  };

  const uploadProof = async (claim) => {
    const formState = proofForms[claim._id] || {};
    const payload = new FormData();
    payload.append("claimId", claim._id);
    payload.append("notes", formState.notes || "");
    payload.append("geoTagLocation", formState.geoTagLocation || user.location || "");
    if (formState.image) payload.append("image", formState.image);

    try {
      await apiRequest("/proof", { method: "POST", body: payload }, user.token);
      setSuccess("Distribution proof submitted. Your trust score will be updated upon review.");
      fetchClaims();
    } catch (err) { setError(err.message); }
  };

  const useCurrentLocation = async () => {
    setLocating(true); setError("");
    try {
      const loc = await getCurrentLocationDetails();
      const updatedUser = await apiRequest("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ ...user, ...loc })
      }, user.token);
      setUser(updatedUser);
      setLocationFilter(loc.location);
      setCurrentAddress(loc.fullAddress);
      setSuccess("GPS Location Synchronized.");
      fetchListings(loc.location, loc.latitude, loc.longitude);
    } catch (err) { setError(err.message); }
    finally { setLocating(false); }
  };

  return (
    <Layout title="NGO Dashboard" subtitle="Identify surplus food and coordinate distribution">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
        {/* --- 1. TOP BENTO: LOCATION & SEARCH --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 shrink-0 border border-cyan-100">
              <MapPin size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Distribution Zone</p>
              <h4 className="text-xl font-black text-slate-900 truncate mt-1">{locationFilter || "Locating..."}</h4>
              <p className="text-xs font-bold text-slate-500 truncate mt-1 italic">{currentAddress || "Tap detect to sync GPS"}</p>
            </div>
            <div className="flex gap-2 shrink-0">
               <button onClick={useCurrentLocation} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">
                  {locating ? <RefreshCw className="animate-spin" size={20}/> : <Navigation size={20}/>}
               </button>
               <button onClick={() => fetchListings()} className="bg-cyan-600 hover:bg-cyan-700 text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-cyan-200 transition-all active:scale-95 flex items-center gap-2">
                  <Search size={18}/> Search Nearby
               </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white flex items-center gap-5 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Your Impact</p>
              <h4 className="text-3xl font-black mt-1">{claims.length}</h4>
              <p className="text-xs font-bold text-slate-400 mt-1">Verified Claims</p>
            </div>
          </div>
        </section>

        {(error || success) && (
          <div className={`p-5 rounded-2xl flex items-center gap-3 font-bold animate-in fade-in slide-in-from-top-4 ${
            error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            {error ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
            <span className="text-sm">{error || success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- 2. LEFT: MARKETPLACE --- */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Review Card (Appears on selection) */}
            {selectedFood && (
              <div className="bg-slate-50 border-4 border-cyan-500 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <Utensils className="text-cyan-600" size={24} />
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Claim Review</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Food Item</p>
                      <p className="text-lg font-black text-slate-800 leading-none">{selectedFood.foodName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                      <p className="text-lg font-black text-slate-800 leading-none">{selectedFood.quantity}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provider Trust</p>
                      <div className="flex items-center gap-1.5 text-cyan-600 font-black">
                         <ShieldCheck size={16} /> {selectedFood.providerTrustScore || 0}/10
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup Address</p>
                      <p className="text-xs font-bold text-slate-600 line-clamp-2">{selectedFood.fullAddress || selectedFood.location}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provider Details</p>
                      <h4 className="text-lg font-black text-slate-900">{selectedFood.provider?.name || "Provider not available"}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Name</p>
                      <p className="text-sm font-bold text-slate-700">{selectedFood.provider?.name || "Not shared"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</p>
                      <p className="text-sm font-bold text-slate-700 break-all">{selectedFood.provider?.email || "Not shared"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Area</p>
                      <p className="text-sm font-bold text-slate-700">{selectedFood.provider?.location || selectedFood.location || "Not available"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSelectedFood(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={confirmClaim} className="flex-2 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95">
                    Confirm & Capture Food
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <RefreshCw size={20} className={`text-cyan-600 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                Available Surplus
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {foodListings.length ? (
                foodListings.map((food) => (
                  <FoodCard
                    key={food._id}
                    food={food}
                    onClaim={setSelectedFood}
                    showClaimAction
                    actionLabel="Review & Claim"
                  />
                ))
              ) : (
                <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] py-20 text-center">
                  <Package size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="font-bold text-slate-400">No surplus food currently listed in your area.</p>
                </div>
              )}
            </div>
          </section>

          {/* --- 3. RIGHT: ACTIVITY & PROOF --- */}
          <section className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight px-2 flex items-center gap-2">
              <Clock size={22} className="text-slate-400" /> Active Claims
            </h2>

            <div className="space-y-6">
              {claims.length ? (
                claims.map((claim) => {
                  const proofDeadline = new Date(
                    new Date(claim.timestamp).getTime() + PROOF_DEADLINE_HOURS * 60 * 60 * 1000
                  );
                  const isSubmitted = !!claim.proof;

                  return (
                    <div key={claim._id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="text-lg font-black text-slate-900 truncate pr-4">{claim.foodId?.foodName || "Food Item"}</h3>
                         <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                           {isSubmitted ? 'Proof Ready' : 'Pending Proof'}
                         </div>
                      </div>

                      <div className="space-y-2 mb-6 text-sm font-medium text-slate-500">
                        <div className="flex items-center gap-2">
                          <Info size={14} className="text-cyan-600" />
                          <span>Provider: {claim.provider?.name}</span>
                        </div>
                        {!isSubmitted && (
                          <div className="flex items-center gap-2 text-rose-500 font-bold">
                            <Clock size={14} />
                            <span>
                              Deadline: {proofDeadline.toLocaleString([], {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })} ({PROOF_DEADLINE_HOURS} hrs)
                            </span>
                          </div>
                        )}
                      </div>

                      {isSubmitted ? (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                           <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                              <span>Review: {claim.proof.status}</span>
                              <span>Geo: {claim.proof.geoTagMatched ? '✓' : '✗'}</span>
                           </div>
                           <a href={buildAssetUrl(claim.proof.imageUrl)} target="_blank" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:text-cyan-600 transition-colors">
                             <ExternalLink size={14} /> View Submission
                           </a>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all min-h-[80px]"
                            placeholder="Briefly describe the distribution (e.g. delivered to local shelter)"
                            value={proofForms[claim._id]?.notes || ""}
                            onChange={(e) => updateProofForm(claim._id, "notes", e.target.value)}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <label className="relative cursor-pointer group">
                               <div className="flex items-center justify-center gap-2 py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl group-hover:bg-slate-100 transition-colors">
                                  <Camera size={14} className="text-slate-400 group-hover:text-cyan-600" />
                                  <span className="text-[10px] font-black text-slate-500 uppercase truncate">
                                    {proofForms[claim._id]?.image ? "Attached" : "Photo Proof"}
                                  </span>
                               </div>
                               <input type="file" accept="image/*" className="hidden" onChange={(e) => updateProofForm(claim._id, "image", e.target.files?.[0] || null)} />
                            </label>
                            <input
                              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-[10px] font-black uppercase outline-none focus:border-cyan-500 transition-all placeholder:text-slate-300"
                              placeholder="Place Name"
                              value={proofForms[claim._id]?.geoTagLocation || ""}
                              onChange={(e) => updateProofForm(claim._id, "geoTagLocation", e.target.value)}
                            />
                          </div>
                          <button onClick={() => uploadProof(claim)} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 text-sm">
                            Submit Proof <CheckCircle2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-100 rounded-[2.5rem] py-16 text-center text-slate-400 font-bold px-6">
                  <ClipboardList size={40} className="mx-auto mb-4 opacity-20" />
                  No claimed food found. Ready to feed the community?
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default NGODashboard;
