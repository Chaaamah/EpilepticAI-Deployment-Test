import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingDown, TrendingUp, ChevronRight, Eye } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/I18nContext";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { usePatients } from "@/contexts/PatientsContext";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { patients } = usePatients();
  const navigate = useNavigate();
  const [doctorPatients, setDoctorPatients] = useState([]);

  // Filtrer les patients pour n'afficher que ceux du docteur connecté
  useEffect(() => {
    if (user && patients) {
      const filtered = patients.filter(patient =>
        patient.owner === user.email
      );
      setDoctorPatients(filtered);
    }
  }, [patients, user]);

  const interp = (s: string, vars?: Record<string, string>) => {
    if (!vars) return s;
    let r = s;
    Object.entries(vars).forEach(([k, v]) => {
      r = r.split(`{${k}}`).join(v ?? "");
    });
    return r;
  };

  // Calculer les statistiques basées sur les patients réels
  const calculateStats = () => {
    const criticalPatients = doctorPatients.filter(p =>
      p.healthStatus?.toLowerCase() === "critical"
    ).length;

    const highRiskPatients = doctorPatients.filter(p =>
      p.healthStatus?.toLowerCase() === "high"
    ).length;

    const mediumRiskPatients = doctorPatients.filter(p =>
      p.healthStatus?.toLowerCase() === "medium"
    ).length;

    const stablePatients = doctorPatients.filter(p =>
      p.healthStatus?.toLowerCase() === "stable"
    ).length;

    const lowRiskPatients = doctorPatients.filter(p =>
      p.healthStatus?.toLowerCase() === "low"
    ).length;

    // Patients créés cette semaine
    const thisWeekPatients = doctorPatients.filter(p => {
      if (!p.createdAt) return false;
      const created = new Date(p.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return created >= oneWeekAgo;
    }).length;

    // Patients créés la semaine dernière pour calculer l'évolution
    const lastWeekPatients = doctorPatients.filter(p => {
      if (!p.createdAt) return false;
      const created = new Date(p.createdAt);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return created >= twoWeeksAgo && created < oneWeekAgo;
    }).length;

    const weeklyGrowth = lastWeekPatients > 0
      ? ((thisWeekPatients - lastWeekPatients) / lastWeekPatients * 100).toFixed(1)
      : thisWeekPatients > 0 ? "+100" : "0";

    return {
      totalPatients: doctorPatients.length,
      criticalPatients,
      highRiskPatients,
      mediumRiskPatients,
      stablePatients,
      lowRiskPatients,
      thisWeekPatients,
      weeklyGrowth: weeklyGrowth.startsWith('-') ? weeklyGrowth : `+${weeklyGrowth}`,
      pendingCases: mediumRiskPatients + highRiskPatients, // Cas nécessitant une attention
    };
  };

  const stats = calculateStats();

  // helpers to compute counts per day for the last N days from patient.createdAt
  const getCountsForLastNDays = (days: number) => {
    const result: { name: string; value: number }[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const label = days <= 7
        ? d.toLocaleDateString(undefined, { weekday: "short" })
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

      const count = doctorPatients.filter(p => {
        if (!p.createdAt) return false;
        const created = new Date(p.createdAt);
        created.setHours(0, 0, 0, 0);
        return created.getTime() === d.getTime();
      }).length;

      result.push({ name: label, value: count });
    }
    return result;
  };

  // Données pour la distribution des risques
  const getRiskDistributionData = () => {
    return [
      { name: t("risk_critical", undefined, "Critique"), value: stats.criticalPatients, color: "hsl(var(--destructive))" },
      { name: t("risk_high", undefined, "Élevé"), value: stats.highRiskPatients, color: "hsl(var(--warning))" },
      { name: t("risk_medium", undefined, "Moyen"), value: stats.mediumRiskPatients, color: "hsl(var(--secondary))" },
      { name: t("risk_stable", undefined, "Stable"), value: stats.stablePatients, color: "hsl(var(--primary))" },
      { name: t("risk_low", undefined, "Faible"), value: stats.lowRiskPatients, color: "hsl(var(--accent))" },
    ];
  };

  // Patients récents (5 plus récents)
  const getRecentPatients = () => {
    return doctorPatients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(patient => ({
        id: patient.id,
        name: patient.name,
        status: patient.healthStatus?.toLowerCase(),
        time: patient.lastVisit || t("recently", undefined, "Récemment"),
        riskScore: patient.riskScore,
      }));
  };

  const activityData = getCountsForLastNDays(7);
  const patientOverviewData = getCountsForLastNDays(30);
  const riskDistributionData = getRiskDistributionData();
  const recentPatients = getRecentPatients();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {interp(t("greeting_morning") || "Bonjour {name}", { name: user?.name || "Docteur" })}
            </h1>
            <p className="text-muted-foreground">
              {t("dashboard_subtitle") || `Vue d'ensemble de vos ${stats.totalPatients} patients`}
            </p>
          </div>
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => navigate('/alerts')} // Ajouter cette ligne
          >
            <Bell className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/patients')}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("total_patients", undefined, "Total Patients")}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.totalPatients}</p>
              </div>
              <Badge className="bg-accent text-accent-foreground">{t("total_label", undefined, "Total")}</Badge>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center text-success text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{stats.weeklyGrowth}% cette semaine</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/patients')}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("high_risk_cases", undefined, "Cas à risque élevé")}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.highRiskPatients + stats.criticalPatients}</p>
              </div>
              <Badge className="bg-warning text-warning-foreground">{t("urgent_label", undefined, "Urgent")}</Badge>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center text-muted-foreground text-sm">
                <span>{t("requires_attention", undefined, "Nécessitent une attention")}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/patients')}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("critical_label", undefined, "Cas critiques")}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.criticalPatients}</p>
              </div>
              <Badge className="bg-destructive text-destructive-foreground">{t("critical_label", undefined, "Critique")}</Badge>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center text-destructive text-sm">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span>{t("monitoring_intensive", undefined, "Surveillance intensive")}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/patients')}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("new_this_week")}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.thisWeekPatients}</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                {t("new_patient", undefined, "Nouveaux")}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center text-muted-foreground text-sm">
                <span>{t("patients_added")}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("seizure_activity_title")}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("patient_activity_overview")}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={patientOverviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">{t("recent_patients")}</h3>
            <div className="space-y-3">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {patient.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          patient.status === "critical"
                            ? "destructive"
                            : patient.status === "high"
                              ? "destructive"
                              : patient.status === "medium"
                                ? "secondary"
                                : "default"
                        }
                      >
                        {patient.status === "critical" ? t("risk_critical") :
                          patient.status === "high" ? t("risk_high") :
                            patient.status === "medium" ? t("risk_medium") :
                              patient.status === "stable" ? t("risk_stable") : t("risk_low")}
                      </Badge>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("patient_not_found", undefined, "Aucun patient trouvé")}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("risk_distribution")}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--accent))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {riskDistributionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;