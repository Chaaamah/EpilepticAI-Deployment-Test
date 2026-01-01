import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AlertFrequency = "realtime" | "hourly" | "daily";
export type Theme = "light" | "dark" | "system";

export interface Settings {
  notifications: {
    criticalAlerts: boolean;
    medicationReminders: boolean;
    appointmentNotifications: boolean;
  };
  appearance: {
    theme: Theme;
    language: string;
  };
  riskScore: {
    highRiskThreshold: string;
    alertFrequency: AlertFrequency;
  };
  privacy: {
    shareAnalytics: boolean;
    twoFactorAuth: boolean;
  };
}

const defaultSettings: Settings = {
  notifications: {
    criticalAlerts: true,
    medicationReminders: true,
    appointmentNotifications: true,
  },
  appearance: {
    theme: "light",
    language: "en",
  },
  riskScore: {
    highRiskThreshold: "80",
    alertFrequency: "realtime",
  },
  privacy: {
    shareAnalytics: false,
    twoFactorAuth: false,
  },
};

interface SettingsContextType {
  settings: Settings;
  setSettings: (s: Settings) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("epilert_settings");
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("epilert_settings", JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }, [settings]);

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch } as Settings));
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
