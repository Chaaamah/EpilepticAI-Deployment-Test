
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'doctor')[];
}

const ProtectedRoute = ({ children, allowedRoles = ['admin', 'doctor'] }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log("ProtectedRoute check:", { isAuthenticated, user, allowedRoles, isLoading });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Vérifier les rôles si spécifiés
  if (user && !allowedRoles.includes(user.role)) {
    console.log("Role not allowed:", user.role, "allowed:", allowedRoles);
    
    // Rediriger vers le tableau de bord approprié selon le rôle
    if (user.role === 'admin') {
      console.log("Redirecting admin to /admin");
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'doctor') {
      console.log("Redirecting doctor to /dashboard");
      return <Navigate to="/dashboard" replace />;
    } else {
      // Rôle inconnu, rediriger vers le login
      console.log("Unknown role, redirecting to login");
      return <Navigate to="/login" replace />;
    }
  }

  console.log("Access granted for role:", user?.role);
  return <>{children}</>;
};

export default ProtectedRoute;
