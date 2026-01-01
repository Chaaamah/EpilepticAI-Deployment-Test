import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Edit, Eye, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { usePatients } from "@/contexts/PatientsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/I18nContext";

const Patients = () => {
  const { patients, deletePatient } = usePatients();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const filteredPatients = doctorPatients
    .filter(patient => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        patient.name?.toLowerCase().includes(query) ||
        patient.description?.toLowerCase().includes(query) ||
        patient.healthStatus?.toLowerCase().includes(query);
      
      const matchesStatus = statusFilter === "all" || 
        patient.healthStatus?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "risk":
          return b.riskScore - a.riskScore;
        case "recent":
        default:
          return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      }
    });

  const getHealthStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "stable":
        return "default";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const handleDeletePatient = (patientId: number, patientName: string) => {
    if (window.confirm(t("delete_patient_confirmation", { name: patientName }))) {
      deletePatient(patientId);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("just_now", undefined, "Chargement...")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("patients_title", undefined, "Mes Patients")}</h1>
            <p className="text-muted-foreground">
              {t("manage_and_monitor")} {" - "}{user?.name || user?.email}
            </p>
          </div>
          <Link to="/patients/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("add_patient")}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search_patients", undefined, "Rechercher un patient...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            className="bg-card border border-input rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t("all_statuses", undefined, "Tous les statuts")}</option>
            <option value="critical">{t("status_critical", undefined, "Critique")}</option>
            <option value="high">{t("status_high", undefined, "Élevé")}</option>
            <option value="medium">{t("status_medium", undefined, "Moyen")}</option>
            <option value="stable">{t("status_stable", undefined, "Stable")}</option>
            <option value="low">{t("status_low", undefined, "Faible")}</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("sort_by", undefined, "Trier par")}</span>
            <select 
              className="bg-card border border-input rounded-md px-3 py-1.5"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">{t("sort_recent", undefined, "Plus récent")}</option>
              <option value="name">{t("sort_name", undefined, "Nom")}</option>
              <option value="risk">{t("sort_risk", undefined, "Niveau de risque")}</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("patients_table_name", undefined, "Nom")}</TableHead>
                <TableHead>{t("patients_table_age", undefined, "Âge")}</TableHead>
                <TableHead>{t("patients_table_description", undefined, "Description")}</TableHead>
                <TableHead>{t("patients_table_last_visit", undefined, "Dernière visite")}</TableHead>
                <TableHead>{t("patients_table_risk_score", undefined, "Score de risque")}</TableHead>
                <TableHead>{t("patients_table_heart_rate", undefined, "Rythme cardiaque")}</TableHead>
                <TableHead>{t("patients_table_health_status", undefined, "Statut de santé")}</TableHead>
                <TableHead>{t("patients_table_action", undefined, "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {patient.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          {patient.country && patient.country !== "🇹🇳" && (
                            <p className="text-xs text-muted-foreground">
                              {patient.country}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {patient.description}
                      </p>
                    </TableCell>
                    <TableCell>{patient.lastVisit}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{patient.riskScore}</span>
                    </TableCell>
                    <TableCell>{patient.heartRate} bpm</TableCell>
                    <TableCell>
                      <Badge variant={getHealthStatusColor(patient.healthStatus)}>
                        {patient.healthStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link to={`/patients/${patient.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          asChild
                        >
                          <Link to={`/patients/${patient.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePatient(patient.id, patient.name)}
                          title={t("delete_patient_button")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {doctorPatients.length === 0 
                        ? t("no_patients_assigned", undefined, "Aucun patient assigné à votre compte. Ajoutez votre premier patient !")
                        : t("no_patients_found", undefined, "Aucun patient trouvé avec les critères de recherche")
                      }
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage de {filteredPatients.length} patient(s) sur {doctorPatients.length} au total
          </p>
          <p className="text-xs text-muted-foreground">
            Docteur: {user.name || user.email}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Patients;