import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StudentProvider } from "@/context/StudentContext";
import AppLayout from "@/components/AppLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Diagnostic from "@/pages/Diagnostic";
import KnowledgeGraph from "@/pages/KnowledgeGraph";
import LearningPath from "@/pages/LearningPath";
import TutorChat from "@/pages/TutorChat";
import VoiceTutor from "@/pages/VoiceTutor";
import Quiz from "@/pages/Quiz";
import TeachBack from "@/pages/TeachBack";
import Analytics from "@/pages/Analytics";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Subjects from "@/pages/Subjects";
import Notes from "@/pages/Notes";
import TeacherDashboard from "@/pages/TeacherDashboard";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppShell() {
  const { user } = useAuth();
  if (user && user.role === "teacher") return <Navigate to="/teacher" replace />;
  return (
    <Protected>
      <StudentProvider>
        <AppLayout />
      </StudentProvider>
    </Protected>
  );
}

function TeacherShell() {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "teacher") return <Navigate to="/app/dashboard" replace />;
  return <TeacherDashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />              <Route path="dashboard" element={<Dashboard />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="notes" element={<Notes />} />
              <Route path="diagnostic" element={<Diagnostic />} />
              <Route path="knowledge-graph" element={<KnowledgeGraph />} />
              <Route path="path" element={<LearningPath />} />
              <Route path="tutor-chat" element={<TutorChat />} />
              <Route path="voice-tutor" element={<VoiceTutor />} />
              <Route path="quiz" element={<Quiz />} />
              <Route path="teach-back" element={<TeachBack />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/teacher" element={<TeacherShell />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}
