import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/I18nContext";
import logo from "../components/EpilepticAI.png"; 
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();   // <-- IMPORTANT
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  const success = await login(email, password);

  setIsLoading(false);

  if (success) {
    // Toast de succès
    toast({
      title: t("login success"),
      description: t("welcome back"),
    });

    // Get user from localStorage to check role
    const savedUser = localStorage.getItem("epilepticai_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Redirect based on user role
        if (user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } catch {
        navigate("/dashboard");
      }
    } else {
      navigate("/dashboard");
    }
  } else {
    toast({
      title: t("login_failed"),
      description: t("invalid_credentials"),
      variant: "destructive"
    });
  }
};

  const handleRegisterClick = () => {
    navigate("/register");
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
            <h1 className="text-2xl font-bold text-foreground mb-1">Sign In to EpilepticAI</h1>
            <p className="text-sm text-muted-foreground">Login with your data that you entered during registration</p>
          </div>

          {/* Form section avec classes de thème */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                {t("email_address")}
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

            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                {t("password_label")}
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
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded cursor-pointer bg-background"
                />
                <label htmlFor="remember" className="text-sm text-foreground cursor-pointer">
                  {t("remember_me")}
                </label>
              </div>
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
                  {t("logging_in")}
                </span>
              ) : (
                t("log_in")
              )}
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("already_have_account")}{" "}
              <button 
                type="button"
                onClick={handleRegisterClick}
                className="text-primary hover:text-primary/80 font-medium underline"
              >
                {t("create_account")}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
