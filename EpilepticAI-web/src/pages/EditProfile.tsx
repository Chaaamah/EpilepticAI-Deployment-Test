import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Phone,
  Mail,
  MapPin,
  Award,
  Calendar,
  IdCard,
  User as UserIcon,
  Save,
  X,
  Droplets,
  Briefcase,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Interface pour les créneaux horaires
interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

const EditProfile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
  };

  const [formData, setFormData] = useState({
    // Informations personnelles
    name: safeUser.name,
    email: safeUser.email,
    phone: safeUser.phone,
    dob: safeUser.dob,
    gender: safeUser.gender,
    bloodGroup: safeUser.bloodGroup,
    location: safeUser.location,
    yearsExperience: safeUser.yearsExperience,
    
    // Informations professionnelles
    specialization: safeUser.specialization,
    qualifications: safeUser.qualifications,
    clinic: safeUser.clinic,
    licenseNumber: safeUser.licenseNumber,
    bio: safeUser.bio,
    status: safeUser.status,
    
    // Éducation et certifications
    education: safeUser.education,
    certifications: safeUser.certifications,
    awards: safeUser.awards,
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState({
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });

  const [loading, setLoading] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeOptions = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
  ];

  // Fonction pour convertir AM/PM en format 24h
  const convertTo24Hour = (timeStr: string): string => {
    const time = timeStr.trim();
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    
    if (modifier === 'PM' && hours !== '12') {
      hours = String(parseInt(hours, 10) + 12);
    }
    if (modifier === 'AM' && hours === '12') {
      hours = '00';
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  // Fonction pour convertir du format 24h vers AM/PM
  const convertTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${suffix}`;
  };

  // Fonction pour parser la disponibilité existante en créneaux
  const parseExistingAvailability = (availability: string): TimeSlot[] => {
    if (!availability) return [];
    
    const slots: TimeSlot[] = [];
    const lines = availability.split("\n");
    
    lines.forEach((line, index) => {
      const match = line.match(/^(\w+):\s*(.+?)\s*-\s*(.+)$/);
      if (match) {
        slots.push({
          id: `slot-${index}`,
          day: match[1],
          startTime: convertTo24Hour(match[2]),
          endTime: convertTo24Hour(match[3]),
        });
      }
    });
    
    return slots;
  };

  // Fonction pour formater les créneaux en texte
  const formatTimeSlotsForStorage = (slots: TimeSlot[]): string => {
    return slots.map(slot => 
      `${slot.day}: ${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}`
    ).join('\n');
  };

  useEffect(() => {
    if (safeUser.availability) {
      setTimeSlots(parseExistingAvailability(safeUser.availability));
    }
    
    // Initialiser formData avec les valeurs de safeUser
    setFormData({
      name: safeUser.name,
      email: safeUser.email,
      phone: safeUser.phone,
      dob: safeUser.dob,
      gender: safeUser.gender,
      bloodGroup: safeUser.bloodGroup,
      location: safeUser.location,
      yearsExperience: safeUser.yearsExperience,
      specialization: safeUser.specialization,
      qualifications: safeUser.qualifications,
      clinic: safeUser.clinic,
      licenseNumber: safeUser.licenseNumber,
      bio: safeUser.bio,
      status: safeUser.status,
      education: safeUser.education,
      certifications: safeUser.certifications,
      awards: safeUser.awards,
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      gender: value
    }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  const handleBloodGroupChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      bloodGroup: value
    }));
  };

  const handleAddTimeSlot = () => {
    if (newTimeSlot.startTime && newTimeSlot.endTime) {
      const newSlot: TimeSlot = {
        id: `slot-${Date.now()}`,
        day: newTimeSlot.day,
        startTime: newTimeSlot.startTime,
        endTime: newTimeSlot.endTime,
      };
      
      setTimeSlots(prev => [...prev, newSlot]);
      
      // Réinitialiser le formulaire de nouveau créneau
      setNewTimeSlot({
        day: "Monday",
        startTime: "09:00",
        endTime: "17:00",
      });
    }
  };

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const availabilityText = formatTimeSlotsForStorage(timeSlots);
      const dataToUpdate = {
        ...formData,
        availability: availabilityText
      };
      
      await updateProfile(dataToUpdate);
      
      // Toast de succès
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/profile");
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Informations personnelles et professionnelles */}
            <div className="lg:col-span-2 space-y-6">
              {/* En-tête avec ID */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">#DT2002</span>
                    <div className="h-4 w-[1px] bg-gray-300"></div>
                    <Select
                      value={formData.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Dr. John Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      required
                      placeholder="Cardiology"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Input
                      id="qualifications"
                      name="qualifications"
                      value={formData.qualifications}
                      onChange={handleChange}
                      placeholder="MBBS, M.D, Cardiology"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic">Clinic/Hospital *</Label>
                    <Input
                      id="clinic"
                      name="clinic"
                      value={formData.clinic}
                      onChange={handleChange}
                      required
                      placeholder="Downtown Medical Clinic"
                    />
                  </div>
                </div>
              </Card>

              {/* Bio */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Short Bio</h3>
                <div className="space-y-2">
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about your professional background and expertise..."
                    rows={6}
                    className="min-h-[150px]"
                  />
                </div>
              </Card>

              {/* AVAILABILITY - Interface améliorée */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Availability</h3>
                
                {/* Formulaire pour ajouter un nouveau créneau */}
                <div className="bg-muted/30 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-3">Add New Time Slot</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="day-select">Day</Label>
                      <Select
                        value={newTimeSlot.day}
                        onValueChange={(value) => setNewTimeSlot(prev => ({ ...prev, day: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start-time">Start Time</Label>
                      <Select
                        value={newTimeSlot.startTime}
                        onValueChange={(value) => setNewTimeSlot(prev => ({ ...prev, startTime: value }))}
                      >
                        <SelectTrigger>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>
                              {convertTo12Hour(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-time">End Time</Label>
                      <Select
                        value={newTimeSlot.endTime}
                        onValueChange={(value) => setNewTimeSlot(prev => ({ ...prev, endTime: value }))}
                      >
                        <SelectTrigger>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>
                              {convertTo12Hour(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={handleAddTimeSlot}
                        className="w-full"
                        disabled={!newTimeSlot.startTime || !newTimeSlot.endTime}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Slot
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Liste des créneaux existants */}
                <div>
                  <h4 className="font-medium mb-3">Current Time Slots</h4>
                  
                  {timeSlots.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No time slots added yet.</p>
                      <p className="text-sm">Add your availability using the form above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* En-tête du tableau */}
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                        <div className="col-span-3">Day</div>
                        <div className="col-span-3">Start Time</div>
                        <div className="col-span-3">End Time</div>
                        <div className="col-span-3">Duration</div>
                      </div>
                      
                      {/* Liste des créneaux */}
                      {timeSlots.map((slot) => {
                        const startHour = parseInt(slot.startTime.split(':')[0]);
                        const startMin = parseInt(slot.startTime.split(':')[1]);
                        const endHour = parseInt(slot.endTime.split(':')[0]);
                        const endMin = parseInt(slot.endTime.split(':')[1]);
                        
                        const durationHours = endHour - startHour + (endMin - startMin) / 60;
                        
                        return (
                          <div 
                            key={slot.id} 
                            className="grid grid-cols-12 gap-2 items-center p-3 bg-card border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="col-span-3 font-medium">{slot.day}</div>
                            <div className="col-span-3">
                              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                {convertTo12Hour(slot.startTime)}
                              </span>
                            </div>
                            <div className="col-span-3">
                              <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                                {convertTo12Hour(slot.endTime)}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-sm">
                                {durationHours} hour{durationHours !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTimeSlot(slot.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Vue d'ensemble par jour */}
                {timeSlots.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Weekly Overview</h4>
                    <div className="grid grid-cols-7 gap-2">
                      {days.map(day => {
                        const daySlots = timeSlots.filter(slot => slot.day === day);
                        return (
                          <div key={day} className="text-center">
                            <div className="font-medium text-sm mb-2 p-2 bg-muted/30 rounded">
                              {day.slice(0, 3)}
                            </div>
                            <div className="space-y-1">
                              {daySlots.length > 0 ? (
                                daySlots.map((slot, index) => (
                                  <div 
                                    key={index} 
                                    className="text-xs p-1 bg-primary/10 text-primary rounded"
                                  >
                                    {convertTo12Hour(slot.startTime)} - {convertTo12Hour(slot.endTime)}
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-muted-foreground p-1">
                                  Unavailable
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              {/* Awards & Recognition */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Awards & Recognition</h3>
                <div className="space-y-2">
                  <Label htmlFor="awards">
                    Awards and Honors (one per line with description separated by new line)
                  </Label>
                  <Textarea
                    id="awards"
                    name="awards"
                    value={formData.awards}
                    onChange={handleChange}
                    placeholder="Top Doctor Award (2023)
Recognized by U.S. News & World Report for outstanding achievements in family medicine.

Patient Choice Award (2022)
Awarded by Vitals.com for consistently receiving high patient ratings in satisfaction and care."
                    rows={8}
                    className="min-h-[200px]"
                  />
                </div>
              </Card>

              {/* Certifications */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Certifications</h3>
                <div className="space-y-2">
                  <Label htmlFor="certifications">
                    Professional Certifications (one per line with description separated by new line)
                  </Label>
                  <Textarea
                    id="certifications"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    placeholder="Certification by the American Board of Family Medicine (ABFM), 2015
Demonstrates mastery of comprehensive, ongoing care for individuals and families, across all ages and genders.

American Heart Association, 2024
Certification in performing life-saving techniques, including CPR and emergency cardiac care for adults and children."
                    rows={8}
                    className="min-h-[200px]"
                  />
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN - Informations personnelles détaillées */}
            <div className="space-y-6">
              {/* About Section */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">About</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="text-sm text-muted-foreground">
                      Medical License Number
                    </Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="licenseNumber"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="MLS66659898"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-muted-foreground">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="+1 54546 45648"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm text-muted-foreground">
                      Location
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="pl-10 min-h-[80px]"
                        placeholder="4150 Hiney Road, Las Vegas, NV 89109"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-sm text-muted-foreground">
                        DOB
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="dob"
                          name="dob"
                          type="date"
                          value={formData.dob}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Blood Group
                      </Label>
                      <Select
                        value={formData.bloodGroup}
                        onValueChange={handleBloodGroupChange}
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <Droplets className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select blood group" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="O+">O +ve</SelectItem>
                          <SelectItem value="O-">O -ve</SelectItem>
                          <SelectItem value="A+">A +ve</SelectItem>
                          <SelectItem value="A-">A -ve</SelectItem>
                          <SelectItem value="B+">B +ve</SelectItem>
                          <SelectItem value="B-">B -ve</SelectItem>
                          <SelectItem value="AB+">AB +ve</SelectItem>
                          <SelectItem value="AB-">AB -ve</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience" className="text-sm text-muted-foreground">
                        Years of Experience
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="yearsExperience"
                          name="yearsExperience"
                          value={formData.yearsExperience}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="15+ Years"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Gender
                      </Label>
                      <RadioGroup
                        value={formData.gender}
                        onValueChange={handleGenderChange}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male" className="cursor-pointer">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female" className="cursor-pointer">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Education Information */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Education Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="education">
                    Education Background (one per line with dates)
                  </Label>
                  <Textarea
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="Boston Medicine Institution - MD
25 May 1990 - 29 Jan 1992

Harvard Medical School, Boston - MBBS
25 May 1985 - 29 Jan 1990"
                    rows={6}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter each degree/institution on a new line followed by dates on the next line
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditProfile;