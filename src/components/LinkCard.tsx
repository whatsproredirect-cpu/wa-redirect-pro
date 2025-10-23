import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EditLinkDialog from "./EditLinkDialog";
import LinkCardMenu from "./LinkCardMenu";
import LinkStats from "./LinkStats";
import ContactsModal from "./ContactsModal";
import LinkPreviewModal from "./LinkPreviewModal";

interface LinkCardProps {
  link: any;
  onUpdate: () => void;
}

const LinkCard = ({ link, onUpdate }: LinkCardProps) => {
  const [deleting, setDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const linkUrl = `${window.location.origin}/r/${link.slug}`;

  const getStatusBadge = () => {
    if (link.status === "inactive") {
      return <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>;
    }
    if (link.status === "no_contacts") {
      return <Badge variant="outline" className="text-destructive">Sem Atendentes</Badge>;
    }
    return <Badge className="bg-secondary">Ativo</Badge>;
  };

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
    <>
      <Card className="p-5 hover:shadow-elegant transition-smooth">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg truncate">{link.name}</h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded inline-block mb-2">
                /r/{link.slug}
              </p>
              {link.campaign && (
                <Badge variant="outline" className="text-xs mt-1">
                  {link.campaign}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={link.mode === "form" ? "default" : "secondary"} className="text-xs">
                {link.mode === "form" ? "Formulário" : "Direto"}
              </Badge>
              <LinkCardMenu
                linkUrl={linkUrl}
                onCopy={copyLink}
                onEdit={() => setEditDialogOpen(true)}
                onOpen={() => setPreviewModalOpen(true)}
                onDelete={handleDelete}
                deleting={deleting}
              />
            </div>
          </div>

          <LinkStats
            totalClicks={link.total_clicks || 0}
            totalLeads={link.total_leads || 0}
            lastLeadAt={link.last_lead_at}
          />

          <Button
            size="sm"
            variant="outline"
            onClick={() => setContactsModalOpen(true)}
            className="w-full hover:bg-muted transition-smooth"
          >
            <Users className="w-4 h-4 mr-2" />
            Gerenciar Atendentes
          </Button>
        </div>
      </Card>

      <EditLinkDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        link={link}
        onSuccess={onUpdate}
      />

      <ContactsModal
        open={contactsModalOpen}
        onOpenChange={setContactsModalOpen}
        linkId={link.id}
        linkName={link.name}
        onUpdate={onUpdate}
      />

      <LinkPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        linkUrl={linkUrl}
        linkName={link.name}
      />
    </>
  );
};

export default LinkCard;
