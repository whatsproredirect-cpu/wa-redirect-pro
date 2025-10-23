import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface LinkPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkUrl: string;
  linkName: string;
}

const LinkPreviewModal = ({
  open,
  onOpenChange,
  linkUrl,
  linkName,
}: LinkPreviewModalProps) => {
  const copyLink = () => {
    navigator.clipboard.writeText(linkUrl);
    toast.success("Link copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview: {linkName}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(linkUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em Nova Aba
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 border rounded-lg overflow-hidden bg-muted">
          <iframe
            src={linkUrl}
            className="w-full h-full"
            title={`Preview de ${linkName}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkPreviewModal;
