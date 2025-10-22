import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Link2, Plus, LogOut, ExternalLink } from "lucide-react";
import CreateLinkDialog from "@/components/CreateLinkDialog";
import LinkCard from "@/components/LinkCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
        initializeWorkspace(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const initializeWorkspace = async (userId: string) => {
    try {
      // Check for existing workspace
      let { data: existingWorkspace } = await supabase
        .from("workspaces")
        .select("*")
        .eq("owner_id", userId)
        .single();

      if (!existingWorkspace) {
        // Create default workspace
        const { data: newWorkspace, error } = await supabase
          .from("workspaces")
          .insert([
            {
              name: "Meu Workspace",
              owner_id: userId,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        existingWorkspace = newWorkspace;
      }

      setWorkspace(existingWorkspace);
      loadLinks(existingWorkspace.id);
    } catch (error: any) {
      toast.error("Erro ao carregar workspace");
      console.error(error);
    }
  };

  const loadLinks = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from("redirect_links")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar links");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleLinkCreated = () => {
    if (workspace) {
      loadLinks(workspace.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Link2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LeadFlow
            </span>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="hover:bg-destructive hover:text-destructive-foreground transition-smooth"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Seus Links</h1>
            <p className="text-muted-foreground">
              Gerencie e acompanhe seus links de redirecionamento
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-primary hover:shadow-glow transition-smooth"
            disabled={!workspace}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Link
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : links.length === 0 ? (
          <Card className="p-12 text-center shadow-elegant">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Nenhum link criado</h3>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro link de redirecionamento para começar a capturar leads
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Link
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {links.map((link) => (
              <LinkCard key={link.id} link={link} onUpdate={handleLinkCreated} />
            ))}
          </div>
        )}
      </div>

      <CreateLinkDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceId={workspace?.id}
        onSuccess={handleLinkCreated}
      />
    </div>
  );
};

export default Dashboard;
