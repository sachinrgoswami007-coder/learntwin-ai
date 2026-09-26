import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register, demoLogin, demoTeacherLogin } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const runDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate("/app/dashboard");
    } catch (e) {
      toast.error(apiErrorMessage(e));
      setDemoLoading(false);
    }
  };

  const runTeacherDemo = async () => {
    setDemoLoading(true);
    try {
      await demoTeacherLogin();
      navigate("/teacher");
    } catch (e) {
      toast.error(apiErrorMessage(e));
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    if (params.get("demo") === "1") runDemo();
    // eslint-disable-next-line
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let u;
      if (tab === "login") u = await login({ email: form.email, password: form.password });
      else u = await register(form);
      navigate(u?.role === "teacher" ? "/teacher" : "/app/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* left brand panel */}
      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">LearnTwin AI</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Your learning path.<br />Your pace.<br />Your AI tutor.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            We first understand the learner — mapping what you know, your gaps, and exactly what to learn next.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">Assess → Understand → Personalize → Adapt</p>
      </div>

      {/* right auth panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold">LearnTwin AI</span>
            </Link>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log in or create an account to meet your twin.</p>

          <Button variant="outline" className="mt-6 w-full" onClick={runDemo} disabled={demoLoading} data-testid="demo-login-btn">
            <PlayCircle className="mr-2 h-4 w-4" />
            {demoLoading ? "Entering demo…" : "Explore Demo (Enter as Sachin)"}
          </Button>
          <Button variant="ghost" className="mt-2 w-full" onClick={runTeacherDemo} disabled={demoLoading} data-testid="demo-teacher-btn">
            View Teacher Dashboard →
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="login-tab">Log In</TabsTrigger>
              <TabsTrigger value="signup" data-testid="signup-tab">Sign Up</TabsTrigger>
            </TabsList>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <TabsContent value="signup" className="m-0 space-y-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" data-testid="signup-name-input" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name" required={tab === "signup"} />
                </div>
              </TabsContent>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" data-testid="auth-email-input" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" data-testid="auth-password-input" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" required minLength={6} />
              </div>
              {error && <p className="text-sm text-destructive" data-testid="auth-error">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading} data-testid="auth-submit-btn">
                {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
