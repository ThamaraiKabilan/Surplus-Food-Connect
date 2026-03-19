import { Bell, PackageCheck, MapPin, ChevronRight, Sparkles } from "lucide-react";

const NotificationBanner = ({ items }) => {
  if (!items || !items.length) {
    return null;
  }

  return (
    <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Banner Header */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="relative">
          <Bell size={18} className="text-cyan-600 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-50"></span>
        </div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
          Live Claim Alerts
        </h2>
        <span className="ml-auto bg-cyan-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
          {items.length} NEW
        </span>
      </div>

      {/* Notification List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <div 
            key={item._id} 
            className="group relative bg-white/80 backdrop-blur-xl border border-cyan-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all cursor-default overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
               <PackageCheck size={80} />
            </div>

            <div className="flex items-start gap-4 relative z-10">
              {/* Icon Container */}
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0 border border-cyan-100">
                <PackageCheck size={20} />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  <span className="text-cyan-600">{item.foodName}</span> was successfully claimed
                </p>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter truncate">
                      {item.claimedBy?.name || "Verified NGO"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400 truncate">
                      {item.location}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight size={16} className="text-slate-200 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all mt-1" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NotificationBanner;