import { useState } from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard";
    } catch {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.18),_transparent_32%),linear-gradient(160deg,_#020617_0%,_#0f172a_45%,_#1d4ed8_100%)]" />
      <div className="absolute inset-0 bg-grid-slate bg-[size:32px_32px] opacity-20" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur md:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden flex-col justify-between bg-slate-950/45 p-10 text-white md:flex">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">
              Intelligent Care Operations
            </div>
            <h1 className="max-w-lg text-4xl font-semibold leading-tight">
              Professional hospital workflow management with real-time visibility.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-200">
              Bring admissions, bed tracking, and AI-assisted triage into one clean operational dashboard built for daily teams.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Admissions", value: "24/7" },
              { label: "Bed Tracking", value: "Live" },
              { label: "Risk Insights", value: "AI" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white px-6 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-200">
                HA
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-slate-950">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to manage patients, beds, and AI risk workflows.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                />
              </div>

              <button onClick={handleLogin} className="btn-primary w-full" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Secure access for hospital staff and operations teams.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
