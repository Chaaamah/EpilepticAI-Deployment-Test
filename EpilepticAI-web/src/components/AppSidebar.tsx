
import { Home, Users, User, Settings, Bell, LogOut, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import Logo from "./EpilepticAI.png";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/I18nContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState, useRef, useEffect } from "react";

const mainMenuItems = [
  { key: "menu_dashboard", url: "/dashboard", icon: Home },
  { key: "menu_patients", url: "/patients", icon: Users },
];

const accountMenuItems = [
  { key: "menu_alerts", url: "/alerts", icon: Bell },
  { key: "menu_settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Initiales utilisateur
  const getUserInitials = () => {
    if (!user?.name) return "D";
    return user.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // UN SEUL useEffect : Sauvegarder quand 'open' change
  useEffect(() => {
    localStorage.setItem('sidebar-state', JSON.stringify(open));
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsUserMenuOpen(false);
  };

  const handleGoToProfile = () => {
    navigate("/profile");
    setIsUserMenuOpen(false);
  };

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermer le menu quand la route change
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border min-h-[73px] flex items-center justify-center">
          <div className={`flex items-center ${open ? "gap-2 w-full" : "justify-center"}`}>
            <div className="flex-shrink-0">
              <img src={Logo} alt="EpilepticAI Logo" className="h-8 w-auto min-w-[32px]" />
            </div>
            <div className={`overflow-hidden ${open ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
              {open && <h2 className="text-lg font-bold text-sidebar-foreground whitespace-nowrap pl-2">EpilepticAI</h2>}
            </div>
          </div>
        </div>

        {/* Menu principal */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary rounded-md mx-2"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {open && <span className="whitespace-nowrap">{t(item.key)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pages du compte */}
        <SidebarGroup className="mt-8">
          {open && <SidebarGroupLabel className="sidebar-section-label px-6 mb-2 whitespace-nowrap">{t("Account pages")}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {accountMenuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary rounded-md mx-2"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {open && <span className="whitespace-nowrap">{t(item.key)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1" />

        {/* Section utilisateur - CORRIGÉ pour afficher le cercle */}
        <div className="mt-auto border-t border-sidebar-border" ref={userMenuRef}>
          <div className="p-4">
            {open ? (
              // Version sidebar OUVERTE
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-full flex items-center justify-between p-2 hover:bg-sidebar-accent/30 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Cercle avec initiales - SIDEBAR OUVERT */}
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-sm">
                      <span className="font-medium text-primary text-base">{getUserInitials()}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-sidebar-foreground">{user?.name || "Docteur"}</p>
                      <p className="text-xs text-muted-foreground">{user?.role || "Doctor"}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Menu déroulant - sidebar ouvert */}
                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={handleGoToProfile}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors text-left"
                      >
                        <User className="w-4 h-4" />
                        <span className="font-medium">Mon profil</span>
                      </button>
                      <div className="h-px bg-border mx-2 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-destructive/20 text-destructive transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Version sidebar FERMÉE - CORRIGÉ pour AFFICHER LE CERCLE
              <div className="relative flex justify-center">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center justify-center p-2 hover:bg-sidebar-accent/30 rounded-md transition-colors"
                  aria-label="Menu utilisateur"
                >
                  {/* Cercle avec initiales - SIDEBAR FERMÉ - BIEN VISIBLE */}
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 shadow-md">
                    <span className="font-semibold text-primary text-base">{getUserInitials()}</span>
                  </div>
                </button>

                {/* Menu déroulant - sidebar FERMÉ */}
                {isUserMenuOpen && (
                  <div className="fixed inset-0 z-40" style={{ pointerEvents: 'none' }}>
                    <div 
                      className="absolute left-16 top-auto bottom-4 bg-card border border-border rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden" 
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="py-2">
                        {/* En-tête */}
                        <div className="px-4 py-3 border-b border-border bg-accent/10">
                          <p className="text-sm font-semibold text-foreground">{user?.name || "Docteur"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{user?.role || "Doctor"}</p>
                        </div>
                        
                        {/* Options */}
                        <button
                          onClick={handleGoToProfile}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-colors text-left"
                        >
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">Mon profil</span>
                        </button>
                        
                        <div className="h-px bg-border mx-2 my-1" />
                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-destructive/20 text-destructive transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">Se déconnecter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}