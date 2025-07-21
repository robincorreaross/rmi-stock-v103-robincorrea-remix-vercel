import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Session } from "@supabase/supabase-js";

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

export const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
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
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setFullName(profileData.full_name || "");

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

      // Fetch all plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .order('price');

      if (plansError) throw plansError;
      setPlans(plansData);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });

      fetchUserData();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
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
    } catch (error: any) {
      toast({
        title: "Erro ao criar contagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        totalItems={0}
        totalQuantity={0}
        onExport={() => {}}
        isExporting={false}
      />
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e plano
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
            <TabsTrigger value="plan">Meu Plano</TabsTrigger>
            <TabsTrigger value="counts">Contagens</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações básicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button type="submit" disabled={updating}>
                      {updating ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleSignOut}>
                      Sair
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plano Atual</CardTitle>
                  <CardDescription>
                    Informações sobre seu plano atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userPlan && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {userPlan.plan.name}
                        </Badge>
                        {userPlan.plan.name !== 'Free' && (
                          <span className="text-lg font-semibold">
                            {formatPrice(userPlan.plan.price)}/{userPlan.plan.period === 'monthly' ? 'mês' : 'ano'}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Produtos:</span>
                          <span className="ml-2">
                            {userPlan.plan.product_limit ? `Até ${userPlan.plan.product_limit}` : 'Ilimitado'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Contagens:</span>
                          <span className="ml-2">
                            {userPlan.plan.stock_count_limit ? `Até ${userPlan.plan.stock_count_limit}` : 'Ilimitado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Planos Disponíveis</CardTitle>
                  <CardDescription>
                    Escolha o plano que melhor atende suas necessidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => (
                      <Card key={plan.id} className={`relative ${userPlan?.plan.id === plan.id ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="text-2xl font-bold">
                            {plan.price === 0 ? 'Grátis' : formatPrice(plan.price)}
                          </div>
                          {plan.period !== 'free' && (
                            <p className="text-sm text-muted-foreground">
                              por {plan.period === 'monthly' ? 'mês' : 'ano'}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Produtos:</strong> {plan.product_limit || 'Ilimitado'}
                            </div>
                            <div>
                              <strong>Contagens:</strong> {plan.stock_count_limit || 'Ilimitado'}
                            </div>
                          </div>
                          {userPlan?.plan.id === plan.id ? (
                            <Badge className="w-full justify-center mt-4">
                              Plano Atual
                            </Badge>
                          ) : (
                            <Button className="w-full mt-4" variant="outline">
                              {plan.name === 'Free' ? 'Voltar ao Free' : 'Fazer Upgrade'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="counts">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Contagens</CardTitle>
                <CardDescription>
                  Crie e gerencie suas contagens de estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showNewCountDialog} onOpenChange={setShowNewCountDialog}>
                  <DialogTrigger asChild>
                    <Button>Nova Contagem</Button>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};