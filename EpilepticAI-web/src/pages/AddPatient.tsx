import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { usePatients } from "@/contexts/PatientsContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, FileText, Heart, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";

// Interface temporaire pour résoudre l'erreur TypeScript
interface PatientFormData {
  name: string;
  age: number;
  description: string;
  lastVisit: string;
  riskScore: number;
  heartRate: number;
  healthStatus: string;
  address?: string;
  phone?: string;
  email?: string;
  password?: string;
}

const AddPatient = () => {
  const navigate = useNavigate();
  const { addPatient } = usePatients();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    password: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    healthStatus: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = t("name_required");
    if (!formData.age) newErrors.age = t("age_required");
    if (!formData.healthStatus) newErrors.healthStatus = t("health_status_required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ name: true, age: true, healthStatus: true });
      return;
    }

    // Créer l'objet patient avec l'interface correcte
    const patientData: PatientFormData = {
      name: formData.name,
      age: parseInt(formData.age || "0"),
      description: formData.description || t("new_patient_text"),
      lastVisit: t("just_now_text"),
      riskScore: Math.floor(Math.random() * 50) + 30,
      heartRate: Math.floor(Math.random() * 40) + 60,
      healthStatus: formData.healthStatus,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      password: formData.password || undefined,
    };

    // Ajouter l'adresse si elle existe
    if (formData.address && formData.address.trim() !== "") {
      patientData.address = formData.address;
    }

    try {
      // Utiliser 'as any' pour éviter l'erreur TypeScript temporairement
      await addPatient(patientData as any);

      toast({
        title: t("patient_registered"),
        description: t("patient_added_description", { name: formData.name }),
      });

      navigate("/patients");
    } catch (error: any) {
      console.error('Failed to add patient:', error);
      toast({
        title: t("error", undefined, "Erreur"),
        description: error.message || t("failed_to_add_patient", undefined, "Échec de l'ajout du patient"),
        variant: "destructive"
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Stable': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      'Low': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
      'Medium': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      'High': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
      'Critical': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
    };
    return colors[status] || '';
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 dark:from-background dark:via-secondary/5 dark:to-primary/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête avec navigation */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/patients")}
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back_to_patients", undefined, "Retour aux patients")}
            </Button>
            
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">{t("new_patient", undefined, "Nouveau patient")}</h1>
                  <p className="text-muted-foreground">{t("add_patient_subtitle", undefined, "Enregistrez les informations du patient dans le système médical")}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5 text-primary" />
                  {t("personal_information", undefined, "Informations personnelles")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("identity_and_contact", undefined, "Identité et coordonnées du patient")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nom */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground flex items-center gap-2">
                      {t("full_name", undefined, "Nom complet")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        id="name"
                        className={`pl-10 h-11 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background ${
                          touched.name && errors.name ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                        } ${touched.name && formData.name && !errors.name ? 'border-emerald-500 dark:border-emerald-600' : ''}`}
                        placeholder={t("name_placeholder", undefined, "Ex: Dr. Ahmed Ben Salem")}
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                      />
                      {touched.name && formData.name && !errors.name && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      )}
                    </div>
                    {touched.name && errors.name && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Âge */}
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium text-foreground flex items-center gap-2">
                      {t("age", undefined, "Âge")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <Input
                        id="age"
                        type="number"
                        className={`pl-10 h-11 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background ${
                          touched.age && errors.age ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                        } ${touched.age && formData.age && !errors.age ? 'border-emerald-500 dark:border-emerald-600' : ''}`}
                        placeholder={t("age_placeholder", undefined, "Ex: 45")}
                        value={formData.age}
                        onChange={(e) => handleChange("age", e.target.value)}
                        onBlur={() => handleBlur("age")}
                      />
                      {touched.age && formData.age && !errors.age && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      )}
                    </div>
                    {touched.age && errors.age && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.age}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                      {t("phone", undefined, "Téléphone")}
                    </Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Phone className="h-4 w-4" />
                      </div>
                      <Input
                        id="phone"
                        className="pl-10 h-11 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                        placeholder={t("phone_placeholder", undefined, "+216 XX XXX XXX")}
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      {t("email", undefined, "Adresse e-mail")}
                    </Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        className="pl-10 h-11 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                        placeholder={t("email_placeholder", undefined, "patient@exemple.com")}
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Mot de passe pour le patient */}
                <div className="mt-4">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    {t("create_password", undefined, "Créer un mot de passe")}
                  </Label>
                  <div className="relative group max-w-md">
                    <Input
                      id="password"
                      type="password"
                      className="pl-3 h-11 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                      placeholder={t("password_placeholder", undefined, "Mot de passe du patient")}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t("password_saved", undefined, "Le mot de passe sera stocké de manière sécurisée")}</p>
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-foreground">
                    {t("full_address", undefined, "Adresse complète")}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <Input
                      id="address"
                      className="pl-10 h-11 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                      placeholder={t("address_placeholder", undefined, "Rue, ville, code postal, pays")}
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations médicales */}
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-destructive/10 to-pink-500/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Heart className="h-5 w-5 text-destructive" />
                  {t("medical_information", undefined, "Informations médicales")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("health_status_and_observations", undefined, "État de santé et observations cliniques")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* État de santé */}
                <div className="space-y-2">
                  <Label htmlFor="healthStatus" className="text-sm font-medium text-foreground flex items-center gap-2">
                    {t("current_health_status", undefined, "État de santé actuel")}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.healthStatus}
                    onValueChange={(value) => handleChange("healthStatus", value)}
                  >
                    <SelectTrigger className={`h-11 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background ${
                      touched.healthStatus && errors.healthStatus ? 'border-destructive' : ''
                    }`}>
                      <SelectValue placeholder={t("select_health_status", undefined, "Sélectionnez l'état de santé du patient")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Stable">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                          <span className="text-foreground">Stable</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                          <span className="text-foreground">{t("low_risk", undefined, "Risque faible")}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></div>
                          <span className="text-foreground">{t("medium_risk", undefined, "Risque modéré")}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="High">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400"></div>
                          <span className="text-foreground">{t("high_risk", undefined, "Risque élevé")}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Critical">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></div>
                          <span className="text-foreground">{t("critical_status", undefined, "État critique")}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {touched.healthStatus && errors.healthStatus && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.healthStatus}</span>
                    </div>
                  )}
                  {formData.healthStatus && (
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(formData.healthStatus)}`}>
                      {t("selected", undefined, "Sélectionné")}: {formData.healthStatus}
                    </div>
                  )}
                </div>

                {/* Observations */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">
                    {t("medical_observations", undefined, "Observations médicales et antécédents")}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <Textarea
                      id="description"
                      className="pl-10 min-h-[120px] border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none bg-background"
                      placeholder={t("description_placeholder", undefined, "Décrivez les symptômes, diagnostics, traitements en cours, allergies connues, antécédents familiaux...")}
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={5}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("description_help", undefined, "Ces informations aideront à assurer un suivi médical approprié")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit"
                className="flex-1 sm:flex-initial h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t("save_patient", undefined, "Enregistrer le patient")}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => navigate("/patients")}
                className="flex-1 sm:flex-initial h-12 border-2 border-input hover:bg-accent hover:text-accent-foreground font-medium transition-all"
              >
                {t("cancel", undefined, "Annuler")}
              </Button>
            </div>

            {/* Note de bas de page */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {t("required_fields_note", undefined, "Les champs marqués d'un astérisque")} 
                  (<span className="text-destructive">*</span>) 
                  {t("are_required_note", undefined, "sont obligatoires. Toutes les informations sont confidentielles et protégées conformément aux réglementations sur la protection des données médicales.")}
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddPatient;