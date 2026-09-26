import axios from "axios";

const BACKEND_BASE = (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) || (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) || "";
const API = `${BACKEND_BASE}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("lt_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export function apiErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e?.msg ? e.msg : JSON.stringify(e))).join(" ");
  return String(detail);
}

export const api = {
  // auth
  register: (body) => client.post("/auth/register", body).then((r) => r.data),
  login: (body) => client.post("/auth/login", body).then((r) => r.data),
  demoLogin: () => client.post("/auth/demo-login").then((r) => r.data),
  me: () => client.get("/auth/me").then((r) => r.data),
  // data
  getProfile: () => client.get("/profile").then((r) => r.data),
  getRecommendation: () => client.get("/recommendation").then((r) => r.data),
  getInsight: () => client.get("/insight").then((r) => r.data),
  getLearningPath: () => client.get("/learning-path").then((r) => r.data),
  getKnowledgeGraph: () => client.get("/knowledge-graph").then((r) => r.data),
  getConcepts: () => client.get("/concepts").then((r) => r.data),
  getGaps: () => client.get("/gaps").then((r) => r.data),
  getAnalytics: () => client.get("/analytics").then((r) => r.data),
  // diagnostic
  getDiagnostic: () => client.get("/diagnostic/questions").then((r) => r.data),
  submitDiagnostic: (answers) =>
    client.post("/diagnostic/submit", { answers }).then((r) => r.data),
  // quiz
  getQuizQuestion: (params) =>
    client.get("/quiz/question", { params }).then((r) => r.data),
  submitQuiz: (body) => client.post("/quiz/submit", body).then((r) => r.data),
  // tutor / ai
  tutorChat: (body) => client.post("/tutor/chat", body).then((r) => r.data),
  explain: (body) => client.post("/explain", body).then((r) => r.data),
  teachBack: (body) => client.post("/teach-back", body).then((r) => r.data),
  // misc
  updatePreferences: (body) =>
    client.put("/preferences", body).then((r) => r.data),
  resetDemo: () => client.post("/demo/reset").then((r) => r.data),
  // subjects & courses
  getSubjects: () => client.get("/subjects").then((r) => r.data),
  selectCourse: (course_id) =>
    client.post("/course/select", { course_id }).then((r) => r.data),
  // notes -> path
  notesAnalyze: (formData) =>
    client.post("/notes/analyze", formData).then((r) => r.data),
  notesSubmit: (answers) =>
    client.post("/notes/submit", { answers }).then((r) => r.data),
  getNotesPlan: () => client.get("/notes/plan").then((r) => r.data),
  // teacher
  demoTeacherLogin: () => client.post("/auth/demo-teacher-login").then((r) => r.data),
  teacherOverview: (subject) =>
    client.get("/teacher/overview", { params: { subject } }).then((r) => r.data),
};

export const STATUS_COLORS = {
  mastered: "#10B981",
  developing: "#F59E0B",
  weak: "#EF4444",
  not_started: "#94A3B8",
  recommended: "#6366F1",
};

export const STATUS_LABELS = {
  mastered: "Mastered",
  developing: "Developing",
  weak: "Needs Attention",
  not_started: "Not Started",
  recommended: "Recommended",
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "hinglish", label: "Hinglish" },
];
