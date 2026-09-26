import { useState } from "react";
import { motion } from "framer-motion";
import { api, LANGUAGES } from "@/lib/api";
import { useStudent } from "@/context/StudentContext";
import { useTheme } from "@/context/ThemeContext";
import { PageHeader, fade } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RotateCcw, Save, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

const STYLES = ["examples", "examples + visual", "step-by-step", "technical"];
const LEVELS = ["beginner", "intermediate", "advanced"];

export default function Settings() {
  const { profile, refresh } = useStudent();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState(profile?.preferences || {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updatePreferences(prefs);
      await refresh();
      toast.success("Preferences saved.");
    } catch {
      toast.error("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    try {
      await api.resetDemo();
      await refresh();
      toast.success("Demo reset to Sachin's initial state.");
    } catch {
      toast.error("Reset failed.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Settings" title="Preferences" subtitle="Tune how your AI tutor teaches you. These feed directly into recommendations." />

      <motion.div {...fade()} className="space-y-5 rounded-2xl border bg-card p-6">
        <div>
          <Label>Preferred language</Label>
          <Select value={prefs.language} onValueChange={(v) => setPrefs({ ...prefs, language: v })}>
            <SelectTrigger data-testid="settings-language"><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Explanation style</Label>
          <Select value={prefs.explanation_style} onValueChange={(v) => setPrefs({ ...prefs, explanation_style: v })}>
            <SelectTrigger data-testid="settings-style"><SelectValue placeholder="Style" /></SelectTrigger>
            <SelectContent>{STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Learning level</Label>
          <Select value={prefs.level} onValueChange={(v) => setPrefs({ ...prefs, level: v })}>
            <SelectTrigger data-testid="settings-level"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Theme</Label>
          <div className="flex gap-2">
            <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} data-testid="settings-theme-light">
              <Sun className="mr-1 h-4 w-4" /> Light
            </Button>
            <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} data-testid="settings-theme-dark">
              <Moon className="mr-1 h-4 w-4" /> Dark
            </Button>
          </div>
        </div>
        <Button onClick={save} disabled={saving} data-testid="settings-save-btn">
          <Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save Preferences"}
        </Button>
      </motion.div>

      <motion.div {...fade(0.1)} className="mt-5 rounded-2xl border border-dashed p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo Controls</p>
        <p className="mt-2 text-sm text-muted-foreground">Reset Sachin's learning data to the initial state — useful during hackathon judging.</p>
        <Button variant="outline" className="mt-3" onClick={reset} data-testid="settings-reset-demo-btn">
          <RotateCcw className="mr-1 h-4 w-4" /> Reset Demo
        </Button>
      </motion.div>
    </div>
  );
}
