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
        // Liquid Glass material colors (Apple-inspired)
        glass: {
          // Ultra-thin - most transparent, subtle presence
          ultraThin: "rgba(255, 255, 255, 0.15)",
          // Thin - light transparency
          thin: "rgba(255, 255, 255, 0.25)",
          // Regular - balanced translucency
          regular: "rgba(255, 255, 255, 0.35)",
          // Thick - more visible but still translucent
          thick: "rgba(255, 255, 255, 0.50)",
          // Clear variant - minimal tint
          clear: "rgba(255, 255, 255, 0.08)",
          // Dark glass for camera overlays
          dark: "rgba(0, 0, 0, 0.30)",
          darkThin: "rgba(0, 0, 0, 0.15)",
        },
        "glass-border": "rgba(255, 255, 255, 0.12)",
        "glass-border-strong": "rgba(255, 255, 255, 0.20)",
        "glass-highlight": "rgba(255, 255, 255, 0.40)",
        "glass-shadow": "rgba(0, 0, 0, 0.08)",
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
        glow: "0 0 20px rgba(255,255,255,0.3)",
      },
    },
  },
  plugins: [],
};
