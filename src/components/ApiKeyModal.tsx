import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setPerplexityApiKey, getPerplexityApiKey } from "@/services/perplexity";

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ open, onClose, onSaved }) => {
  const [key, setKey] = useState<string>(getPerplexityApiKey() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      setPerplexityApiKey(key.trim());
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent aria-describedby="api-key-desc">
        <DialogHeader>
          <DialogTitle>Connect Perplexity API</DialogTitle>
          <DialogDescription id="api-key-desc">
            Enter your Perplexity API key. It is stored locally in your browser. For production, we recommend using Supabase Secrets + an Edge Function.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <label className="text-sm" htmlFor="pxKey">API Key</label>
          <Input
            id="pxKey"
            type="password"
            placeholder="px-************************"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!key.trim() || saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
