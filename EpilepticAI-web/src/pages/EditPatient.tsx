import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";
import { useToast } from "@/hooks/use-toast";
import { usePatients } from "@/contexts/PatientsContext";

// Définir le type Patient localement
interface Patient {
  id: number;
  name: string;
  age: number;
  phone?: string;
  email?: string;
  description: string;
  healthStatus: string;
}

// Type étendu avec address
interface PatientWithAddress extends Patient {
  address?: string;
}

const EditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getPatientById, updatePatient } = usePatients();
  const { t } = useTranslation();

  const patient = getPatientById(Number(id));

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    healthStatus: "",
  });

  useEffect(() => {
    if (patient) {
      const patientWithAddress = patient as PatientWithAddress;
      
      setFormData({
        name: patientWithAddress.name || "",
        age: String(patientWithAddress.age || ""),
        phone: patientWithAddress.phone || "",
        email: patientWithAddress.email || "",
        address: patientWithAddress.address || "",
        description: patientWithAddress.description || "",
        healthStatus: patientWithAddress.healthStatus || "",
      });
    }
  }, [patient]);

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-muted-foreground">{t("patient_not_found")}</p>
          <Button onClick={() => navigate("/patients")} className="mt-4">
            {t("back_to_patients")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.age || !formData.healthStatus) {
      toast({
        title: t("error_fill_required"),
        description: t("error_fill_required"),
        variant: "destructive",
      });
      return;
    }

    console.log('Submitting patient update:', formData);

    try {
      // Mettre à jour via le contexte qui appelle l'API et recharge les données
      await updatePatient(Number(id), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: parseInt(formData.age),
        description: formData.description,
        healthStatus: formData.healthStatus,
        address: formData.address,
      });

      console.log('Patient updated successfully');

      toast({
        title: t("patient_updated"),
        description: `${formData.name} a été mis à jour avec succès`,
      });

      navigate(`/patients/${id}`);
    } catch (error) {
      console.error('Failed to update patient:', error);
      toast({
        title: t("error"),
        description: "Échec de la mise à jour du patient",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("edit_patient_title")}</h1>
            <p className="text-muted-foreground">{t("edit_patient_subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t("personal_info")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("full_name")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("full_name")}
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">{t("age_label")} *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder={t("age_label")}
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone_label")}</Label>
                  <Input
                    id="phone"
                    placeholder="+216 XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email_label")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("address_label")}</Label>
                <Input
                  id="address"
                  placeholder={t("address_label")}
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthStatus">{t("health_status_label")} *</Label>
                <Select
                  value={formData.healthStatus}
                  onValueChange={(value) => handleChange("healthStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_state_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stable">{t("status_stable")}</SelectItem>
                    <SelectItem value="Low">{t("status_low")}</SelectItem>
                    <SelectItem value="Medium">{t("status_medium")}</SelectItem>
                    <SelectItem value="High">{t("status_high")}</SelectItem>
                    <SelectItem value="Critical">{t("status_critical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("medical_description")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("medical_description")}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button type="submit">{t("save")}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditPatient;