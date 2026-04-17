import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#fffdf7",
        foreground: "#3e342b",
        border: "#eadfce",
        ring: "#d6b98d",
        primary: {
          DEFAULT: "#b98752",
          foreground: "#fffaf5"
        },
        secondary: {
          DEFAULT: "#f5e9d8",
          foreground: "#5f4b3d"
        },
        muted: {
          DEFAULT: "#f8f1e6",
          foreground: "#7b6b5d"
        },
        accent: {
          DEFAULT: "#f9d9dd",
          foreground: "#6f4e57"
        },
        puppy: {
          cream: "#fffaf1",
          butter: "#f9efdb",
          tan: "#e8c8a6",
          pink: "#ffdfe8",
          blue: "#dceefb",
          ink: "#57473a"
        }
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      },
      boxShadow: {
        soft: "0 10px 35px rgba(185, 135, 82, 0.12)"
      },
      backgroundImage: {
        "puppy-grid":
          "radial-gradient(circle at 1px 1px, rgba(185,135,82,0.11) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
