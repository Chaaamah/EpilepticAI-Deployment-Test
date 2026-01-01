import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MapPin,
  Award,
  Calendar,
  IdCard,
  User as UserIcon,
  Pencil,
  Droplets,
  Briefcase,
  CheckCircle
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();

  // Créer un objet utilisateur sûr avec toutes les propriétés nécessaires
  const safeUser = {
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    dob: (user as any)?.dob || '',
    gender: (user as any)?.gender || '',
    bloodGroup: (user as any)?.bloodGroup || '',
    location: (user as any)?.location || '',
    yearsExperience: (user as any)?.yearsExperience || '',
    specialization: (user as any)?.specialization || '',
    qualifications: (user as any)?.qualifications || '',
    clinic: (user as any)?.clinic || '',
    licenseNumber: (user as any)?.licenseNumber || '',
    bio: (user as any)?.bio || '',
    status: (user as any)?.status || 'available',
    availability: (user as any)?.availability || '',
    education: (user as any)?.education || '',
    certifications: (user as any)?.certifications || '',
    awards: (user as any)?.awards || '',
    profileImage: (user as any)?.profileImage || '',
  };

  // Fonction pour formater la disponibilité par jour
  const getAvailabilityByDay = () => {
    if (!safeUser?.availability) return {};
    
    const availabilityByDay: { [key: string]: string[] } = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    
    days.forEach(day => {
      availabilityByDay[day] = [];
    });

    safeUser.availability.split("\n").forEach(slot => {
      const match = slot.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const day = match[1];
        const time = match[2];
        if (availabilityByDay[day]) {
          availabilityByDay[day].push(time);
        }
      }
    });

    return availabilityByDay;
  };

  // Fonction pour parser les awards avec descriptions
  const parseAwards = () => {
    if (!safeUser?.awards) return [];
    
    const awards = [];
    const lines = safeUser.awards.split("\n");
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i]) {
        awards.push({
          title: lines[i].trim(),
          description: lines[i + 1] ? lines[i + 1].trim() : ""
        });
      }
    }
    
    return awards;
  };

  // Fonction pour parser les certifications avec descriptions
  const parseCertifications = () => {
    if (!safeUser?.certifications) return [];
    
    const certifications = [];
    const lines = safeUser.certifications.split("\n");
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i]) {
        certifications.push({
          title: lines[i].trim(),
          description: lines[i + 1] ? lines[i + 1].trim() : ""
        });
      }
    }
    
    return certifications;
  };

  // Fonction pour parser l'éducation avec dates
  const parseEducation = () => {
    if (!safeUser?.education) return [];
    
    const education = [];
    const lines = safeUser.education.split("\n");
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i]) {
        education.push({
          institution: lines[i].trim(),
          period: lines[i + 1] ? lines[i + 1].trim() : ""
        });
      }
    }
    
    return education;
  };

  const availabilityByDay = getAvailabilityByDay();
  const awards = parseAwards();
  const certifications = parseCertifications();
  const education = parseEducation();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Photo de profil */}
              <div className="relative">
                {safeUser.profileImage ? (
                  <img 
                    src={safeUser.profileImage} 
                    alt={safeUser.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                    <UserIcon className="w-8 h-8 text-primary" />
                  </div>
                )}
                <Badge 
                  variant={safeUser.status === "available" ? "default" : "secondary"}
                  className="absolute -bottom-1 -right-1 text-xs px-2 py-0.5"
                >
                  {safeUser.status === "available" ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Available
                    </>
                  ) : (
                    safeUser.status
                  )}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">#DT2002</span>
                <div className="h-4 w-[1px] bg-gray-300"></div>
                <h1 className="text-xl font-bold">{safeUser.name}</h1>
                <div className="h-4 w-[1px] bg-gray-300"></div>
                <span className="text-primary">{safeUser.specialization}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button asChild size="sm">
                <Link to="/profile/edit" className="flex items-center gap-2">
                  <Pencil className="w-4" /> Edit Profile
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{safeUser.qualifications}</span>
            <div className="h-4 w-[1px] bg-gray-300"></div>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Clinic : {safeUser.clinic}
            </span>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-6">

            {/* SHORT BIO */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-3">Short Bio</h3>
              <p className="text-muted-foreground leading-relaxed">
                {safeUser.bio || "No bio available"}
              </p>
            </Card>

            {/* AVAILABILITY */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Availability</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                    <div key={day} className="text-center font-medium text-sm p-2 bg-muted/30 rounded">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                    <div key={day} className="space-y-2">
                      {availabilityByDay[day] && availabilityByDay[day].length > 0 ? (
                        availabilityByDay[day].map((time, index) => (
                          <div
                            key={index}
                            className="border rounded-md p-2 text-center text-sm bg-primary/5"
                          >
                            {time}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-muted-foreground p-2">
                          -
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* AWARDS & RECOGNITION */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Awards & Recognition</h3>
              <div className="space-y-4">
                {awards.length > 0 ? (
                  awards.map((award, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{award.title}</p>
                          {award.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {award.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {index < awards.length - 1 && <hr className="my-4" />}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No awards available</p>
                )}
              </div>
            </Card>

            {/* CERTIFICATIONS */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Certifications</h3>
              <div className="space-y-4">
                {certifications.length > 0 ? (
                  certifications.map((cert, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{cert.title}</p>
                          {cert.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {cert.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {index < certifications.length - 1 && <hr className="my-4" />}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No certifications available</p>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* ABOUT */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">About</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <IdCard className="w-4 h-4" />
                    <span>Medical License Number</span>
                  </div>
                  <p className="font-medium">{safeUser.licenseNumber || "-"}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </div>
                  <p className="font-medium">{safeUser.phone || "-"}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </div>
                  <p className="font-medium">{safeUser.email || "-"}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Location</span>
                  </div>
                  <p className="font-medium">{safeUser.location || "-"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>DOB</span>
                    </div>
                    <p className="font-medium">{safeUser.dob || "-"}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Droplets className="w-4 h-4" />
                      <span>Blood Group</span>
                    </div>
                    <p className="font-medium">{safeUser.bloodGroup || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span>Years of Experience</span>
                    </div>
                    <p className="font-medium">{safeUser.yearsExperience || "-"}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <UserIcon className="w-4 h-4" />
                      <span>Gender</span>
                    </div>
                    <p className="font-medium">{safeUser.gender || "-"}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* EDUCATION INFORMATION */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Education Information</h3>
              <div className="space-y-4">
                {education.length > 0 ? (
                  education.map((edu, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{edu.institution}</p>
                          <p className="text-sm text-muted-foreground mt-1">{edu.period}</p>
                        </div>
                      </div>
                      {index < education.length - 1 && <hr className="my-4" />}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No education information available</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;