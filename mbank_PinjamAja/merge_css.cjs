const fs = require('fs');
const path = require('path');

const mainCssPath = path.join(__dirname, 'src', 'index.css');
const cisoCssPath = path.join(__dirname, '..', 'pinjam aja', 'src', 'index.css');

const mainCss = fs.readFileSync(mainCssPath, 'utf8');
const cisoCss = fs.readFileSync(cisoCssPath, 'utf8');

// Extract @theme from CISO
let themeMatch = cisoCss.match(/@theme\s*{([^}]*)}/s);
let cisoThemeVars = themeMatch ? themeMatch[1] : '';

// Remove @theme block from mainCss
let mainCssWithoutTheme = mainCss;
let mainThemeMatch = mainCss.match(/@theme\s*{([^}]*)}/s);
let mainThemeVars = mainThemeMatch ? mainThemeMatch[1] : '';
if (mainThemeMatch) {
  mainCssWithoutTheme = mainCss.replace(mainThemeMatch[0], '');
}

// Extract base styles from CISO and replace body with .ciso-theme
let baseMatch = cisoCss.match(/@layer base\s*{([\s\S]*?)}/s);
let cisoBase = baseMatch ? baseMatch[1] : '';
cisoBase = cisoBase.replace(/body/g, '.ciso-theme');
cisoBase = cisoBase.replace(/html/g, '.ciso-html-wrapper'); // replace html if any

// Extract utilities from CISO
let utilMatch = cisoCss.match(/@layer utilities\s*{([\s\S]*?)}/s);
let cisoUtils = utilMatch ? utilMatch[1] : '';
cisoUtils = cisoUtils.replace(/body\.light/g, '.ciso-theme.light');

// Extract animations from CISO (keyframes)
let animationsMatch = cisoCss.match(/(@keyframes[\s\S]*?)(?=@layer|$)/s);
let cisoAnimations = animationsMatch ? animationsMatch[1] : '';

// Build final CSS
const finalCss = `
@import "tailwindcss";

@theme {
  ${mainThemeVars}
  
  /* CISO Theme Vars */
  ${cisoThemeVars}
}

${mainCssWithoutTheme.replace('@import "tailwindcss";', '').trim()}

/* ============================================
   CISO STYLES
   ============================================ */

.ciso-theme {
  font-family: var(--font-sans);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

@layer base {
  ${cisoBase}
}

${cisoAnimations}

@layer utilities {
  ${cisoUtils}
}
`;

fs.writeFileSync(mainCssPath, finalCss.trim(), 'utf8');
console.log('CSS Merged successfully.');
