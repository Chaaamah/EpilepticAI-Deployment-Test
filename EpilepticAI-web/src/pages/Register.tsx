import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../components/EpilepticAI.png";
import { useTranslation } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("doctor");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addDoctor } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreed) {
      toast({
        title: t("terms_required"),
        description: t("agree_required"),
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("password_mismatch"),
        description: t("password_mismatch_desc"),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let response;

      // Different endpoint based on role selection
      if (role === "admin") {
        // Register admin - only creates in users table
        response = await fetch('/api/v1/auth/register/admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
            confirm_password: confirmPassword,
            full_name: fullName,
            phone: ""
          })
        });
      } else {
        // Register doctor - creates in both users and doctors tables
        response = await fetch('/api/v1/auth/register/doctor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
            confirm_password: confirmPassword,
            full_name: fullName,
            phone: "",
            specialization: "",
            license_number: "",
            hospital: ""
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', data);

      setIsLoading(false);

      toast({
        title: t("registration_successful"),
        description: role === "admin"
          ? "Admin account created successfully"
          : t("registration_successful_desc"),
      });

      // Redirection vers la page de connexion après inscription réussie
      navigate("/login");
    } catch (error) {
      setIsLoading(false);
      toast({
        title: t("registration_failed"),
        description: error.message || t("registration_failed_desc"),
        variant: "destructive"
      });
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* Background avec pattern adapté au thème */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(var(--grid-color), 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--grid-color), 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Main card avec classes de thème */}
        <div className="bg-card rounded-2xl shadow-lg p-8 border">
          {/* Logo centré */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-card rounded-full shadow-lg border">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Title avec classes de thème */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
            <p className="text-sm text-muted-foreground">Register to start using EpilepticAI</p>
          </div>

          {/* Form section avec classes de thème */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                {t("full_name")} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder={t("enter_name")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition outline-none bg-background text-foreground"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                {t("email_address")} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder={t("enter_email_address")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition outline-none bg-background text-foreground"
                />
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label htmlFor="role" className="block text-sm font-medium text-foreground">
                Account Type *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                </div>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition outline-none bg-background text-foreground appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                {role === "doctor"
                  ? "Register as a medical doctor to manage patients"
                  : "Register as an administrator to manage the system"}
              </p>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                {t("password_label")} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="block w-full pl-10 pr-10 py-2.5 border border-input rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition outline-none bg-background text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t("password_min_length")}</p>
            </div>

            {/* Confirm Password field */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                {t("confirm_password")} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="************"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-10 py-2.5 border border-input rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition outline-none bg-background text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms agreement */}
            <div className="flex items-start space-x-2 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded cursor-pointer mt-0.5 bg-background"
                required
              />
              <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                {t("agree_terms")} *
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("creating_account")}
                </span>
              ) : (
                t("register_button")
              )}
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("already_have_account")} {" "}
              <button 
                type="button"
                onClick={handleLoginClick}
                className="text-primary hover:text-primary/80 font-medium underline"
              >
                {t("log_in")}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;