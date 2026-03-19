import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Package, LogOut, User as UserIcon, Settings, 
  LayoutDashboard, ClipboardList, Trophy, Map, 
  LogIn, UserPlus, ShieldCheck, ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const Layout = ({ title, subtitle, children, showTopbar = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mapping icons to labels for a "Wonderful" visual experience
  const getIcon = (label) => {
    const map = {
      "Dashboard": <LayoutDashboard size={16} />,
      "Operations": <ClipboardList size={16} />,
      "Complaints": <ShieldCheck size={16} />,
      "Leaderboard": <Trophy size={16} />,
      "Map View": <Map size={16} />,
      "Admin": <Settings size={16} />
    };
    return map[label] || <Package size={16} />;
  };

  const navLinks = user
    ? user.role === "provider"
      ? [
          { to: "/provider", label: "Dashboard" },
          { to: "/provider-activity", label: "Operations" },
          { to: "/leaderboard", label: "Leaderboard" },
          { to: "/map", label: "Map View" }
        ]
      : user.role === "ngo"
        ? [
            { to: "/ngo", label: "Dashboard" },
            { to: "/complaints", label: "Complaints" },
            { to: "/leaderboard", label: "Leaderboard" },
            { to: "/map", label: "Map View" }
          ]
        : [
            { to: "/admin", label: "Admin" },
            { to: "/complaints", label: "Complaints" },
            { to: "/leaderboard", label: "Leaderboard" },
            { to: "/map", label: "Map View" }
          ]
    : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-cyan-100 selection:text-cyan-900">
      
      {/* --- 1. STICKY TOPBAR (GLASSMORPHISM) --- */}
      {showTopbar && (
        <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-200/60 transition-all">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-6">
            
            {/* Logo Section */}
            <div className="flex items-center shrink-0 min-w-0">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Package className="text-white w-6 h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xl font-black tracking-tighter text-slate-900 leading-none">
                    SFC<span className="text-cyan-600">.</span>
                  </span>
                  {subtitle && (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1 hidden 2xl:block truncate max-w-[24rem]">
                      {subtitle}
                    </span>
                  )}
                </div>
              </Link>
            </div>

            {navLinks.length > 0 && (
              <div className="hidden lg:flex flex-1 justify-center min-w-0">
                <nav className="inline-flex items-center bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm max-w-full overflow-hidden">
                  {navLinks.map((item) => (
                    <Link 
                      key={item.to} 
                      to={item.to} 
                      className={`flex items-center gap-2.5 px-5 xl:px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                        location.pathname === item.to 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {getIcon(item.label)}
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Action Section */}
            <div className="flex items-center gap-3 ml-auto shrink-0">
              {user ? (
                <>
                  {/* Role Specific Profile Link */}
                  {user.role === "provider" && (
                    <Link to="/provider-mode" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-white hover:text-cyan-600 hover:shadow-sm transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-slate-200">
                      <Settings size={14} /> Supply Profile
                    </Link>
                  )}
                  {user.role === "ngo" && (
                    <Link to="/ngo-profile" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-white hover:text-cyan-600 hover:shadow-sm transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-slate-200">
                      <UserIcon size={14} /> Community Profile
                    </Link>
                  )}

                  {/* User Badge */}
                  <div className="h-10 pl-4 pr-1 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-slate-800 leading-none">{user.name?.split(" ")[0] || "User"}</span>
                      <span className="text-[9px] font-black text-cyan-600 uppercase tracking-widest mt-0.5">{user.role}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                      {user.name?.charAt(0) || "U"}
                    </div>
                  </div>

                  {/* Logout */}
                  <button 
                    onClick={handleLogout} 
                    className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 group"
                    title="Logout"
                  >
                    <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                    <LogIn size={16} /> Login
                  </Link>
                  <Link to="/register" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-95">
                    <UserPlus size={16} /> Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* --- 2. MAIN PAGE WRAPPER --- */}
      <main className={`max-w-7xl mx-auto px-6 pb-20 ${showTopbar ? 'pt-24' : 'pt-10'}`}>
        
        {/* Navigation Strip & Title */}
        <div className="mb-10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">

          {title && (
            <div className="flex flex-col gap-2">
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                {title.split(' ').map((word, i) => (
                  <span key={i} className={i === title.split(' ').length - 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600" : ""}>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              <div className="w-20 h-2 bg-cyan-500 rounded-full mt-2"></div>
            </div>
          )}
        </div>

        {/* --- 3. PAGE CONTENT --- */}
        <div className="animate-in fade-in zoom-in-95 duration-500">
          {children}
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="py-12 flex flex-col items-center justify-center opacity-30 border-t border-slate-100 mt-20">
        <div className="flex items-center gap-2 mb-2">
          <Package size={16} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Surplus Food Connect</span>
        </div>
        <p className="text-[9px] font-bold text-slate-400">© 2026 Sustainable Impact Network</p>
      </footer>
    </div>
  );
};

export default Layout;
