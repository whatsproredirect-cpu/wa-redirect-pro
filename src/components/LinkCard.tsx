import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LinkCardProps {
  link: any;
  onUpdate: () => void;
}

const LinkCard = ({ link, onUpdate }: LinkCardProps) => {
  const [deleting, setDeleting] = useState(false);
  const linkUrl = `${window.location.origin}/r/${link.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(linkUrl);
    toast.success("Link copiado!");
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja deletar este link?")) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("redirect_links")
        .delete()
        .eq("id", link.id);

      if (error) throw error;
      toast.success("Link deletado com sucesso!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao deletar link");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-6 hover:shadow-elegant transition-smooth">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{link.name}</h3>
            <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              /r/{link.slug}
            </p>
          </div>
          <Badge variant={link.mode === "form" ? "default" : "secondary"}>
            {link.mode === "form" ? "Formulário" : "Direto"}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyLink}
            className="flex-1 hover:bg-muted transition-smooth"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(linkUrl, "_blank")}
            className="flex-1 hover:bg-muted transition-smooth"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir
          </Button>
        </div>

        <div className="pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Atendentes configurados</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LinkCard;
