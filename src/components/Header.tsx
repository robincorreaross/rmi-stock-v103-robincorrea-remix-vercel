import { Package, Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
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
  const currentPath = location.pathname;
  return <header className="bg-card border-b border-border shadow-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">RMI-Stock</h1>
                <p className="text-sm text-muted-foreground">Contagem e Auditoria
de Estoque</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link to="/">
                
              </Link>
              <Link to="/products">
                
              </Link>
            </nav>
          </div>
          
          {/* Stats and Export - Only show on stock counting page */}
          {currentPath === '/' && <>
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
            </>}

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            <Link to="/">
              
            </Link>
            <Link to="/products">
              
            </Link>
          </div>
        </div>
      </div>
    </header>;
}