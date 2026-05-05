import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        cloud: "#f7f8fb",
        brand: "#126c6a",
        coral: "#e86f52"
      }
    }
  },
  plugins: []
};

export default config;

