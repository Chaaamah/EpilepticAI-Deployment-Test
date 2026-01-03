import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/contexts/I18nContext";

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();

  const { t } = useTranslation();

  const { notifications, appearance, riskScore, privacy } = settings;
  const highRiskThreshold = riskScore.highRiskThreshold;
  const alertFrequency = riskScore.alertFrequency;
  const criticalAlerts = notifications.criticalAlerts;
  const medicationReminders = notifications.medicationReminders;
  const appointmentNotifications = notifications.appointmentNotifications;
  const shareAnalytics = privacy.shareAnalytics;
  const twoFactorAuth = privacy.twoFactorAuth;

  // No local state here — we rely on SettingsContext which persists changes immediately.

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as "light" | "dark" | "system");
    updateSettings({ appearance: { ...appearance, theme: newTheme as any } });
  };

  const handleSave = () => {
    // With SettingsContext changes are persisted live — show confirmation only
    toast({ title: t("settings_saved"), description: t("settings_saved_desc") });
  };

  const handleReset = () => {
    const defaultSettings = {
      notifications: { criticalAlerts: true, medicationReminders: true, appointmentNotifications: true },
      appearance: { theme: "light" as any, language: "en" },
      riskScore: { highRiskThreshold: "80", alertFrequency: "realtime" as any },
      privacy: { shareAnalytics: false, twoFactorAuth: false },
    };
    updateSettings(defaultSettings as any);
    setTheme("light");
    toast({ title: t("settings_reset"), description: t("settings_reset_desc") });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("settings_title")}</h1>
          <p className="text-muted-foreground">{t("settings_subtitle")}</p>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t("notifications")}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("critical_alerts_notifications", undefined, "Alertes de crises critiques")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("critical_alerts_notifications_desc", undefined, "Recevoir des notifications pour les alertes de patients à haut risque")}
                </p>
              </div>
              <Switch
                checked={criticalAlerts}
                onCheckedChange={(v) => updateSettings({ notifications: { ...notifications, criticalAlerts: !!v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("medication_reminders", undefined, "Rappels de médicaments")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("medication_reminders_desc", undefined, "Recevoir des rappels pour les horaires de médicaments des patients")}
                </p>
              </div>
              <Switch
                checked={medicationReminders}
                onCheckedChange={(v) => updateSettings({ notifications: { ...notifications, medicationReminders: !!v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("appointment_notifications", undefined, "Notifications de rendez-vous")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("appointment_notifications_desc", undefined, "Alertes pour les rendez-vous à venir et manqués")}
                </p>
              </div>
              <Switch
                checked={appointmentNotifications}
                onCheckedChange={(v) => updateSettings({ notifications: { ...notifications, appointmentNotifications: !!v } })}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t("appearance")}</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("theme_label")}</Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("theme_light")}</SelectItem>
                  <SelectItem value="dark">{t("theme_dark")}</SelectItem>
                  <SelectItem value="system">{t("theme_system")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("language_label", undefined, "Langue")}</Label>
              <Select
                value={settings.appearance.language}
                onValueChange={(val) => updateSettings({ appearance: { ...appearance, language: val as any } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">{t("lang_fr")}</SelectItem>
                  <SelectItem value="en">{t("lang_en")}</SelectItem>
                  <SelectItem value="ar">{t("lang_ar")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t("risk_score_settings")}</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("high_risk_threshold", undefined, "Seuil de risque élevé")}</Label>
              <Input
                type="number"
                value={highRiskThreshold}
                onChange={(e) => updateSettings({ riskScore: { ...riskScore, highRiskThreshold: e.target.value } })}
              />
              <p className="text-sm text-muted-foreground">
                {t("high_risk_threshold_desc")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("alert_frequency", undefined, "Fréquence des alertes")}</Label>
              <Select value={alertFrequency} onValueChange={(val) => updateSettings({ riskScore: { ...riskScore, alertFrequency: val as any } })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">{t("realtime")}</SelectItem>
                  <SelectItem value="hourly">{t("hourly")}</SelectItem>
                  <SelectItem value="daily">{t("daily")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t("data_privacy")}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("share_analytics", undefined, "Partager les données analytiques")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("share_analytics_desc", undefined, "Aidez à améliorer nos modèles IA en partageant des données anonymisées")}
                </p>
              </div>
              <Switch
                checked={shareAnalytics}
                onCheckedChange={(v) => updateSettings({ privacy: { ...privacy, shareAnalytics: !!v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("two_factor_auth", undefined, "Authentification à deux facteurs")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("two_factor_auth_desc", undefined, "Ajouter une couche de sécurité supplémentaire à votre compte")}
                </p>
              </div>
              <Switch
                checked={twoFactorAuth}
                onCheckedChange={(v) => updateSettings({ privacy: { ...privacy, twoFactorAuth: !!v } })}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave}>{t("save_changes")}</Button>
          <Button variant="outline" onClick={handleReset}>{t("reset")}</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
