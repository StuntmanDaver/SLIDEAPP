/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#E1E2DD",
        surface: "#FFFFFF",
        "surface-alt": "#E4E3DF",
        "text-primary": "#090908",
        "text-secondary": "#7D737B",
        "lavender-primary": "#B2AAC2",
        "lavender-secondary": "#C6BFCF",
        "border-hair": "#C1C2BD",
        "blush-row": "linear-gradient(to right, #D7C1C3, #E1CECF)",
        "mint-row": "linear-gradient(to right, #BCD0CC, #C7DAD7)",
        "lavender-row": "#C1C1CB",
      },
      borderRadius: {
        lg: "28px",
        md: "24px",
        sm: "18px",
        xs: "16px",
      },
      spacing: {
        xl: "24px",
        md: "16px",
        sm: "12px",
        xs: "8px",
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.08)",
        control: "0 6px 18px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
