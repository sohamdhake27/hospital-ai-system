/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 20px 45px -24px rgba(15, 23, 42, 0.35)"
      },
      backgroundImage: {
        "grid-slate":
          "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.16) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};
