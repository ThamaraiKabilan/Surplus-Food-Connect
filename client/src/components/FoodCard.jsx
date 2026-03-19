import { 
  MapPin, Clock, User, ShieldCheck, 
  Hotel, Home, ExternalLink, AlertTriangle, 
  Navigation, Utensils, BadgeCheck 
} from "lucide-react";
import { buildAssetUrl } from "../api.js";

const FoodCard = ({
  food,
  onClaim,
  actionLabel = "Claim",
  showClaimAction = false
}) => {
  const isExpired = new Date(food.expiryTime) < new Date();
  const isAvailable = food.status === "available";
  const canSelect = showClaimAction && isAvailable && !isExpired && typeof onClaim === "function";
  const handleSelect = () => {
    if (canSelect) {
      onClaim(food);
    }
  };

  return (
    <article
      className={`group bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col relative overflow-hidden ${
        canSelect ? "cursor-pointer" : ""
      }`}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (canSelect && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClaim(food);
        }
      }}
      role={canSelect ? "button" : undefined}
      tabIndex={canSelect ? 0 : undefined}
    >
      
      {/* 1. TOP HEADER: STATUS & SOURCE */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-2">
           <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
             isAvailable ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
           }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
             {food.status}
           </div>
           
           <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200/50">
              {food.sourceType === "event" ? <Hotel size={12}/> : <Home size={12}/>}
              {food.sourceType === "event" ? "Hotel Source" : "Home Source"}
           </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{food.quantity}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Servings</p>
        </div>
      </div>

      {/* 2. MAIN INFO */}
      <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-cyan-600 transition-colors leading-tight">
        {food.foodName}
      </h3>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
          <Clock size={16} className="text-cyan-600" />
          <span className={`text-xs font-bold ${isExpired ? "text-rose-600" : "text-slate-600"}`}>
            {isExpired ? "Expired" : "Expires"}: {new Date(food.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-start gap-3 px-1">
          <MapPin size={16} className="text-cyan-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight leading-relaxed line-clamp-2">
            {food.location}
          </p>
        </div>
      </div>

      {/* 3. TRUST & LOGISTICS CHIPS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {typeof food.providerTrustScore === "number" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-xl text-[10px] font-black uppercase tracking-tight border border-cyan-100">
            <ShieldCheck size={12} /> Score: {food.providerTrustScore}
          </div>
        )}
        {typeof food.distanceScore === "number" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-tight border border-indigo-100">
            <Navigation size={12} /> {food.distanceScore.toFixed(1)}km
          </div>
        )}
        {food.sourceType === "home" && food.homeTermsAccepted && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
            <BadgeCheck size={12} className="text-cyan-400" /> Hygiene Verified
          </div>
        )}
      </div>

      {/* 4. FOOTER ACTIONS */}
      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-white shadow-sm">
              <User size={14} />
            </div>
            <span className="text-[11px] font-black text-slate-600 tracking-tight">{food.provider?.name || "Official Provider"}</span>
          </div>
          
          <div className="flex gap-2">
            {food.mapsUrl && (
              <a href={food.mapsUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-cyan-500 hover:text-white transition-all shadow-sm">
                <Navigation2 size={18} fill="currentColor" className="rotate-45" />
              </a>
            )}
            {food.sourceType === "event" && food.eventProofFileUrl && (
              <a href={buildAssetUrl(food.eventProofFileUrl)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>

        {isExpired && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 font-black text-[10px] uppercase tracking-widest">
            <AlertTriangle size={14} /> Pass Expiry Time
          </div>
        )}

        {showClaimAction && isAvailable && !isExpired && (
          <button 
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 text-sm"
            onClick={(event) => {
              event.stopPropagation();
              onClaim(food);
            }}
          >
            {actionLabel} <ChevronRight size={18} />
          </button>
        )}
      </div>
    </article>
  );
};

// Helper Icon for Navigation (Manual SVG if Lucide Navigation2 isn't loaded)
const Navigation2 = ({ size, className, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 19 21 12 17 5 21 12 2" />
  </svg>
);

const ChevronRight = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default FoodCard;
