import { useState, useEffect } from "react";
import { Package, Download, BarChart3, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface HeaderProps {
  totalItems: number;
  totalQuantity: number;
  onExport: () => void;
  isExporting: boolean;
}

export function Header({
  totalItems,
  totalQuantity,
  onExport,
  isExporting
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="bg-card border-b border-border shadow-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">RMI-Stock</h1>
                <p className="text-sm text-muted-foreground">Contagem de Estoque</p>
              </div>
            </div>
            
            {/* Navigation - Only show if user is authenticated */}
            {user && (
              <nav className="hidden md:flex items-center space-x-4">
                <Link to="/">
                  <Button
                    variant={currentPath === "/" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Contagem
                  </Button>
                </Link>
                <Link to="/products">
                  <Button
                    variant={currentPath === "/products" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Produtos
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button
                    variant={currentPath === "/profile" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </Button>
                </Link>
              </nav>
            )}
          </div>
          
          {/* Stats and Export - Only show on stock counting page */}
          {currentPath === '/' && user && (
            <>
              {/* Layout Desktop */}
              <div className="hidden sm:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total de itens</div>
                  <div className="text-lg font-bold text-primary">{totalItems}</div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Quantidade total</div>
                  <div className="text-lg font-bold text-accent">{totalQuantity}</div>
                </div>
                
                <Button variant="export" size="sm" onClick={onExport} disabled={isExporting || totalItems === 0}>
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exportando...' : 'Exportar'}
                </Button>
              </div>

              {/* Layout Mobile */}
              <div className="flex sm:hidden flex-col ml-auto space-y-2">
                <div className="flex flex-col items-end space-y-1">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Total de itens</div>
                    <div className="text-sm font-bold text-primary">{totalItems}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Quantidade total</div>
                    <div className="text-sm font-bold text-accent">{totalQuantity}</div>
                  </div>
                </div>
                
                <Button variant="export" size="sm" onClick={onExport} disabled={isExporting || totalItems === 0}>
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exportando...' : 'Exportar'}
                </Button>
              </div>
            </>
          )}

          {/* Auth Section */}
          {!user && (
            <Link to="/auth">
              <Button size="sm">
                Entrar / Cadastrar
              </Button>
            </Link>
          )}

          {/* Mobile Navigation - Only show if user is authenticated */}
          {user && (
            <div className="flex md:hidden items-center space-x-2">
              <Link to="/">
                <Button
                  variant={currentPath === "/" ? "default" : "outline"}
                  size="sm"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products">
                <Button
                  variant={currentPath === "/products" ? "default" : "outline"}
                  size="sm"
                >
                  <Package className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/profile">
                <Button
                  variant={currentPath === "/profile" ? "default" : "outline"}
                  size="sm"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}