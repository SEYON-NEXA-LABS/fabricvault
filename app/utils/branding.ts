export function isDarkColor(colorName: string) {
  const normalized = (colorName || "").toLowerCase();
  return (
    normalized.includes("black") ||
    normalized.includes("charcoal") ||
    normalized.includes("navy") ||
    normalized.includes("rose") ||
    normalized.includes("crimson") ||
    normalized.includes("indigo") ||
    normalized.includes("olive") ||
    normalized.startsWith("#0") ||
    normalized.startsWith("#1") ||
    normalized.startsWith("#2") ||
    normalized.startsWith("#3")
  );
}

export function applyBrandingStyles(company: any, activeBrand: any) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;

  let theme: any = null;
  if (activeBrand?.themeConfig) {
    theme = typeof activeBrand.themeConfig === "string" ? JSON.parse(activeBrand.themeConfig) : activeBrand.themeConfig;
  }
  if (!theme && company?.themeConfig) {
    theme = typeof company.themeConfig === "string" ? JSON.parse(company.themeConfig) : company.themeConfig;
  }

  if (theme) {
    if (theme.primary) {
      root.style.setProperty("--primary", theme.primary);
      root.style.setProperty("--primary-foreground", isDarkColor(theme.primary) ? "#ffffff" : "#09090b");
    }
    if (theme.accent) {
      root.style.setProperty("--accent", theme.accent);
      root.style.setProperty("--accent-foreground", isDarkColor(theme.accent) ? "#ffffff" : "#09090b");
    }
    if (theme.radius) {
      root.style.setProperty("--radius", theme.radius);
    }
    if (theme.layoutPreset) {
      root.setAttribute("data-layout-preset", theme.layoutPreset);
    }
    if (theme.fontFamily) {
      root.style.setProperty("--font-sans", theme.fontFamily);
      document.body.style.fontFamily = theme.fontFamily;
      
      // Inject Google Font if standard Google font name
      const fontName = theme.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      const existingLink = document.getElementById("dynamic-theme-font");
      if (fontName && fontName !== "system-ui") {
        const linkUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800&display=swap`;
        if (existingLink) {
          (existingLink as HTMLLinkElement).href = linkUrl;
        } else {
          const link = document.createElement("link");
          link.id = "dynamic-theme-font";
          link.rel = "stylesheet";
          link.href = linkUrl;
          document.head.appendChild(link);
        }
      }
    }
  } else {
    // Reset to defaults if no theme is found
    root.style.setProperty("--primary", "#0d9488");
    root.style.setProperty("--primary-foreground", "#ffffff");
    root.style.setProperty("--accent", "#fbbf24");
    root.style.setProperty("--accent-foreground", "#1c1917");
    root.style.setProperty("--radius", "0.375rem");
    document.body.style.fontFamily = "";
  }
}
