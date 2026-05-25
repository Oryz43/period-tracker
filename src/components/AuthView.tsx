import { useState, FormEvent } from "react";
import { Sparkles, Heart, Mail, Lock, User as UserIcon, Calendar as CalIcon, ChevronRight } from "lucide-react";

interface AuthViewProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [cycleLength, setCycleLength] = useState<string>("28");
  const [periodLength, setPeriodLength] = useState<string>("5");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const url = isRegister ? "/api/auth/register" : "/api/auth/login";
    const bodyPayload = isRegister 
      ? { name, email, password, cycleLength: Number(cycleLength), periodLength: Number(periodLength) }
      : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.message || "Terdapat kendala ketersediaan session.");
      }
    } catch (err) {
      setErrorMsg("Gagal melakukan verifikasi akun. Periksa server.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail("oryza@example.com");
    setPassword("password123");
    setIsRegister(false);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Visual background flares */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6.5 max-w-sm w-full shadow-lg relative z-10 space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-6 h-6 fill-rose-50" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Period Tracker</h1>
            <p className="text-xs text-slate-400">Minimalist Menstrual Cycle & Wellness Suite</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {isRegister && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lulu Oryza"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="oryza@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {isRegister && (
            <div className="grid grid-cols-2 gap-2.5 pt-1.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Cycle Duration</label>
                <div className="relative">
                  <CalIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    min={20}
                    max={45}
                    value={cycleLength}
                    onChange={(e) => setCycleLength(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-xs font-bold text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Period Length</label>
                <div className="relative">
                  <CalIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    min={2}
                    max={15}
                    value={periodLength}
                    onChange={(e) => setPeriodLength(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-xs font-bold text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold bg-slate-800 text-white hover:bg-slate-900 transition-all text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1 mt-2"
          >
            {loading ? "Please wait..." : isRegister ? "Create Account & Sign In" : "Sign In to Suite"}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center pt-2.5 space-y-3 shrink-0">
          <p className="text-xs text-slate-400 font-sans">
            {isRegister ? "Sudah memiliki akun?" : "Belum punya akun?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-rose-500 font-bold hover:underline cursor-pointer"
            >
              {isRegister ? "Login di sini" : "Daftar gratis di sini"}
            </button>
          </p>

          <button 
            onClick={fillDemoAccount}
            className="px-3.5 py-1.5 border border-dashed border-rose-200/80 bg-rose-50/40 text-rose-600 hover:text-white hover:bg-rose-500 rounded-xl text-[10px] font-bold tracking-tight transition-all mx-auto block cursor-pointer"
          >
            ⚡ Quick Demo Auto-Fill (Oryza)
          </button>
        </div>

      </div>
    </div>
  );
}
