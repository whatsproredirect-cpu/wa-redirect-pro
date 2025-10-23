import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, X, GripVertical, Loader2 } from "lucide-react";

interface ContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkId: string;
  linkName: string;
  onUpdate: () => void;
}

interface Contact {
  id: string;
  phone: string;
  order_index: number;
}

const ContactsModal = ({
  open,
  onOpenChange,
  linkId,
  linkName,
  onUpdate,
}: ContactsModalProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadContacts();
    }
  }, [open, linkId]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("redirect_contacts")
        .select("*")
        .eq("link_id", linkId)
        .order("order_index");

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar atendentes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = () => {
    const newContact: Contact = {
      id: `temp-${Date.now()}`,
      phone: "",
      order_index: contacts.length,
    };
    setContacts([...contacts, newContact]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, phone: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], phone };
    setContacts(updated);
  };

  const moveContact = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= contacts.length) return;
    const updated = [...contacts];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setContacts(updated.map((c, i) => ({ ...c, order_index: i })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing contacts
      await supabase.from("redirect_contacts").delete().eq("link_id", linkId);

      // Insert new contacts
      const validContacts = contacts.filter((c) => c.phone.trim());
      if (validContacts.length > 0) {
        const contactsData = validContacts.map((c, index) => ({
          link_id: linkId,
          phone: c.phone.trim(),
          order_index: index,
        }));

        const { error } = await supabase
          .from("redirect_contacts")
          .insert(contactsData);

        if (error) throw error;
      }

      toast.success("Atendentes atualizados!");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar atendentes");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Atendentes</DialogTitle>
          <DialogDescription>
            Link: <span className="font-medium">{linkName}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Os leads serão distribuídos em ordem entre os atendentes
              </p>
              <Button type="button" size="sm" variant="outline" onClick={addContact}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {contacts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum atendente configurado
                </p>
              ) : (
                contacts.map((contact, index) => (
                  <div key={contact.id} className="flex gap-2 items-center">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-4 w-6 cursor-move"
                        onClick={() => moveContact(index, index - 1)}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-4 w-6 cursor-move"
                        onClick={() => moveContact(index, index + 1)}
                        disabled={index === contacts.length - 1}
                      >
                        <GripVertical className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-medium w-6">{index + 1}.</span>
                    <Input
                      placeholder="+5511999999999"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeContact(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-primary"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactsModal;
