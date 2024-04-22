import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  // theme: {
  //   extend: {},
  // },
  plugins: [require("daisyui")],
  daisyui: {
    // themes: ["emerald"],
    // themes: ["business"],
    // themes: ["corporate"],
    themes: ["fantasy"],
    // darkTheme: "business",
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    // prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    // themeRoot: ":root", // The element that receives theme color CSS variables
  },
} satisfies Config;
