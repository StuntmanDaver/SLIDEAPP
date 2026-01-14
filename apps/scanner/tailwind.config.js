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
    },
  },
  plugins: [],
};
