import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSettings } from "@/contexts/SettingsContext";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { settings, updateSettings } = useSettings();
  const initial = (settings?.appearance?.theme as Theme) || "light";
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // When theme is changed via setTheme, persist into Settings so it applies across the app
  useEffect(() => {
    // keep local state in sync if settings change externally
    const sTheme = settings?.appearance?.theme as Theme | undefined;
    if (sTheme && sTheme !== theme) setTheme(sTheme);
  }, [settings?.appearance?.theme]);

  const setAppTheme = (t: Theme) => {
    setTheme(t);
    try {
      updateSettings({ appearance: { ...(settings.appearance || {}), theme: t, language: "en" } });
    } catch (e) {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setAppTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
