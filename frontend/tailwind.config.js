import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [daisyui],
	daisyui: {
		themes: [
			{
				linkedin: {
			 primary: "#0A66C2",     
  secondary: "#F5F7FA",     // Gentle background gray
  accent: "#2EB67D",        // Vibrant teal green for highlights
  neutral: "#1E1E1E",       // Dark for text and depth
  "base-100": "#FFFFFF",    // Clean white background
  info: "#3B82F6",          // Strong info blue
  success: "#22C55E",       // Confident green
  warning: "#FACC15",       // Soft yellow
  error: "#EF4444",         // Clean, strong red
				},
			},
		],
	},
};
