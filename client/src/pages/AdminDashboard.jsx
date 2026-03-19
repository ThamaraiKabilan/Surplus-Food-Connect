import { useEffect, useState } from "react";
import { 
  Users, Package, ShieldCheck, AlertCircle, 
  RefreshCw, TrendingUp, Search, UserCheck, 
  ExternalLink, MoreVertical, Activity
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [foodListings, setFoodListings] = useState([]);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [usersData, foodData, overviewData] = await Promise.all([
        apiRequest("/admin/users", {}, user.token),
        apiRequest("/admin/food", {}, user.token),
        apiRequest("/admin/overview", {}, user.token)
      ]);
      setUsers(usersData);
      setFoodListings(foodData);
      setOverview(overviewData);
    } catch (err) { setError(err.message); }
    finally { setIsRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Admin Hub" subtitle="System-wide oversight & community trust management">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
        {/* --- 1. NEON STATS GRID --- */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={users.length} icon={<Users size={20}/>} color="cyan" />
          <StatCard title="Active Food" value={foodListings.length} icon={<Package size={20}/>} color="blue" />
          <StatCard title="Pending Verif." value={overview?.pendingVerifications || 0} icon={<ShieldCheck size={20}/>} color="emerald" />
          <StatCard title="Open Alerts" value={overview?.openComplaints || 0} icon={<AlertCircle size={20}/>} color="rose" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- 2. USER DIRECTORY (BENTO LEFT) --- */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Management Console</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name..." 
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] p-4 space-y-2 custom-scrollbar">
              {filteredUsers.map((u) => (
                <div key={u._id} className="group flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                  <div className="relative">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} 
                      className="w-12 h-12 rounded-2xl bg-slate-100 object-cover group-hover:scale-105 transition-transform" 
                      alt="avatar" 
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-800 leading-tight truncate">{u.name}</h3>
                    <p className="text-xs font-medium text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.role}
                    </span>
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* --- 3. LIVE FEED & TOP PERFORMERS (BENTO RIGHT) --- */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Top Performers Card */}
            <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black italic tracking-tight flex items-center gap-2">
                    <TrendingUp className="text-cyan-400" /> TRUST LEADERS
                  </h3>
                  <button onClick={fetchData} className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {(overview?.topTrust || []).slice(0, 3).map((item, idx) => (
                    <div key={item._id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black">{item.user?.name}</p>
                        <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                           <div className="bg-cyan-400 h-full" style={{ width: `${item.trustScore}%` }}></div>
                        </div>
                      </div>
                      <span className="text-cyan-400 font-black text-sm">{item.trustScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Recent Activity Card */}
            <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="text-slate-400" size={20} />
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Global Activity Feed</h3>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {foodListings.slice(0, 10).map((f) => (
                  <div key={f._id} className="flex items-center gap-4 group">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                    <div className="flex-1 border-b border-slate-50 pb-3">
                      <p className="text-sm font-bold text-slate-700 leading-none group-hover:text-cyan-600 transition-colors">{f.foodName}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-tighter">
                        {f.provider?.name} • {f.status}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-slate-300">NOW</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  );
};

// --- WONDERFUL STAT CARD ---
const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100 shadow-cyan-500/5",
    blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/5",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5",
    rose: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/5",
  };

  return (
    <div className={`p-6 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center text-center group`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 ${colors[color]} border shadow-lg`}>
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">{value}</p>
    </div>
  );
};

export default AdminDashboard;