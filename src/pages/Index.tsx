import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link2, Users, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        
        <nav className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Link2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LeadFlow
            </span>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="hover:bg-primary hover:text-primary-foreground transition-smooth"
          >
            Entrar
          </Button>
        </nav>

        <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Distribua Leads no{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                WhatsApp
              </span>
              {" "}Automaticamente
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Crie links inteligentes que redirecionam seus leads para sua equipe de vendas em fila sequencial. Capture dados, rastreie conversões e integre com Facebook Pixel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary hover:shadow-glow transition-smooth text-lg px-8 py-6"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 hover:bg-muted transition-smooth"
              >
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-elegant transition-smooth">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
              <Link2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Links Inteligentes</h3>
            <p className="text-muted-foreground">
              Crie links personalizados com formulários ou redirecionamento direto para WhatsApp.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-elegant transition-smooth">
            <div className="w-12 h-12 rounded-xl bg-gradient-secondary flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fila de Atendentes</h3>
            <p className="text-muted-foreground">
              Distribua leads automaticamente entre sua equipe em ordem sequencial.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-elegant transition-smooth">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Rastreamento Completo</h3>
            <p className="text-muted-foreground">
              Integração com Facebook Pixel, UTM tracking e relatórios detalhados.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-primary rounded-3xl p-12 text-center shadow-glow">
          <Zap className="w-16 h-16 text-primary-foreground mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Pronto para Automatizar Seus Leads?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
            Comece agora e transforme a forma como você distribui leads para sua equipe de vendas.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 hover:scale-105 transition-smooth"
          >
            Criar Conta Gratuita
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 LeadFlow. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
