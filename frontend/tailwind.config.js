/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B0F2A",
          deep: "#0B0F2A",
          dark: "#070A18",
        },
        red: {
          DEFAULT: "#DF350D",
          action: "#DF350D",
        },
        sage: "#8AA073",
        bronze: "#875327",
        gold: {
          dark: "#6B3E00",
          DEFAULT: "#E0A21C",
          bright: "#F5C542",
        },
        highlight: "#FFE88A",
        cream: "#F5EFE5",
        // shadcn tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        display: ['"Chakra Petch"', "sans-serif"],
        body: ['"Exo 2"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      letterSpacing: {
        tech: "0.35em",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "ticker": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "scan-x": { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(400%)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "spin-rev": { to: { transform: "rotate(-360deg)" } },
        "flicker": { "0%,100%": { opacity: "1" }, "48%": { opacity: "1" }, "50%": { opacity: "0.75" }, "52%": { opacity: "1" } },
        "pulse-ring": { "0%,100%": { opacity: "0.4" }, "50%": { opacity: "1" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ticker": "ticker 40s linear infinite",
        "scan-x": "scan-x 2.4s cubic-bezier(0.4,0,0.2,1) infinite",
        "spin-slow": "spin-slow 24s linear infinite",
        "spin-rev": "spin-rev 32s linear infinite",
        "flicker": "flicker 6s linear infinite",
        "pulse-ring": "pulse-ring 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
