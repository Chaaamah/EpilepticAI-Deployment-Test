import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Scale,
  Activity,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Archive,
  FileText,
  Pill,
  RotateCcw
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePatients } from "@/contexts/PatientsContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/I18nContext";
import { patientService } from "@/services/patientService";
import { medicationService } from "@/services/medicationService";
import type { Medication as APIMedication } from "@/services/medicationService";
import VitalSignsCard from "@/components/VitalSignsCard";

// Types pour les traitements et notes
interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  status: "active" | "archived";
  notes?: string;
}

interface ClinicalNote {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "consultation" | "observation" | "followup";
}

interface SeizureHistory {
  id: string;
  type: string;
  duration: string;
  date: string;
  notes?: string;
}

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPatientById, updatePatient } = usePatients();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // États pour les traitements
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    startDate: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // États pour les notes cliniques
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ClinicalNote | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    type: "observation" as "consultation" | "observation" | "followup"
  });

  // États pour l'historique des crises
  const [seizureHistory, setSeizureHistory] = useState<SeizureHistory[]>([]);
  const [seizureDialogOpen, setSeizureDialogOpen] = useState(false);
  const [editingSeizure, setEditingSeizure] = useState<SeizureHistory | null>(null);
  const [seizureForm, setSeizureForm] = useState({
    type: "",
    duration: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // États pour l'édition des informations patient
  const [editPatientDialogOpen, setEditPatientDialogOpen] = useState(false);
  const [patientEditForm, setPatientEditForm] = useState({
    full_name: "",
    phone: "",
    epilepsy_type: "",
    trigger_factors: [] as string[],
    treating_neurologist: "",
    hospital: "",
  });

  const patient = getPatientById(Number(id));

  // Charger les données depuis l'API
  useEffect(() => {
    const loadData = async () => {
      if (!patient) return;

      try {
        // Charger les médicaments depuis l'API
        const meds = await medicationService.getPatientMedications(patient.id);
        const transformedMeds: Medication[] = meds.map(med => ({
          id: med.id.toString(),
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          startDate: med.start_date || new Date().toISOString().split('T')[0],
          status: med.status as "active" | "archived",
          notes: med.notes || ""
        }));
        setMedications(transformedMeds);
      } catch (error) {
        console.error('Failed to load medications:', error);
      }

      // Charger les notes cliniques (localStorage pour l'instant)
      const savedNotes = localStorage.getItem(`patient_${patient.id}_clinical_notes`);
      if (savedNotes) {
        setClinicalNotes(JSON.parse(savedNotes));
      }

      // Charger l'historique des crises (localStorage pour l'instant)
      const savedSeizures = localStorage.getItem(`patient_${patient.id}_seizure_history`);
      if (savedSeizures) {
        setSeizureHistory(JSON.parse(savedSeizures));
      }
    };

    loadData();
  }, [patient]);

  // Sauvegarder les notes et seizures dans localStorage (temporaire)
  useEffect(() => {
    if (patient) {
      localStorage.setItem(`patient_${patient.id}_clinical_notes`, JSON.stringify(clinicalNotes));
      localStorage.setItem(`patient_${patient.id}_seizure_history`, JSON.stringify(seizureHistory));
    }
  }, [clinicalNotes, seizureHistory, patient]);

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-muted-foreground">{t("patient_not_found", undefined, "Patient non trouvé")}</p>
          <Button onClick={() => navigate("/patients")} className="mt-4">{t("back_to_patients", undefined, "Retour aux patients")}</Button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "stable": 
      case "low": 
        return "bg-success/10 text-success border-success/20";
      case "medium": 
        return "bg-warning/10 text-warning border-warning/20";
      case "high":
      case "critical": 
        return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Vérifier si le patient est nouveau
  const isNewPatient = () => {
    if (!patient.createdAt) return true;
    const createdAt = new Date(patient.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays < 1;
  };

  // Gestion des traitements
  const handleAddMedication = async () => {
    if (!patient) return;

    if (!medicationForm.name || !medicationForm.dosage || !medicationForm.frequency) {
      toast({
        title: t("missing_fields"),
        description: t("fill_all_required_fields"),
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingMedication) {
        // Update medication
        const updated = await medicationService.updatePatientMedication(
          patient.id,
          parseInt(editingMedication.id),
          {
            name: medicationForm.name,
            dosage: medicationForm.dosage,
            frequency: medicationForm.frequency,
            notes: medicationForm.notes,
          }
        );

        setMedications(prev => prev.map(med =>
          med.id === editingMedication.id ? {
            id: updated.id.toString(),
            name: updated.name,
            dosage: updated.dosage,
            frequency: updated.frequency,
            startDate: updated.start_date || medicationForm.startDate,
            status: updated.status as "active" | "archived",
            notes: updated.notes || ""
          } : med
        ));

        toast({
          title: t("treatment_updated"),
          description: t("treatment_updated_desc")
        });
      } else {
        // Create medication
        const created = await medicationService.createPatientMedication(patient.id, {
          name: medicationForm.name,
          dosage: medicationForm.dosage,
          frequency: medicationForm.frequency,
          start_date: medicationForm.startDate,
          status: "active",
          notes: medicationForm.notes,
          is_active: true,
          reminder_enabled: true
        });

        const newMedication: Medication = {
          id: created.id.toString(),
          name: created.name,
          dosage: created.dosage,
          frequency: created.frequency,
          startDate: created.start_date || medicationForm.startDate,
          status: "active",
          notes: created.notes || ""
        };

        setMedications(prev => [newMedication, ...prev]);
        toast({
          title: t("treatment_added"),
          description: t("treatment_added_desc")
        });
      }

      setMedicationDialogOpen(false);
      resetMedicationForm();
    } catch (error) {
      console.error('Failed to save medication:', error);
      toast({
        title: t("error"),
        description: t("failed_to_save_medication", undefined, "Échec de l'enregistrement du médicament"),
        variant: "destructive"
      });
    }
  };

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setMedicationForm({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate,
      notes: medication.notes || ""
    });
    setMedicationDialogOpen(true);
  };

  const handleArchiveMedication = async (medicationId: string) => {
    if (!patient) return;

    try {
      await medicationService.updatePatientMedication(patient.id, parseInt(medicationId), {
        status: "archived"
      });

      setMedications(prev => prev.map(med =>
        med.id === medicationId ? { ...med, status: "archived" as "active" | "archived" } : med
      ));

      toast({
        title: t("treatment_archived"),
        description: t("treatment_archived_desc")
      });
    } catch (error) {
      console.error('Failed to archive medication:', error);
      toast({
        title: t("error"),
        description: t("failed_to_archive_medication", undefined, "Échec de l'archivage"),
        variant: "destructive"
      });
    }
  };

  const handleUnarchiveMedication = async (medicationId: string) => {
    if (!patient) return;

    try {
      await medicationService.updatePatientMedication(patient.id, parseInt(medicationId), {
        status: "active"
      });

      setMedications(prev => prev.map(med =>
        med.id === medicationId ? { ...med, status: "active" as "active" | "archived" } : med
      ));

      toast({
        title: t("treatment_unarchived"),
        description: t("treatment_unarchived_desc")
      });
    } catch (error) {
      console.error('Failed to unarchive medication:', error);
      toast({
        title: t("error"),
        description: t("failed_to_unarchive_medication", undefined, "Échec de la restauration"),
        variant: "destructive"
      });
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!patient) return;

    try {
      await medicationService.deletePatientMedication(patient.id, parseInt(medicationId));

      setMedications(prev => prev.filter(med => med.id !== medicationId));

      toast({
        title: t("treatment_deleted"),
        description: t("treatment_deleted_desc")
      });
    } catch (error) {
      console.error('Failed to delete medication:', error);
      toast({
        title: t("error"),
        description: t("failed_to_delete_medication", undefined, "Échec de la suppression"),
        variant: "destructive"
      });
    }
  };

  const resetMedicationForm = () => {
    setMedicationForm({
      name: "",
      dosage: "",
      frequency: "",
      startDate: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setEditingMedication(null);
  };

  // Gestion des notes cliniques
  const handleAddNote = () => {
    if (!noteForm.title || !noteForm.content) {
      toast({
        title: t("missing_fields"),
        description: t("fill_note_fields"),
        variant: "destructive"
      });
      return;
    }

    const newNote: ClinicalNote = {
      id: editingNote ? editingNote.id : Date.now().toString(),
      title: noteForm.title,
      content: noteForm.content,
      date: new Date().toLocaleDateString('fr-FR'),
      type: noteForm.type
    };

    if (editingNote) {
      setClinicalNotes(prev => prev.map(note => 
        note.id === editingNote.id ? newNote : note
      ));
      toast({
        title: t("note_updated"),
        description: t("note_updated_desc")
      });
    } else {
      setClinicalNotes(prev => [newNote, ...prev]);
      toast({
        title: t("note_added"),
        description: t("note_added_desc")
      });
    }

    setNoteDialogOpen(false);
    resetNoteForm();
  };

  const handleEditNote = (note: ClinicalNote) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      type: note.type
    });
    setNoteDialogOpen(true);
  };

  const handleDeleteNote = (noteId: string) => {
    setClinicalNotes(prev => prev.filter(note => note.id !== noteId));
    toast({
      title: t("note_deleted"),
      description: t("note_deleted_desc")
    });
  };

  const resetNoteForm = () => {
    setNoteForm({
      title: "",
      content: "",
      type: "observation"
    });
    setEditingNote(null);
  };

  // Gestion de l'historique des crises
  const handleAddSeizure = () => {
    if (!seizureForm.type || !seizureForm.duration) {
      toast({
        title: t("missing_fields"),
        description: t("fill_seizure_fields"),
        variant: "destructive"
      });
      return;
    }

    const newSeizure: SeizureHistory = {
      id: editingSeizure ? editingSeizure.id : Date.now().toString(),
      type: seizureForm.type,
      duration: seizureForm.duration,
      date: seizureForm.date,
      notes: seizureForm.notes
    };

    if (editingSeizure) {
      setSeizureHistory(prev => prev.map(seizure => 
        seizure.id === editingSeizure.id ? newSeizure : seizure
      ));
      toast({
        title: t("seizure_updated"),
        description: t("seizure_updated_desc")
      });
    } else {
      setSeizureHistory(prev => [newSeizure, ...prev]);
      toast({
        title: t("seizure_recorded"),
        description: t("seizure_recorded_desc")
      });
    }

    setSeizureDialogOpen(false);
    resetSeizureForm();
  };

  const handleEditSeizure = (seizure: SeizureHistory) => {
    setEditingSeizure(seizure);
    setSeizureForm({
      type: seizure.type,
      duration: seizure.duration,
      date: seizure.date,
      notes: seizure.notes || ""
    });
    setSeizureDialogOpen(true);
  };

  const handleDeleteSeizure = (seizureId: string) => {
    setSeizureHistory(prev => prev.filter(seizure => seizure.id !== seizureId));
    toast({
      title: t("seizure_deleted"),
      description: t("seizure_deleted_desc")
    });
  };

  const resetSeizureForm = () => {
    setSeizureForm({
      type: "",
      duration: "",
      date: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setEditingSeizure(null);
  };

  // Gestion de l'édition des informations patient
  const handleOpenEditPatient = () => {
    if (patient) {
      setPatientEditForm({
        full_name: patient.name || "",
        phone: patient.phone || "",
        epilepsy_type: patient.epilepsyType || "",
        trigger_factors: patient.trigger_factors || [],
        treating_neurologist: patient.treating_neurologist || "",
        hospital: patient.hospital || patient.country || "",
      });
      setEditPatientDialogOpen(true);
    }
  };

  const handleUpdatePatientInfo = async () => {
    if (!patient) return;

    console.log('Updating patient info:', patientEditForm);

    try {
      // Update via context which calls API and reloads data
      await updatePatient(patient.id, {
        name: patientEditForm.full_name,
        phone: patientEditForm.phone,
        epilepsyType: patientEditForm.epilepsy_type,
        treating_neurologist: patientEditForm.treating_neurologist,
        trigger_factors: patientEditForm.trigger_factors,
        country: patientEditForm.hospital,
      });

      console.log('Patient updated successfully');

      toast({
        title: t("patient_updated", undefined, "Patient mis à jour"),
        description: t("patient_updated_desc", undefined, "Les informations du patient ont été mises à jour avec succès"),
      });

      setEditPatientDialogOpen(false);
    } catch (error) {
      console.error('Failed to update patient:', error);
      const errorMessage = error instanceof Error ? error.message : t("failed_to_update_patient", undefined, "Échec de la mise à jour du patient");
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "consultation": return "bg-blue-100 text-blue-800 border-blue-200";
      case "observation": return "bg-green-100 text-green-800 border-green-200";
      case "followup": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
      case "consultation": return t("consultation");
      case "observation": return t("observation");
      case "followup": return t("followup");
      default: return type;
    }
  };

  const emptySeizureData = Array(7).fill(0).map((_, i) => ({
    day: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][i],
    seizures: 0
  }));

  const activeMedications = medications.filter(med => med.status === "active");
  const archivedMedications = medications.filter(med => med.status === "archived");
  const recentNotes = clinicalNotes.slice(0, 3);
  const recentSeizures = seizureHistory.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => navigate("/patients")} className="gap-1 p-0 h-auto">
            <ArrowLeft className="h-4 w-4" />
            Tous les patients
          </Button>
        </div>

        {/* Patient Info Header */}
        <div className="flex items-start gap-4 bg-card rounded-lg p-4 border border-border">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary font-medium">#PT{String(patient.id).padStart(4, '0')}</span>
              {isNewPatient() && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  Nouveau patient
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">{patient.country || "Adresse non spécifiée"}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {patient.phone || t("not_provided")}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Dernière visite: {patient.lastVisit}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditPatient}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier les infos
            </Button>
            <Badge className={getStatusColor(patient.healthStatus)}>{patient.healthStatus}</Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">{t("tab_overview")}</TabsTrigger>
            <TabsTrigger value="seizure-history">
              {t("tab_seizure_history")} {seizureHistory.length > 0 && `(${seizureHistory.length})`}
            </TabsTrigger>
            <TabsTrigger value="medications">
              {t("tab_medications")} {activeMedications.length > 0 && `(${activeMedications.length})`}
            </TabsTrigger>
            <TabsTrigger value="clinical-notes">
              {t("tab_clinical_notes")} {clinicalNotes.length > 0 && `(${clinicalNotes.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* About Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-primary">≡</span> {t("patient_info")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("age_label")}</p>
                      <p className="text-sm font-medium">{patient.age} ans</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Droplets className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("risk_score_label")}</p>
                      <p className="text-sm font-medium">{patient.riskScore}/100</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm">🏥</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("description_label")}</p>
                      <p className="text-sm font-medium truncate max-w-[150px]">{patient.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm">✉</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("email_label")}</p>
                      <p className="text-sm font-medium truncate">{patient.email || t("not_provided")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vital Signs Card */}
              <VitalSignsCard patientId={patient.id} />
            </div>

            {/* Overview Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Traitements Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-green-600" />
                      {t("tab_medications")}
                    </span>
                    <Badge variant="secondary">{activeMedications.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeMedications.length > 0 ? (
                    <div className="space-y-3">
                      {activeMedications.slice(0, 3).map((medication) => (
                        <div key={medication.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <p className="font-medium text-sm text-green-900">{medication.name}</p>
                            <p className="text-xs text-green-700">{medication.dosage} - {medication.frequency}</p>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                            Actif
                          </Badge>
                        </div>
                      ))}
                      {activeMedications.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          {t("more_treatments", { count: activeMedications.length - 3 })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Pill className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucun traitement actif</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 gap-2"
                    onClick={() => setActiveTab("medications")}
                  >
                    <Plus className="h-3 w-3" />
                    {t("manage_treatments")}
                  </Button>
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Notes récentes
                    </span>
                    <Badge variant="secondary">{clinicalNotes.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentNotes.length > 0 ? (
                    <div className="space-y-3">
                      {recentNotes.map((note) => (
                        <div key={note.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm text-blue-900 truncate">{note.title}</p>
                            <Badge variant="outline" className={getNoteTypeColor(note.type) + " text-xs"}>
                              {getNoteTypeLabel(note.type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-blue-700 line-clamp-2">{note.content}</p>
                          <p className="text-xs text-blue-600 mt-1">{note.date}</p>
                        </div>
                      ))}
                      {clinicalNotes.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{clinicalNotes.length - 3} autres notes
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune note clinique</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 gap-2"
                    onClick={() => setActiveTab("clinical-notes")}
                  >
                    <Plus className="h-3 w-3" />
                    Voir toutes les notes
                  </Button>
                </CardContent>
              </Card>

              {/* Historique des crises Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-600" />
                      {t("last_seizures")}
                    </span>
                    <Badge variant="secondary">{seizureHistory.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentSeizures.length > 0 ? (
                    <div className="space-y-3">
                      {recentSeizures.map((seizure) => (
                        <div key={seizure.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <p className="font-medium text-sm text-red-900">{seizure.type}</p>
                            <p className="text-xs text-red-700">Durée: {seizure.duration}</p>
                          </div>
                          <p className="text-xs text-red-600">{seizure.date}</p>
                        </div>
                      ))}
                      {seizureHistory.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{seizureHistory.length - 3} autres crises
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune crise enregistrée</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 gap-2"
                    onClick={() => setActiveTab("seizure-history")}
                  >
                    <Plus className="h-3 w-3" />
                    {t("manage_seizure_history")}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Seizure Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activité des crises (7 jours)</CardTitle>
              </CardHeader>
              <CardContent>
                {isNewPatient() ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucune donnée disponible</h3>
                    <p className="text-muted-foreground max-w-md">
                      Ce patient vient d'être ajouté au système. Les données d'activité des crises seront disponibles après le début du suivi médical.
                    </p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={emptySeizureData}>
                        <defs>
                          <linearGradient id="colorSeizures" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          domain={[0, 4]}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="seizures" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fill="url(#colorSeizures)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seizure-history" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-600" />
                  Historique des crises
                </CardTitle>
                <Button onClick={() => setSeizureDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une crise
                </Button>
              </CardHeader>
              <CardContent>
                {seizureHistory.length > 0 ? (
                  <div className="space-y-4">
                    {seizureHistory.map((seizure) => (
                      <div key={seizure.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-red-900">{seizure.type}</h4>
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                              Durée: {seizure.duration}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-red-800">
                            <span>Date: {seizure.date}</span>
                            {seizure.notes && (
                              <span>Notes: {seizure.notes}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSeizure(seizure)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSeizure(seizure.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucun historique de crises</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucune crise n'a été enregistrée pour ce patient.
                    </p>
                    <Button onClick={() => setSeizureDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter la première crise
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="mt-6 space-y-6">
            {/* Traitements actifs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-green-600" />
                  Traitements actifs
                </CardTitle>
                <Button onClick={() => setMedicationDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un traitement
                </Button>
              </CardHeader>
              <CardContent>
                {activeMedications.length > 0 ? (
                  <div className="space-y-4">
                    {activeMedications.map((medication) => (
                      <div key={medication.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-green-900">{medication.name}</h4>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                              Actif
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-green-800">
                            <div>
                              <span className="font-medium">Dosage:</span> {medication.dosage}
                            </div>
                            <div>
                              <span className="font-medium">Fréquence:</span> {medication.frequency}
                            </div>
                            <div>
                              <span className="font-medium">Début:</span> {medication.startDate}
                            </div>
                          </div>
                          {medication.notes && (
                            <p className="text-sm text-green-700 mt-2">{medication.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMedication(medication)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchiveMedication(medication.id)}
                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMedication(medication.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucun traitement actif</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucun traitement n'a été ajouté pour ce patient.
                    </p>
                    <Button onClick={() => setMedicationDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter le premier traitement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traitements archivés */}
            {archivedMedications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Archive className="h-5 w-5" />
                    Traitements archivés ({archivedMedications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {archivedMedications.map((medication) => (
                      <div key={medication.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-orange-900">{medication.name}</h4>
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                              Archivé
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-orange-800">
                            <div>
                              <span className="font-medium">Dosage:</span> {medication.dosage}
                            </div>
                            <div>
                              <span className="font-medium">Fréquence:</span> {medication.frequency}
                            </div>
                            <div>
                              <span className="font-medium">Début:</span> {medication.startDate}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnarchiveMedication(medication.id)}
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Désarchiver"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMedication(medication.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="clinical-notes" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Notes cliniques
                </CardTitle>
                <Button onClick={() => setNoteDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle note
                </Button>
              </CardHeader>
              <CardContent>
                {clinicalNotes.length > 0 ? (
                  <div className="space-y-4">
                    {clinicalNotes.map((note) => (
                      <div key={note.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-blue-900">{note.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={getNoteTypeColor(note.type)}>
                                {getNoteTypeLabel(note.type)}
                              </Badge>
                              <span className="text-sm text-blue-700">{note.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditNote(note)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNote(note.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucune note clinique</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucune note clinique n'a été enregistrée pour ce patient.
                    </p>
                    <Button onClick={() => setNoteDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter la première note
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog pour ajouter/modifier un traitement */}
      <Dialog open={medicationDialogOpen} onOpenChange={setMedicationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMedication ? t("edit_medication") : t("add_medication")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="med-name">{t("med_name_label")} *</Label>
              <Input
                id="med-name"
                value={medicationForm.name}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Valproate"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="med-dosage">{t("med_dosage_label")} *</Label>
                <Input
                  id="med-dosage"
                  value={medicationForm.dosage}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="Ex: 500mg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-frequency">{t("med_frequency_label")} *</Label>
                <Input
                  id="med-frequency"
                  value={medicationForm.frequency}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, frequency: e.target.value }))}
                  placeholder="Ex: 2x par jour"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-date">{t("med_date_label")}</Label>
              <Input
                id="med-date"
                type="date"
                value={medicationForm.startDate}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-notes">{t("med_notes_label")}</Label>
              <Textarea
                id="med-notes"
                value={medicationForm.notes}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes supplémentaires sur le traitement..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMedicationDialogOpen(false);
              resetMedicationForm();
            }}>
              Annuler
            </Button>
            <Button onClick={handleAddMedication}>
              {editingMedication ? t("edit") : t("add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour ajouter/modifier une note clinique */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNote ? t("edit_note") : t("add_note")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">{t("note_title_label")} *</Label>
              <Input
                id="note-title"
                value={noteForm.title}
                onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Consultation de suivi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-type">{t("note_type_label")}</Label>
              <Select value={noteForm.type} onValueChange={(value: "consultation" | "observation" | "followup") => 
                setNoteForm(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">{t("consultation")}</SelectItem>
                  <SelectItem value="observation">{t("observation")}</SelectItem>
                  <SelectItem value="followup">{t("followup")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">{t("note_content_label")} *</Label>
              <Textarea
                id="note-content"
                value={noteForm.content}
                onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Détails de la note clinique..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNoteDialogOpen(false);
              resetNoteForm();
            }}>
              Annuler
            </Button>
            <Button onClick={handleAddNote}>
              {editingNote ? t("edit") : t("add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour ajouter/modifier une crise */}
      <Dialog open={seizureDialogOpen} onOpenChange={setSeizureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSeizure ? t("edit_seizure") : t("add_seizure")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seizure-type">{t("seizure_type_label")} *</Label>
              <Input
                id="seizure-type"
                value={seizureForm.type}
                onChange={(e) => setSeizureForm(prev => ({ ...prev, type: e.target.value }))}
                placeholder="Ex: Crise tonico-clonique"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seizure-duration">{t("seizure_duration_label")} *</Label>
                <Input
                  id="seizure-duration"
                  value={seizureForm.duration}
                  onChange={(e) => setSeizureForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Ex: 2 minutes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seizure-date">{t("seizure_date_label")}</Label>
                <Input
                  id="seizure-date"
                  type="date"
                  value={seizureForm.date}
                  onChange={(e) => setSeizureForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seizure-notes">{t("seizure_notes_label")}</Label>
              <Textarea
                id="seizure-notes"
                value={seizureForm.notes}
                onChange={(e) => setSeizureForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes supplémentaires sur la crise..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSeizureDialogOpen(false);
              resetSeizureForm();
            }}>
              Annuler
            </Button>
            <Button onClick={handleAddSeizure}>
              {editingSeizure ? t("edit") : t("add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier les informations patient */}
      <Dialog open={editPatientDialogOpen} onOpenChange={setEditPatientDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier les informations du patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient-name">Nom complet *</Label>
                <Input
                  id="patient-name"
                  value={patientEditForm.full_name}
                  onChange={(e) => setPatientEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-phone">Téléphone</Label>
                <Input
                  id="patient-phone"
                  value={patientEditForm.phone}
                  onChange={(e) => setPatientEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +212 600 123 456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient-epilepsy-type">Type d'épilepsie</Label>
                <Input
                  id="patient-epilepsy-type"
                  value={patientEditForm.epilepsy_type}
                  onChange={(e) => setPatientEditForm(prev => ({ ...prev, epilepsy_type: e.target.value }))}
                  placeholder="Ex: Épilepsie temporale"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-hospital">Hôpital</Label>
                <Input
                  id="patient-hospital"
                  value={patientEditForm.hospital}
                  onChange={(e) => setPatientEditForm(prev => ({ ...prev, hospital: e.target.value }))}
                  placeholder="Ex: CHU Mohammed VI"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-neurologist">Neurologue traitant</Label>
              <Input
                id="patient-neurologist"
                value={patientEditForm.treating_neurologist}
                onChange={(e) => setPatientEditForm(prev => ({ ...prev, treating_neurologist: e.target.value }))}
                placeholder="Ex: Dr. Ahmed Benali"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-triggers">Facteurs déclenchants</Label>
              <Textarea
                id="patient-triggers"
                value={patientEditForm.trigger_factors.join(', ')}
                onChange={(e) => setPatientEditForm(prev => ({
                  ...prev,
                  trigger_factors: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                }))}
                placeholder="Ex: stress, manque de sommeil, lumières clignotantes (séparés par des virgules)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPatientDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdatePatientInfo}>
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PatientDetail;