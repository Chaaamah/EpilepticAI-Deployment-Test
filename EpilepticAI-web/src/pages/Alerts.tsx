import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, AlertTriangle, Info, CheckCircle, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useTranslation } from "@/contexts/I18nContext";
import { usePatients } from "@/contexts/PatientsContext";
import { useAuth } from "@/contexts/AuthContext";

import { alertService } from "@/services/alertService";
import { Pill } from "lucide-react";

interface Alert {
  id: number;
  type: "critical" | "warning" | "info" | "success" | "medication_intake";
  title: string;
  description: string;
  patient: string;
  patientId: number;
  time: string;
  read: boolean;
}

const Alerts = () => {
  const { patients, getPatientById } = usePatients();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [alertsData, setAlertsData] = useState<Alert[]>([]);
  const { t } = useTranslation();

  // Filtrer les patients pour n'afficher que ceux du docteur connecté
  useEffect(() => {
    if (user && patients) {
      const filtered = patients.filter(patient =>
        patient.owner === user.email
      );
      setDoctorPatients(filtered);
    }
  }, [patients, user]);

  // Générer les alertes basées sur les patients du docteur ET fetch api
  useEffect(() => {
    const fetchAndGenerateAlerts = async () => {
      let combinedAlerts: Alert[] = [];

      // 1. Alertes générées localement (simulées)
      if (doctorPatients.length > 0) {
        doctorPatients.forEach(patient => {
          // Alerte critique
          if (patient.healthStatus?.toLowerCase() === "critical") {
            combinedAlerts.push({
              id: patient.id * 1000 + 1,
              type: "critical",
              title: t("seizure_episode_detected", undefined, "Crise Épileptique Détectée"),
              description: t("seizure_episode_desc", { name: patient.name }, `Le patient ${patient.name} a un statut critique.`),
              patient: patient.name,
              patientId: patient.id,
              time: t("recently"),
              read: false,
            });
          }
          // Alerte warning
          if (patient.riskScore > 80) {
            combinedAlerts.push({
              id: patient.id * 1000 + 2,
              type: "warning",
              title: t("high_risk_score_alert_title"),
              description: t("high_risk_score_alert_desc", { name: patient.name, score: patient.riskScore }),
              patient: patient.name,
              patientId: patient.id,
              time: t("today"),
              read: false,
            });
          }
        });
      }

      // 2. Alertes provenant du Backend (API)
      try {
        const backendAlerts = await alertService.getManagedAlerts({ limit: 50 });
        const mappedBackendAlerts = backendAlerts.map((alert: any) => {
          // Trouver le nom du patient si possible (via doctorPatients ou API alert data)
          const patientName = doctorPatients.find(p => p.id === alert.patient_id)?.name || "Patient";

          return {
            id: alert.id,
            type: alert.alert_type as Alert["type"], // "medication_intake" maps directly if interfaced
            title: t(alert.title) === alert.title && alert.title === "Medication Taken" ? t("medication_taken_title") : alert.title,
            description: alert.message,
            patient: patientName,
            patientId: alert.patient_id,
            time: new Date(alert.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: alert.acknowledged || false,
          } as Alert;
        });
        combinedAlerts = [...combinedAlerts, ...mappedBackendAlerts];
      } catch (error) {
        console.error("Failed to fetch backend alerts", error);
      }

      // Trier par date (approximatif, mixant strings et dates réelles) - Pour l'instant on met les nouvelles (backend) en premier si possible
      // Ou on ne trie pas trop fort. Le backend renvoie déjà trié.
      // On va juste garder l'ordre : backend (souvent plus récent) + generated.

      setAlertsData(combinedAlerts);
    };

    if (doctorPatients.length > 0 || true) { // Toujours essayer de fetcher même si pas de patients chargés localement
      fetchAndGenerateAlerts();
    }
  }, [doctorPatients, t]); // Re-run si patients ou langue change

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <Bell className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "medication_intake":
        return <Pill className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "text-destructive";
      case "warning":
        return "text-warning";
      case "info":
        return "text-info";
      case "success":
        return "text-success";
      case "medication_intake":
        return "text-primary";
    }
  };

  const getBadgeVariant = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "default";
      case "success":
        return "default";
      case "medication_intake":
        return "outline";
    }
  };

  const filteredAlerts = alertsData.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || alert.type === filter;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = alertsData.filter((alert) => !alert.read).length;

  const getAlertTypeCount = (type: Alert["type"]) => {
    return alertsData.filter(alert => alert.type === type).length;
  };

  const markAsRead = (alertId: number) => {
    setAlertsData(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const markAllAsRead = () => {
    setAlertsData(prev =>
      prev.map(alert => ({ ...alert, read: true }))
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("alerts_title", undefined, "Mes Alertes")}</h1>
            <p className="text-muted-foreground">
              {t("alerts_subtitle", undefined, `Alertes pour vos ${doctorPatients.length} patients`)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                {t("mark_all_read")}
              </Button>
            )}
            <Badge variant="destructive" className="text-base px-4 py-1">
              {unreadCount} {t("unread", undefined, "non lues")}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className={`p-4 cursor-pointer hover:border-primary transition-colors ${filter === "all" ? "border-primary" : ""}`}
            onClick={() => setFilter("all")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("total_alerts", undefined, "Total des alertes")}</p>
                <p className="text-2xl font-bold mt-1">{alertsData.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card
            className={`p-4 cursor-pointer hover:border-destructive transition-colors ${filter === "critical" ? "border-destructive" : ""}`}
            onClick={() => setFilter("critical")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("alerts_title", undefined, "Alertes critiques")}</p>
                <p className="text-2xl font-bold mt-1 text-destructive">
                  {getAlertTypeCount("critical")}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </Card>

          <Card
            className={`p-4 cursor-pointer hover:border-warning transition-colors ${filter === "warning" ? "border-warning" : ""}`}
            onClick={() => setFilter("warning")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("warnings_label", undefined, "Avertissements")}</p>
                <p className="text-2xl font-bold mt-1 text-warning">
                  {getAlertTypeCount("warning")}
                </p>
              </div>
              <Bell className="h-8 w-8 text-warning" />
            </div>
          </Card>

          <Card
            className={`p-4 cursor-pointer hover:border-info transition-colors ${filter === "info" ? "border-info" : ""}`}
            onClick={() => setFilter("info")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("info_label", undefined, "Informations")}</p>
                <p className="text-2xl font-bold mt-1 text-info">
                  {getAlertTypeCount("info")}
                </p>
              </div>
              <Info className="h-8 w-8 text-info" />
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search_alerts_placeholder", undefined, "Rechercher dans les alertes...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setFilter("all")}
          >
            <Filter className="h-4 w-4" />
            {filter === "all" ? t("all_alerts", undefined, "Toutes les alertes") : `${t("filter_label", undefined, "Filtre")}: ${filter}`}
          </Button>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-5 transition-all hover:shadow-md cursor-pointer ${!alert.read ? "border-l-4 border-l-primary bg-secondary/20" : ""
                }`}
              onClick={() => markAsRead(alert.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`${getAlertColor(alert.type)} mt-1`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.read && (
                        <Badge variant="default" className="bg-primary">
                          {t("new_badge")}
                        </Badge>
                      )}
                      <Badge variant={getBadgeVariant(alert.type)}>
                        {alert.type === "critical" ? t("alert_critical") :
                          alert.type === "warning" ? t("alert_warning") :
                            alert.type === "info" ? t("alert_info") : t("alert_success")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Link
                        to={`/patients/${alert.patientId}`}
                        className="hover:text-primary transition-colors hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Patient: {alert.patient}
                      </Link>
                      <span>•</span>
                      <span>{alert.time}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/patients/${alert.patientId}`}>
                        {t("view_patient_button")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("no_alerts_found")}
            </h3>
            <p className="text-muted-foreground">
              {alertsData.length === 0
                ? t("no_alerts_generated")
                : t("adjust_search_filter")
              }
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Alerts;