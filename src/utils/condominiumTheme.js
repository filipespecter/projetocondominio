const DEFAULT_PRIMARY = "#7c3aed";

function normalizeHex(value, fallback = DEFAULT_PRIMARY) {
  const raw = String(value || "").trim();
  const short = /^#([0-9a-fA-F]{3})$/;
  const full = /^#([0-9a-fA-F]{6})$/;

  if (full.test(raw)) return raw.toLowerCase();
  const match = raw.match(short);
  if (match) {
    const [r, g, b] = match[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (channel) => Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mix(hex, targetHex, amount) {
  const source = hexToRgb(hex);
  const target = hexToRgb(targetHex);
  const ratio = Math.max(0, Math.min(1, Number(amount) || 0));
  return rgbToHex({
    r: source.r + (target.r - source.r) * ratio,
    g: source.g + (target.g - source.g) * ratio,
    b: source.b + (target.b - source.b) * ratio,
  });
}

function rgbTriplet(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

export function getCondominiumPrimaryColor(themeOrUser) {
  const theme = themeOrUser?.condominium?.settings?.theme
    ?? themeOrUser?.settings?.theme
    ?? themeOrUser?.theme
    ?? themeOrUser
    ?? {};

  const customThemeEnabled = typeof theme === "string"
    ? true
    : theme?.aplicarTemaPersonalizado === true;

  if (!customThemeEnabled) {
    return DEFAULT_PRIMARY;
  }

  const requested = typeof theme === "string"
    ? theme
    : theme?.corPrincipal;

  return normalizeHex(requested, DEFAULT_PRIMARY);
}

export function buildCondominiumThemeVariables(themeOrUser) {
  const primary = getCondominiumPrimaryColor(themeOrUser);
  const light = mix(primary, "#ffffff", 0.14);
  const bright = mix(primary, "#ffffff", 0.06);
  const strong = mix(primary, "#000000", 0.10);
  const dark = mix(primary, "#000000", 0.25);
  const deep = mix(primary, "#000000", 0.38);
  const deepest = mix(primary, "#000000", 0.58);
  const soft = mix(primary, "#ffffff", 0.86);
  const soft2 = mix(primary, "#ffffff", 0.90);
  const soft3 = mix(primary, "#ffffff", 0.94);
  const soft4 = mix(primary, "#ffffff", 0.965);
  const border = mix(primary, "#ffffff", 0.62);
  const borderSoft = mix(primary, "#ffffff", 0.76);

  return {
    "--ic-primary": primary,
    "--ic-primary-rgb": rgbTriplet(primary),
    "--ic-primary-light": light,
    "--ic-primary-light-rgb": rgbTriplet(light),
    "--ic-primary-bright": bright,
    "--ic-primary-bright-rgb": rgbTriplet(bright),
    "--ic-primary-strong": strong,
    "--ic-primary-strong-rgb": rgbTriplet(strong),
    "--ic-primary-dark": dark,
    "--ic-primary-dark-rgb": rgbTriplet(dark),
    "--ic-primary-deep": deep,
    "--ic-primary-deep-rgb": rgbTriplet(deep),
    "--ic-primary-deepest": deepest,
    "--ic-primary-deepest-rgb": rgbTriplet(deepest),
    "--ic-primary-soft": soft,
    "--ic-primary-soft-2": soft2,
    "--ic-primary-soft-3": soft3,
    "--ic-primary-soft-4": soft4,
    "--ic-primary-border": border,
    "--ic-primary-border-soft": borderSoft,
  };
}

export function applyCondominiumTheme(themeOrUser, element = null) {
  if (typeof document === "undefined") return buildCondominiumThemeVariables(themeOrUser);
  const target = element || document.querySelector(".app-dashboard-shell");
  if (!target) return buildCondominiumThemeVariables(themeOrUser);

  const variables = buildCondominiumThemeVariables(themeOrUser);
  Object.entries(variables).forEach(([name, value]) => target.style.setProperty(name, value));
  return variables;
}

export default buildCondominiumThemeVariables;
