import { useEffect, useState } from "react";
import { 
  Trophy, Star, MapPin, Activity, 
  Award, Medal, Crown, TrendingUp, AlertCircle,
  RefreshCw // <--- Added this missing import
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { apiRequest } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const LeaderboardTable = ({ title, rows }) => {
  // Separate top 3 for the "Podium" look
  const topThree = rows.slice(0, 3);
  const theRest = rows.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* --- PODIUM SECTION (TOP 3) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topThree.map((row) => (
          <div key={row._id} className="relative group">
            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${
              row.rank === 1 ? "bg-amber-400" : row.rank === 2 ? "bg-slate-300" : "bg-amber-600"
            }`}>
              {row.rank === 1 ? <Crown size={18} className="text-white" /> : <Trophy size={16} className="text-white" />}
            </div>
            
            <div className={`pt-10 pb-8 px-6 rounded-[2.5rem] bg-white border-2 text-center transition-all group-hover:-translate-y-2 group-hover:shadow-2xl ${
              row.rank === 1 ? "border-amber-200 ring-8 ring-amber-50" : "border-slate-100 shadow-sm"
            }`}>
              <h3 className="text-xl font-black text-slate-900 truncate">{row.user?.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center justify-center gap-1">
                <MapPin size={10} /> {row.user?.location || row.user?.fullAddress || "Partner"}
              </p>

              <div className="mt-6 flex items-center justify-around border-t border-slate-50 pt-6">
                <div className="text-center">
                  <p className="text-sm font-black text-slate-900">{row.totalContributions}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Shares</p>
                </div>
                <div className="h-8 w-px bg-slate-100"></div>
                <div className="text-center">
                  <p className="text-sm font-black text-cyan-600 flex items-center gap-1">
                    <Star size={12} fill="currentColor" /> {row.trustScore}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Trust</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- LIST SECTION (REMAINDER) --- */}
      <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-600" /> Professional Rankings
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Order</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-8 py-4">Rank</th>
                <th className="px-8 py-4">Organization</th>
                <th className="px-8 py-4">Location</th>
                <th className="px-8 py-4 text-center">Contributions</th>
                <th className="px-8 py-4 text-right">Trust Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {theRest.map((row) => (
                <tr key={row._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-800 group-hover:text-cyan-600 transition-colors">
                    {row.user?.name}
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-300" />
                      {row.user?.location || "Not set"}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
                      {row.totalContributions} units
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-cyan-600">
                    <div className="flex items-center justify-end gap-1">
                      <Star size={14} fill="currentColor" /> {row.trustScore}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {rows.length === 0 && (
          <div className="py-20 text-center">
            <Activity size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="font-bold text-slate-400 uppercase text-xs tracking-widest">No rankings available yet</p>
          </div>
        )}
      </section>
    </div>
  );
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await apiRequest("/leaderboard", {}, user.token);
        setRows(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, [user.token]);

  return (
    <Layout>
      {/* --- HEADER --- */}
      <header className="mb-12">
        <div className="flex items-center gap-3 text-cyan-600 font-bold text-sm mb-3">
          <Award size={20} /> GLOBAL IMPACT RANKINGS
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Trust <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Leaderboard</span>
        </h1>
        <p className="text-slate-500 font-medium mt-2 max-w-xl">
          Recognizing the most reliable organizations contributing to the surplus food ecosystem.
        </p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-center gap-3 font-bold animate-shake">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw className="animate-spin text-cyan-500" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Standings...</p>
        </div>
      ) : (
        <LeaderboardTable
          title={user?.role === "provider" ? "NGO Rankings" : "Provider Rankings"}
          rows={rows}
        />
      )}
    </Layout>
  );
};

export default LeaderboardPage;