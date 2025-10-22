import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Link2 } from "lucide-react";

declare global {
  interface Window {
    fbq?: (
      type: string,
      event: string,
      params?: Record<string, any>
    ) => void;
  }
}

const Redirect = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    loadLink();
  }, [slug]);

  const loadLink = async () => {
    try {
      const { data, error } = await supabase
        .from("redirect_links")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      setLink(data);

      // Initialize Facebook Pixel
      if (data.pixel_id) {
        initPixel(data.pixel_id);
        trackPageView();
      }

      // If direct mode, redirect immediately
      if (data.mode === "direct") {
        await handleDirectRedirect(data);
      }
    } catch (error) {
      toast.error("Link não encontrado");
    } finally {
      setLoading(false);
    }
  };

  const initPixel = (pixelId: string) => {
    // Initialize Facebook Pixel
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
    window.fbq?.("init", pixelId);
  };

  const trackPageView = () => {
    window.fbq?.("track", "PageView");
  };

  const trackContact = () => {
    if (link?.pixel_event) {
      window.fbq?.("track", link.pixel_event);
    }
  };

  const handleDirectRedirect = async (linkData: any) => {
    try {
      const { data: contact } = await supabase.rpc("get_next_contact", {
        p_link_id: linkData.id,
      });

      if (!contact || contact.length === 0) {
        toast.error("Nenhum atendente disponível");
        return;
      }

      const attendant = contact[0];
      await createLead(linkData.id, attendant.contact_id, attendant.phone);
      trackContact();

      const message = encodeURIComponent(linkData.message_template);
      const whatsappUrl = `https://wa.me/${attendant.phone}?text=${message}`;
      window.location.href = whatsappUrl;
    } catch (error) {
      toast.error("Erro ao redirecionar");
      console.error(error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: contact } = await supabase.rpc("get_next_contact", {
        p_link_id: link.id,
      });

      if (!contact || contact.length === 0) {
        toast.error("Nenhum atendente disponível");
        return;
      }

      const attendant = contact[0];
      
      // Create lead with form data
      await createLead(
        link.id,
        attendant.contact_id,
        attendant.phone,
        formData.name,
        formData.phone
      );

      trackContact();

      // Personalize message
      let message = link.message_template;
      if (formData.name) {
        message = message.replace(/{nome}/g, formData.name);
      }

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${attendant.phone}?text=${encodedMessage}`;
      window.location.href = whatsappUrl;
    } catch (error) {
      toast.error("Erro ao processar formulário");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const createLead = async (
    linkId: string,
    contactId: string,
    redirectedTo: string,
    name?: string,
    phone?: string
  ) => {
    try {
      const utmSource = searchParams.get("utm_source") || undefined;
      const utmCampaign = searchParams.get("utm_campaign") || undefined;

      await supabase.from("leads").insert([
        {
          link_id: linkId,
          contact_id: contactId,
          name,
          phone,
          redirected_to: redirectedTo,
          utm_source: utmSource,
          utm_campaign: utmCampaign,
          user_agent: navigator.userAgent,
        },
      ]);
    } catch (error) {
      console.error("Error creating lead:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Link não encontrado</h1>
          <p className="text-muted-foreground mb-4">Verifique o endereço ou contate o administrador.</p>
          <a href="/" className="text-primary hover:underline">Voltar</a>
        </div>
      </div>
    );
  }

  if (link.mode === "direct") {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Link2 className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">{link.name}</h1>
          <p className="text-muted-foreground">
            Preencha seus dados para continuar
          </p>
        </div>

        <Card className="p-8 shadow-elegant">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {link.capture_name && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {link.capture_phone && (
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:shadow-glow transition-smooth"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Continuar para WhatsApp"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Redirect;
