import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Package, BarChart3, Plus, Clock, Users } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  product_limit: number | null;
  stock_count_limit: number | null;
}

interface UserPlan {
  plan: Plan;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface StockCount {
  id: string;
  name: string;
  counter_name: string;
  created_at: string;
  updated_at: string;
}

export const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCountName, setNewCountName] = useState("");
  const [counterName, setCounterName] = useState("");
  const [showNewCountDialog, setShowNewCountDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user plan
      const { data: userPlanData, error: userPlanError } = await supabase
        .from('user_plans')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();

      if (userPlanError) throw userPlanError;
      setUserPlan(userPlanData);

      // Fetch stock counts
      const { data: stockCountsData, error: stockCountsError } = await supabase
        .from('stock_counts')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (stockCountsError) throw stockCountsError;
      setStockCounts(stockCountsData || []);

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountName.trim() || !counterName.trim()) return;

    try {
      const { error } = await supabase
        .from('stock_counts')
        .insert({
          user_id: user!.id,
          name: newCountName.trim(),
          counter_name: counterName.trim()
        });

      if (error) throw error;

      toast({
        title: "Nova contagem criada",
        description: `Contagem "${newCountName}" criada com sucesso.`,
      });

      setNewCountName("");
      setCounterName("");
      setShowNewCountDialog(false);
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar contagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {getGreeting()}, {profile?.full_name || 'Usuário'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Bem-vindo ao seu painel de controle do RMI-Stock
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Current Plan Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {userPlan?.plan.name}
              </Badge>
              {userPlan?.plan.name !== 'Free' && (
                <p className="text-sm text-muted-foreground">
                  {formatPrice(userPlan.plan.price)}/{userPlan.plan.period === 'monthly' ? 'mês' : 'ano'}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                Produtos: {userPlan?.plan.product_limit ? `${userPlan.plan.product_limit} restantes` : 'Ilimitado'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Counts Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contagens Ativas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockCounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {userPlan?.plan.stock_count_limit ? 
                `${userPlan.plan.stock_count_limit - stockCounts.length} restantes` : 
                'Ilimitado'
              }
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Dialog open={showNewCountDialog} onOpenChange={setShowNewCountDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Contagem
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Contagem</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar uma nova contagem de estoque
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateNewCount}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="countName">Nome da Contagem</Label>
                      <Input
                        id="countName"
                        placeholder="Ex: Estoque Janeiro 2024"
                        value={newCountName}
                        onChange={(e) => setNewCountName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="counterName">Nome do Contador</Label>
                      <Input
                        id="counterName"
                        placeholder="Nome da pessoa que irá contar"
                        value={counterName}
                        onChange={(e) => setCounterName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Data e hora:</strong> {new Date().toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setShowNewCountDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Criar Contagem
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Recent Counts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Contagens Recentes
          </CardTitle>
          <CardDescription>
            Suas contagens de estoque mais recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockCounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma contagem criada ainda</p>
              <p className="text-sm">Crie sua primeira contagem para começar a usar o sistema</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stockCounts.slice(0, 5).map((count) => (
                <div key={count.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-medium">{count.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {count.counter_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(count.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/count', { state: { stockCountId: count.id } })}
                  >
                    Continuar
                  </Button>
                </div>
              ))}
              {stockCounts.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="ghost" onClick={() => navigate('/counts')}>
                    Ver todas as contagens
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};