import { NavLink } from "react-router-dom";

function Layout({ children }) {
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  const user = getUser();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/patients", label: "Patients" },
    { to: "/beds", label: "Beds" },
    { to: "/ai", label: "AI Prediction" }
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-200/70 bg-slate-950 text-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:border-slate-800">
          <div className="flex h-full flex-col px-6 py-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-base font-bold shadow-lg shadow-blue-950/30">
                  HA
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Hospital AI</h2>
                  <p className="text-sm text-slate-400">Operations Console</p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
                  Live System
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Admissions, bed allocation, and AI-assisted risk tracking from one control center.
                </p>
                {user?.role && (
                  <div className="mt-4 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    {user.role} access
                  </div>
                )}
              </div>

              <nav className="mt-8 space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="mt-8 lg:mt-auto">
              <button
                onClick={logout}
                className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-200/70 bg-white/70 px-6 py-5 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Hospital AI System
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                  Modern care operations dashboard
                </h1>
              </div>
              <div className="panel flex items-center gap-3 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-600">System online</span>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
