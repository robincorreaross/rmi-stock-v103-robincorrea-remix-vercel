import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
}

export const DashboardLayout = ({ 
  children, 
  title = "RMI-Stock", 
  showBackButton = false,
  backTo = "/"
}: DashboardLayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate('/auth');
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider collapsedWidth={56}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-12 flex items-center justify-between border-b px-4 bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="lg:hidden" />
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(backTo)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              )}
              <h1 className="font-semibold">{title}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hidden lg:flex" />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};