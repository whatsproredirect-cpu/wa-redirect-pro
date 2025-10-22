import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface EditLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: any;
  onSuccess: () => void;
}

const EditLinkDialog = ({
  open,
  onOpenChange,
  link,
  onSuccess,
}: EditLinkDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    mode: "form" as "form" | "direct",
    capture_name: true,
    capture_phone: true,
    pixel_id: "",
    pixel_event: "Contact",
    message_template: "Olá! Gostaria de mais informações.",
  });
  const [contacts, setContacts] = useState<string[]>([""]);

  // Load link data when dialog opens
  useEffect(() => {
    if (open && link) {
      setFormData({
        name: link.name || "",
        slug: link.slug || "",
        mode: link.mode || "form",
        capture_name: link.capture_name ?? true,
        capture_phone: link.capture_phone ?? true,
        pixel_id: link.pixel_id || "",
        pixel_event: link.pixel_event || "Contact",
        message_template: link.message_template || "Olá! Gostaria de mais informações.",
      });
      loadContacts();
    }
  }, [open, link]);

  const loadContacts = async () => {
    if (!link?.id) return;

    try {
      const { data, error } = await supabase
        .from("redirect_contacts")
        .select("phone")
        .eq("link_id", link.id)
        .order("order_index");

      if (error) throw error;
      setContacts(data.length > 0 ? data.map((c) => c.phone) : [""]);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setContacts([""]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update link
      const { error: linkError } = await supabase
        .from("redirect_links")
        .update({
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          mode: formData.mode,
          capture_name: formData.capture_name,
          capture_phone: formData.capture_phone,
          pixel_id: formData.pixel_id,
          pixel_event: formData.pixel_event,
          message_template: formData.message_template,
        })
        .eq("id", link.id);

      if (linkError) throw linkError;

      // Delete existing contacts
      await supabase
        .from("redirect_contacts")
        .delete()
        .eq("link_id", link.id);

      // Add new contacts
      const validContacts = contacts.filter((c) => c.trim());
      if (validContacts.length > 0) {
        const contactsData = validContacts.map((phone, index) => ({
          link_id: link.id,
          phone: phone.trim(),
          order_index: index,
        }));

        const { error: contactsError } = await supabase
          .from("redirect_contacts")
          .insert(contactsData);

        if (contactsError) throw contactsError;
      }

      toast.success("Link atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este slug já está em uso. Escolha outro.");
      } else {
        toast.error(error.message || "Erro ao atualizar link");
      }
    } finally {
      setLoading(false);
    }
  };

  const addContact = () => {
    setContacts([...contacts, ""]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = value;
    setContacts(newContacts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Link</DialogTitle>
          <DialogDescription>
            Modifique as configurações do seu link de redirecionamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Link</Label>
            <Input
              id="name"
              placeholder="Ex: Campanha Facebook - Black Friday"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/r/</span>
              <Input
                id="slug"
                placeholder="black-friday-2025"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Modo de Redirecionamento</Label>
            <Select
              value={formData.mode}
              onValueChange={(value: "form" | "direct") =>
                setFormData({ ...formData, mode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="form">Formulário (captura dados)</SelectItem>
                <SelectItem value="direct">Direto (redireciona imediatamente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.mode === "form" && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="capture_name">Capturar Nome</Label>
                <Switch
                  id="capture_name"
                  checked={formData.capture_name}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, capture_name: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="capture_phone">Capturar Telefone</Label>
                <Switch
                  id="capture_phone"
                  checked={formData.capture_phone}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, capture_phone: checked })
                  }
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message_template">Mensagem do WhatsApp</Label>
            <Textarea
              id="message_template"
              placeholder="Use {nome} para personalizar"
              value={formData.message_template}
              onChange={(e) =>
                setFormData({ ...formData, message_template: e.target.value })
              }
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Dica: Use {"{nome}"} para inserir o nome do lead
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Números dos Atendentes (WhatsApp)</Label>
              <Button type="button" size="sm" variant="outline" onClick={addContact}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            {contacts.map((contact, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="+5511999999999"
                  value={contact}
                  onChange={(e) => updateContact(index, e.target.value)}
                />
                {contacts.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeContact(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pixel_id">Facebook Pixel ID (opcional)</Label>
              <Input
                id="pixel_id"
                placeholder="123456789"
                value={formData.pixel_id}
                onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pixel_event">Evento do Pixel</Label>
              <Input
                id="pixel_event"
                placeholder="Contact"
                value={formData.pixel_event}
                onChange={(e) =>
                  setFormData({ ...formData, pixel_event: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLinkDialog;