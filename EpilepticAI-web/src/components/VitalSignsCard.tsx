import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Thermometer, Droplets, Activity } from "lucide-react";
import { biometricService, type BiometricData } from "@/services/biometricService";

interface VitalSignsCardProps {
  patientId: number;
}

const VitalSignsCard = ({ patientId }: VitalSignsCardProps) => {
  const [biometrics, setBiometrics] = useState<BiometricData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBiometrics = async () => {
      setLoading(true);
      const data = await biometricService.getLatestBiometrics(patientId);
      setBiometrics(data);
      setLoading(false);
    };

    // Initial fetch
    fetchBiometrics();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchBiometrics, 30000);

    return () => clearInterval(interval);
  }, [patientId]);

  const getValueColor = (value: number | undefined, type: string): string => {
    if (!value) return "text-gray-600";

    switch (type) {
      case "hr":
        // Normal: 60-100 bpm
        if (value < 60 || value > 100) return "text-red-600";
        return "text-green-600";
      case "hrv":
        // Higher is generally better
        if (value < 20) return "text-red-600";
        if (value < 50) return "text-yellow-600";
        return "text-green-600";
      case "spo2":
        // Normal: >= 95%
        if (value < 90) return "text-red-600";
        if (value < 95) return "text-yellow-600";
        return "text-green-600";
      case "temp":
        // Normal: 36.1-37.2°C
        if (value < 36.1 || value > 37.2) return "text-red-600";
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-primary">⊞</span> Signes vitaux
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div>
              <div className="h-3 w-16 bg-gray-300 rounded mb-1"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div>
              <div className="h-3 w-16 bg-gray-300 rounded mb-1"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div>
              <div className="h-3 w-16 bg-gray-300 rounded mb-1"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div>
              <div className="h-3 w-16 bg-gray-300 rounded mb-1"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!biometrics) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-primary">⊞</span> Signes vitaux
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune donnée biométrique disponible
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Le patient n'a pas encore synchronisé ses données de santé
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-primary">⊞</span> Signes vitaux
          </span>
          <span className="text-xs text-muted-foreground">
            Mis à jour: {new Date(biometrics.recorded_at).toLocaleTimeString('fr-FR')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {/* Heart Rate */}
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">HR</p>
            <p className={`text-sm font-medium ${getValueColor(biometrics.heart_rate, 'hr')}`}>
              ● {biometrics.heart_rate ?? '--'} bpm
            </p>
          </div>
        </div>

        {/* Heart Rate Variability */}
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-500" />
          <div>
            <p className="text-xs text-muted-foreground">HRV</p>
            <p className={`text-sm font-medium ${getValueColor(biometrics.heart_rate_variability, 'hrv')}`}>
              ● {biometrics.heart_rate_variability ?? '--'} ms
            </p>
          </div>
        </div>

        {/* SPO2 */}
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">SPO2</p>
            <p className={`text-sm font-medium ${getValueColor(biometrics.spo2, 'spo2')}`}>
              ● {biometrics.spo2 ?? '--'}%
            </p>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">Température</p>
            <p className={`text-sm font-medium ${getValueColor(biometrics.skin_temp, 'temp')}`}>
              ● {biometrics.skin_temp?.toFixed(1) ?? '--'}°C
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalSignsCard;
