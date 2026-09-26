import os
import json
import base64
import hmac
import hashlib
import time
import random
import secrets
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Header, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SECRET_KEY = os.environ.get("LEARNTWIN_SECRET_KEY") or secrets.token_urlsafe(32)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SEED_PATH = os.path.join(BASE_DIR, "seed_data.json")
DB_PATH = os.path.join(BASE_DIR, "db.json")

# ----------------- JWT Helpers (Pure Python) -----------------
def b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

def b64_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding and padding < 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode())

def create_token(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    h_bytes = b64_encode(json.dumps(header).encode())
    p_bytes = b64_encode(json.dumps(payload).encode())
    msg = f"{h_bytes}.{p_bytes}".encode()
    sig = b64_encode(hmac.new(SECRET_KEY.encode(), msg, hashlib.sha256).digest())
    return f"{h_bytes}.{p_bytes}.{sig}"

def decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token")
        h_bytes, p_bytes, sig = parts
        msg = f"{h_bytes}.{p_bytes}".encode()
        expected = b64_encode(hmac.new(SECRET_KEY.encode(), msg, hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            raise ValueError("Signature mismatch")
        payload = json.loads(b64_decode(p_bytes).decode())
        if "exp" in payload and payload["exp"] < time.time():
            raise ValueError("Token expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ----------------- Database State -----------------
with open(SEED_PATH, "r", encoding="utf-8") as f:
    INITIAL_SEED = json.load(f)

def load_db() -> dict:
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    db = json.loads(json.dumps(INITIAL_SEED))
    save_db(db)
    return db

def save_db(data: dict):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

db = load_db()

# ----------------- FastAPI App -----------------
app = FastAPI(title="LearnTwin AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Auth Dependency -----------------
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    role = payload.get("role", "student")
    name = payload.get("name", "Sachin")
    email = payload.get("email", "sachin@learntwin.ai")
    return {"id": user_id, "name": name, "email": email, "role": role}

# ----------------- Models -----------------
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "student"

class LoginRequest(BaseModel):
    email: str
    password: str

class PreferencesRequest(BaseModel):
    language: Optional[str] = None
    explanation_style: Optional[str] = None
    level: Optional[str] = None
    theme: Optional[str] = None

class CourseSelectRequest(BaseModel):
    course_id: str

class DiagnosticSubmitRequest(BaseModel):
    answers: Dict[str, str]

class QuizSubmitRequest(BaseModel):
    question_id: str
    selected: str
    difficulty: Optional[str] = "medium"

class TutorChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    mode: Optional[str] = "socratic"
    language: Optional[str] = "en"
    concept: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None

class ExplainRequest(BaseModel):
    concept: str
    mode: Optional[str] = "simple"
    language: Optional[str] = "en"

class TeachBackRequest(BaseModel):
    concept: str
    explanation: str

class NotesSubmitRequest(BaseModel):
    answers: List[Dict[str, Any]]

# ----------------- Auth Endpoints -----------------
@app.post("/api/auth/demo-login")
def demo_login():
    user = {
        "id": "student_sachin",
        "name": "Sachin",
        "email": "sachin@learntwin.ai",
        "role": "student"
    }
    token = create_token({
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "exp": int(time.time()) + 86400 * 30
    })
    return {"token": token, "user": user, "demo": True}

@app.post("/api/auth/demo-teacher-login")
def demo_teacher_login():
    user = {
        "id": "teacher_kulkarni",
        "name": "Ms. Kulkarni",
        "email": "teacher@learntwin.ai",
        "role": "teacher"
    }
    token = create_token({
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "exp": int(time.time()) + 86400 * 30
    })
    return {"token": token, "user": user, "demo": True}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    name = "Sachin" if "sachin" in req.email.lower() else req.email.split("@")[0].capitalize()
    role = "teacher" if "teacher" in req.email.lower() else "student"
    user = {
        "id": f"user_{abs(hash(req.email)) % 1000000}",
        "name": name,
        "email": req.email,
        "role": role
    }
    token = create_token({
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "exp": int(time.time()) + 86400 * 30
    })
    return {"token": token, "user": user}

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    user = {
        "id": f"user_{abs(hash(req.email)) % 1000000}",
        "name": req.name,
        "email": req.email,
        "role": req.role
    }
    token = create_token({
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "exp": int(time.time()) + 86400 * 30
    })
    return {"token": token, "user": user}

@app.get("/api/auth/me")
def me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "created_at": "2026-09-26T04:53:46.237087+00:00"
    }

# ----------------- Student Profile & State Endpoints -----------------
@app.get("/api/profile")
def get_profile(user: dict = Depends(get_current_user)):
    prof = db["profile"]
    prof["name"] = user["name"]
    prof["email"] = user["email"]
    prof["user_id"] = user["id"]
    return prof

@app.put("/api/preferences")
def update_preferences(req: PreferencesRequest, user: dict = Depends(get_current_user)):
    prof = db["profile"]
    pref = prof.setdefault("preferences", {})
    if req.language is not None:
        pref["language"] = req.language
    if req.explanation_style is not None:
        pref["explanation_style"] = req.explanation_style
    if req.level is not None:
        pref["level"] = req.level
    if req.theme is not None:
        pref["theme"] = req.theme
    save_db(db)
    return {"preferences": pref}

@app.post("/api/demo/reset")
def reset_demo(user: dict = Depends(get_current_user)):
    global db
    db = json.loads(json.dumps(INITIAL_SEED))
    save_db(db)
    return {"ok": True, "message": "Demo reset to Sachin's initial state."}

# ----------------- Subjects & Courses -----------------
@app.get("/api/subjects")
def get_subjects(user: dict = Depends(get_current_user)):
    return db["subjects"]

@app.post("/api/course/select")
def select_course(req: CourseSelectRequest, user: dict = Depends(get_current_user)):
    db["subjects"]["current"] = req.course_id
    db["profile"]["course"] = req.course_id
    # update course name
    course_list = db["subjects"].get("courses", [])
    for c in course_list:
        if c["id"] == req.course_id:
            db["profile"]["course_name"] = c["name"]
            db["profile"]["course_info"] = c
            break
    save_db(db)
    return {"ok": True, "current": req.course_id}

# ----------------- Learning Path & Knowledge Graph -----------------
@app.get("/api/learning-path")
def get_learning_path(user: dict = Depends(get_current_user)):
    return db["learning_path"]

@app.get("/api/knowledge-graph")
def get_knowledge_graph(user: dict = Depends(get_current_user)):
    return db["knowledge_graph"]

@app.get("/api/concepts")
def get_concepts(user: dict = Depends(get_current_user)):
    return {"concepts": db["concepts"]}

@app.get("/api/gaps")
def get_gaps(user: dict = Depends(get_current_user)):
    return {"gaps": db["gaps"]}

@app.get("/api/recommendation")
def get_recommendation(user: dict = Depends(get_current_user)):
    return db["recommendation"]

@app.get("/api/insight")
def get_insight(user: dict = Depends(get_current_user)):
    return db["insight"]

@app.get("/api/analytics")
def get_analytics(user: dict = Depends(get_current_user)):
    return db["analytics"]

# ----------------- Diagnostic Endpoints -----------------
@app.get("/api/diagnostic/questions")
def get_diagnostic_questions(user: dict = Depends(get_current_user)):
    return {"questions": db["diagnostic_questions"]}

@app.post("/api/diagnostic/submit")
def submit_diagnostic(req: DiagnosticSubmitRequest, user: dict = Depends(get_current_user)):
    score = 0
    total = len(req.answers)
    for qid, ans in req.answers.items():
        # simple score calculation
        if ans in ["a", "b", "c"]:
            score += 1
    pct = int((score / total) * 100) if total > 0 else 75
    db["profile"]["overall_mastery"] = max(db["profile"].get("overall_mastery", 64), pct)
    db["profile"]["activities"].insert(0, {
        "type": "diagnostic",
        "detail": f"Completed diagnostic test: {pct}% accuracy",
        "date": "Just now"
    })
    save_db(db)
    return {"ok": True, "score": score, "total": total, "percentage": pct}

# ----------------- Adaptive Quiz Endpoints -----------------
DEFAULT_QUESTIONS = [
    {
        "id": "q_ret_3",
        "concept": "return_values",
        "difficulty": "medium",
        "text": "Which function correctly gives back a value you can store in a variable?",
        "options": [
            {"id": "a", "text": "def f(): print(10)"},
            {"id": "b", "text": "def f(): return 10"},
            {"id": "c", "text": "def f(): yield return 10"},
            {"id": "d", "text": "def f(): echo 10"}
        ],
        "correct": "b",
        "explanation": "'return' sends the value back to the caller, while 'print' merely writes to standard output."
    },
    {
        "id": "q_var_1",
        "concept": "variables",
        "difficulty": "easy",
        "text": "What will print(type(x)) output if x = 42.0?",
        "options": [
            {"id": "a", "text": "<class 'int'>"},
            {"id": "b", "text": "<class 'float'>"},
            {"id": "c", "text": "<class 'double'>"},
            {"id": "d", "text": "<class 'number'>"}
        ],
        "correct": "b",
        "explanation": "In Python, decimal numbers are represented by the float type."
    },
    {
        "id": "q_rec_1",
        "concept": "recursion",
        "difficulty": "hard",
        "text": "What must every recursive function have to prevent infinite recursion?",
        "options": [
            {"id": "a", "text": "A while loop"},
            {"id": "b", "text": "A base case"},
            {"id": "c", "text": "A return 0 statement"},
            {"id": "d", "text": "Global variables"}
        ],
        "correct": "b",
        "explanation": "A base case is the terminating condition that stops further recursive calls."
    },
    {
        "id": "q_func_1",
        "concept": "functions",
        "difficulty": "medium",
        "text": "How do you define a function in Python?",
        "options": [
            {"id": "a", "text": "function myFunc():"},
            {"id": "b", "text": "def myFunc():"},
            {"id": "c", "text": "func myFunc():"},
            {"id": "d", "text": "void myFunc():"}
        ],
        "correct": "b",
        "explanation": "The 'def' keyword is used to declare a function in Python."
    }
]

@app.get("/api/quiz/question")
def get_quiz_question(concept_id: Optional[str] = None, difficulty: Optional[str] = "medium", exclude: Optional[str] = None, user: dict = Depends(get_current_user)):
    questions = list(db.get("quiz_questions", {}).values())
    if not questions:
        questions = DEFAULT_QUESTIONS
    
    excluded_ids = set(exclude.split(",")) if exclude else set()
    filtered = [q for q in questions if q.get("id") not in excluded_ids]
    if concept_id:
        c_filtered = [q for q in filtered if q.get("concept") == concept_id]
        if c_filtered:
            filtered = c_filtered
    
    if difficulty:
        d_filtered = [q for q in filtered if q.get("difficulty") == difficulty]
        if d_filtered:
            filtered = d_filtered

    selected_q = random.choice(filtered) if filtered else random.choice(DEFAULT_QUESTIONS)
    concept_name = selected_q.get("concept", "Python").replace("_", " ").title()
    return {
        "question": selected_q,
        "concept_name": concept_name
    }

@app.post("/api/quiz/submit")
def submit_quiz(req: QuizSubmitRequest, user: dict = Depends(get_current_user)):
    questions = db.get("quiz_questions", {})
    q = questions.get(req.question_id)
    if not q:
        for dq in DEFAULT_QUESTIONS:
            if dq["id"] == req.question_id:
                q = dq
                break
    correct = (req.selected == q.get("correct")) if q else (req.selected == "b")
    
    # Adaptive difficulty step
    diff_order = ["easy", "medium", "hard"]
    cur_diff = req.difficulty or "medium"
    idx = diff_order.index(cur_diff) if cur_diff in diff_order else 1
    if correct:
        next_idx = min(len(diff_order) - 1, idx + 1)
        xp_gain = 50
    else:
        next_idx = max(0, idx - 1)
        xp_gain = 10
    
    next_diff = diff_order[next_idx]
    diff_percent = int(((next_idx + 1) / len(diff_order)) * 100)
    
    # update profile analytics
    db["profile"]["xp"] = db["profile"].get("xp", 2450) + xp_gain
    analytics = db.setdefault("analytics", {})
    analytics["attempts"] = analytics.get("attempts", 42) + 1
    if correct:
        analytics["correct"] = analytics.get("correct", 29) + 1
    analytics["accuracy"] = int((analytics["correct"] / analytics["attempts"]) * 100)
    save_db(db)
    
    explanation = q.get("explanation", "Correct! Return values pass state back to the caller.") if q else "Great attempt!"
    
    return {
        "correct": correct,
        "selected": req.selected,
        "correct_answer": q.get("correct", "b") if q else "b",
        "explanation": explanation,
        "next_difficulty": next_diff,
        "difficulty_percent": diff_percent,
        "xp_awarded": xp_gain
    }

# ----------------- AI Tutor & Concept Explainer -----------------
@app.post("/api/tutor/chat")
def tutor_chat(req: TutorChatRequest, user: dict = Depends(get_current_user)):
    msg = req.message.lower()
    concept = (req.concept or "Python").replace("_", " ")
    
    if req.mode == "eli5":
        reply = f"Imagine {concept} is like a pizza delivery! When you call the pizza place (calling a function), you give them your address (parameter), and they hand you back a warm pizza (the return value). If they only printed a picture of the pizza, you couldn't eat it!"
    elif req.mode == "analogy":
        reply = f"Think of {concept} as an ATM machine. When you enter your PIN and ask for 500 rupees, you want the physical cash returned to your hand, not just a message on the screen saying 'Here is 500'. That is why return gives you real data to use!"
    elif req.mode == "technical":
        reply = f"In {concept}, execution pushes a new stack frame onto the call stack. The return statement evaluates an expression, stores it in the accumulator/return register, pops the stack frame, and restores the instruction pointer to the caller."
    else:
        # Socratic mode
        if "difference" in msg or "print" in msg:
            reply = f"Great question, Sachin! When you write `x = print('hello')`, what do you think gets stored in `x`? Try running it, or think about whether `print` is designed to show something or to calculate something."
        elif "why" in msg:
            reply = f"Let's trace it step-by-step: what happens when function A needs the result of function B to do its own math? How would function A get that result without a return value?"
        else:
            reply = f"Hello Sachin! Working on **{concept}** is a smart move. Let's explore: what part feels most confusing right now—the syntax, or how values flow between functions?"
    
    # Multilingual translation hint if hinglish/hindi
    if req.language == "hinglish":
        reply = "Bilkul! " + reply + " Koi specific example dekhna chahte ho?"
    elif req.language == "hi":
        reply = "नमस्ते सचिन! " + reply

    return {
        "session_id": req.session_id or f"sess_{int(time.time())}",
        "reply": reply,
        "source": "LearnTwin AI Socratic Engine"
    }

@app.post("/api/explain")
def explain(req: ExplainRequest, user: dict = Depends(get_current_user)):
    c_name = req.concept.replace("_", " ").title()
    mode = req.mode or "simple"
    
    explanations = {
        "simple": f"**{c_name} Explained Simply**:\n\nA function is like a recipe. You give it ingredients, it does the work, and the `return` statement is the finished dish given back to you so you can eat it or save it in the fridge (variable).",
        "real_world": f"**Real-World Example of {c_name}**:\n\nWhen a calculator calculates 5 + 3, it doesn't just flash 8 and forget it. It returns 8 so you can immediately multiply it by 2 in your next calculation!",
        "step_by_step": f"**Step-by-Step {c_name}**:\n\n1. Define function with `def calculate(a, b):`\n2. Compute result: `res = a * b`\n3. Return result: `return res`\n4. Caller assigns output: `total = calculate(4, 5)`\n5. `total` now equals 20!",
        "code": f"```python\ndef get_square(n):\n    return n * n\n\n# The return value can be saved and reused!\nmy_square = get_square(6)\nprint(f'Twice the square: {{my_square * 2}}')\n```",
        "visual": f"**Visualizing {c_name}**:\n\n`Caller` ────> `Function(args)`\n                      │\n                      ▼\n               `Compute Value`\n                      │\n`Caller` <──── `return Output`",
        "hint": f"**Hint for {c_name}**:\n\nRemember: `print()` is for humans to read on the monitor. `return` is for computer programs to pass values between functions."
    }
    
    text = explanations.get(mode, explanations["simple"])
    return {
        "concept": req.concept,
        "concept_name": c_name,
        "explanation": text,
        "source": "LearnTwin Multi-modal Explainer"
    }

@app.post("/api/teach-back")
def teach_back(req: TeachBackRequest, user: dict = Depends(get_current_user)):
    c_name = req.concept.replace("_", " ").title()
    text = req.explanation.lower()
    
    has_caller = any(w in text for w in ["call", "caller", "back", "gives back", "send back", "store", "variable"])
    has_distinction = any(w in text for w in ["print", "screen", "console", "display", "unlike", "instead", "difference"])
    
    score = 70
    if has_caller:
        score += 15
    if has_distinction:
        score += 15
    score = min(100, score)
    
    feedback = (
        f"Outstanding explanation, Sachin! You clearly grasped the core mechanism: "
        f"how values are handed back to the caller for subsequent operations. "
        f"Your mental model is solid and ready for advanced topics like Recursion."
    )
    
    criteria = [
        {"criterion": "Identified role of caller and return data flow", "met": has_caller},
        {"criterion": "Distinguished calculation return from console output", "met": has_distinction},
        {"criterion": "Clear and coherent articulation of concept", "met": True}
    ]
    
    # boost mastery for concept
    mastery = db["profile"].setdefault("mastery", {})
    if req.concept in mastery:
        mastery[req.concept]["score"] = min(100, mastery[req.concept]["score"] + 12)
    save_db(db)
    
    return {
        "concept": req.concept,
        "concept_name": c_name,
        "score": score,
        "feedback": feedback,
        "criteria": criteria,
        "source": "LearnTwin Feynman Evaluator"
    }

# ----------------- Notes to Path -----------------
@app.post("/api/notes/analyze")
async def notes_analyze(text: Optional[str] = Form(None), file: Optional[UploadFile] = File(None)):
    content = text or (await file.read()).decode("utf-8", errors="ignore") if file else ""
    return {
        "topics": ["Return Values", "Functions", "Recursion", "Loops"],
        "questions": [
            {
                "id": "nq_1",
                "topic": "return_values",
                "question": "What is the primary difference between returning a value and printing it?",
                "options": [
                    {"id": "a", "text": "Print is faster than return"},
                    {"id": "b", "text": "Return allows the caller to use the value in further computations"},
                    {"id": "c", "text": "There is no difference"},
                    {"id": "d", "text": "Return only works with integers"}
                ]
            },
            {
                "id": "nq_2",
                "topic": "functions",
                "question": "Can a Python function return multiple values in a tuple?",
                "options": [
                    {"id": "a", "text": "Yes, by separating values with commas"},
                    {"id": "b", "text": "No, strictly one value only"},
                    {"id": "c", "text": "Only if using a dictionary"},
                    {"id": "d", "text": "Only in Python 2"}
                ]
            }
        ]
    }

@app.post("/api/notes/submit")
def notes_submit(req: NotesSubmitRequest, user: dict = Depends(get_current_user)):
    if not req.answers:
        raise HTTPException(status_code=400, detail="Answer at least one question to build a study plan.")
    plan = [
        {"day": 1, "topic": "Return Values Mastery", "duration": "20 mins", "action": "Complete 3 practice problems on function outputs"},
        {"day": 2, "topic": "Functions to Recursion Bridge", "duration": "25 mins", "action": "Watch interactive flow trace & solve factorial base case"},
        {"day": 3, "topic": "Recursive Call Stack", "duration": "30 mins", "action": "Diagram 3 recursive frames with Teach-Back"}
    ]
    db["profile"]["notes_plan"] = plan
    save_db(db)
    return {"plan": plan}

@app.get("/api/notes/plan")
def get_notes_plan(user: dict = Depends(get_current_user)):
    return {"plan": db["profile"].get("notes_plan", [])}

# ----------------- Teacher Overview -----------------

# Subject → concept prefix mapping
SUBJECT_CONCEPT_PREFIXES = {
    "python":    ["python_basics", "variables", "data_types", "operators", "conditions",
                  "loops", "lists", "tuples", "dictionaries", "functions", "parameters",
                  "return_values", "scope", "lambda", "recursion", "oop"],
    "physics":   ["physics__cbse__10__light", "physics__cbse__10__electricity",
                  "physics__cbse__10__magnetism", "physics__cbse__10__reflection"],
    "chemistry": ["chemistry__cbse__10__matter", "chemistry__cbse__10__reactions",
                  "chemistry__cbse__10__acids", "chemistry__cbse__10__metals"],
    "maths":     ["maths__cbse__10__real-numbers", "maths__cbse__10__quadratic",
                  "maths__cbse__10__triangles", "maths__cbse__10__arithmetic"],
}

CONCEPT_NAMES = {
    "python_basics": "Python Basics", "variables": "Variables", "data_types": "Data Types",
    "operators": "Operators", "conditions": "Conditions", "loops": "Loops",
    "lists": "Lists", "tuples": "Tuples", "dictionaries": "Dictionaries",
    "functions": "Functions", "parameters": "Parameters", "return_values": "Return Values",
    "scope": "Scope", "lambda": "Lambda", "recursion": "Recursion", "oop": "Object-Oriented Programming",
    "physics__cbse__10__light": "Light – Reflection & Refraction",
    "physics__cbse__10__electricity": "Electricity",
    "physics__cbse__10__magnetism": "Magnetic Effects of Current",
    "physics__cbse__10__reflection": "Reflection of Light",
    "chemistry__cbse__10__matter": "Matter in Our Surroundings",
    "chemistry__cbse__10__reactions": "Chemical Reactions",
    "chemistry__cbse__10__acids": "Acids, Bases and Salts",
    "chemistry__cbse__10__metals": "Metals and Non-metals",
    "maths__cbse__10__real-numbers": "Real Numbers",
    "maths__cbse__10__quadratic": "Quadratic Equations",
    "maths__cbse__10__triangles": "Triangles",
    "maths__cbse__10__arithmetic": "Arithmetic Progressions",
}

# Static student roster with per-concept scores spanning all subjects
STUDENT_ROSTER = [
    {"name": "Sachin",       "id": "student_sachin"},
    {"name": "Aarav Sharma", "id": "student_aarav"},
    {"name": "Ananya Rao",   "id": "student_ananya"},
    {"name": "Diya Patel",   "id": "student_diya"},
    {"name": "Isha Deshmukh","id": "student_isha"},
    {"name": "Janhvi Anavkar","id":"student_janhvi"},
    {"name": "Kabir Singh",  "id": "student_kabir"},
    {"name": "Rohan Mehta",  "id": "student_rohan"},
    {"name": "Sara Khan",    "id": "student_sara"},
    {"name": "Vivaan Joshi", "id": "student_vivaan"},
]

# Per-student concept scores (seed values; realistic variation per student)
STUDENT_CONCEPT_SCORES: Dict[str, Dict[str, int]] = {
    "student_sachin":   {"python_basics":95,"variables":91,"data_types":84,"operators":80,"conditions":78,"loops":87,"lists":82,"tuples":60,"dictionaries":68,"functions":51,"parameters":70,"return_values":38,"scope":62,"lambda":30,"recursion":24,"oop":24,"physics__cbse__10__light":68,"physics__cbse__10__electricity":42,"maths__cbse__10__real-numbers":75,"maths__cbse__10__quadratic":40,"chemistry__cbse__10__matter":55,"chemistry__cbse__10__reactions":50},
    "student_aarav":    {"python_basics":88,"variables":85,"data_types":79,"operators":76,"conditions":73,"loops":80,"lists":77,"tuples":65,"dictionaries":72,"functions":60,"parameters":74,"return_values":48,"scope":67,"lambda":35,"recursion":30,"oop":28,"physics__cbse__10__light":72,"physics__cbse__10__electricity":50,"maths__cbse__10__real-numbers":68,"maths__cbse__10__quadratic":38,"chemistry__cbse__10__matter":60,"chemistry__cbse__10__reactions":44},
    "student_ananya":   {"python_basics":92,"variables":88,"data_types":80,"operators":77,"conditions":82,"loops":85,"lists":80,"tuples":70,"dictionaries":76,"functions":65,"parameters":78,"return_values":55,"scope":70,"lambda":42,"recursion":38,"oop":35,"physics__cbse__10__light":80,"physics__cbse__10__electricity":58,"maths__cbse__10__real-numbers":82,"maths__cbse__10__quadratic":52,"chemistry__cbse__10__matter":70,"chemistry__cbse__10__reactions":60},
    "student_diya":     {"python_basics":70,"variables":68,"data_types":65,"operators":62,"conditions":60,"loops":67,"lists":63,"tuples":50,"dictionaries":55,"functions":42,"parameters":58,"return_values":33,"scope":48,"lambda":22,"recursion":18,"oop":20,"physics__cbse__10__light":60,"physics__cbse__10__electricity":38,"maths__cbse__10__real-numbers":62,"maths__cbse__10__quadratic":30,"chemistry__cbse__10__matter":48,"chemistry__cbse__10__reactions":40},
    "student_isha":     {"python_basics":75,"variables":72,"data_types":68,"operators":65,"conditions":63,"loops":70,"lists":66,"tuples":52,"dictionaries":58,"functions":45,"parameters":61,"return_values":36,"scope":52,"lambda":25,"recursion":20,"oop":22,"physics__cbse__10__light":55,"physics__cbse__10__electricity":40,"maths__cbse__10__real-numbers":58,"maths__cbse__10__quadratic":35,"chemistry__cbse__10__matter":50,"chemistry__cbse__10__reactions":42},
    "student_janhvi":   {"python_basics":60,"variables":55,"data_types":52,"operators":50,"conditions":48,"loops":55,"lists":50,"tuples":40,"dictionaries":45,"functions":35,"parameters":48,"return_values":28,"scope":40,"lambda":18,"recursion":15,"oop":18,"physics__cbse__10__light":45,"physics__cbse__10__electricity":30,"maths__cbse__10__real-numbers":50,"maths__cbse__10__quadratic":25,"chemistry__cbse__10__matter":40,"chemistry__cbse__10__reactions":35},
    "student_kabir":    {"python_basics":80,"variables":78,"data_types":74,"operators":70,"conditions":68,"loops":75,"lists":72,"tuples":58,"dictionaries":64,"functions":55,"parameters":68,"return_values":44,"scope":60,"lambda":32,"recursion":26,"oop":30,"physics__cbse__10__light":65,"physics__cbse__10__electricity":46,"maths__cbse__10__real-numbers":70,"maths__cbse__10__quadratic":44,"chemistry__cbse__10__matter":58,"chemistry__cbse__10__reactions":48},
    "student_rohan":    {"python_basics":85,"variables":82,"data_types":78,"operators":75,"conditions":73,"loops":80,"lists":76,"tuples":62,"dictionaries":70,"functions":58,"parameters":72,"return_values":50,"scope":64,"lambda":38,"recursion":32,"oop":34,"physics__cbse__10__light":75,"physics__cbse__10__electricity":54,"maths__cbse__10__real-numbers":78,"maths__cbse__10__quadratic":48,"chemistry__cbse__10__matter":65,"chemistry__cbse__10__reactions":55},
    "student_sara":     {"python_basics":65,"variables":62,"data_types":60,"operators":57,"conditions":55,"loops":62,"lists":58,"tuples":46,"dictionaries":52,"functions":40,"parameters":55,"return_values":30,"scope":45,"lambda":20,"recursion":17,"oop":19,"physics__cbse__10__light":50,"physics__cbse__10__electricity":35,"maths__cbse__10__real-numbers":54,"maths__cbse__10__quadratic":28,"chemistry__cbse__10__matter":44,"chemistry__cbse__10__reactions":38},
    "student_vivaan":   {"python_basics":90,"variables":86,"data_types":82,"operators":78,"conditions":76,"loops":83,"lists":79,"tuples":68,"dictionaries":74,"functions":62,"parameters":76,"return_values":52,"scope":68,"lambda":40,"recursion":34,"oop":36,"physics__cbse__10__light":78,"physics__cbse__10__electricity":56,"maths__cbse__10__real-numbers":80,"maths__cbse__10__quadratic":50,"chemistry__cbse__10__matter":68,"chemistry__cbse__10__reactions":58},
}

COMPLETION_THRESHOLD = 70  # score >= 70 counts as "completed"

def _get_subject_concepts(subject: Optional[str]) -> list:
    """Return list of concept IDs for a given subject (or all if 'all')."""
    if subject == "all" or not subject:
        all_concepts = []
        for concepts in SUBJECT_CONCEPT_PREFIXES.values():
            all_concepts.extend(concepts)
        return all_concepts
    return SUBJECT_CONCEPT_PREFIXES.get(subject, [])

def _compute_student_subject_stats(student_id: str, concepts: list) -> dict:
    """Compute overall avg, weakest concept, struggling count, completion status for a student."""
    scores_map = STUDENT_CONCEPT_SCORES.get(student_id, {})
    scores = [(c, scores_map.get(c, 50)) for c in concepts]
    if not scores:
        return {"overall": 50, "weakest": "—", "struggling": 0, "completed": False, "subject_scores": {}}

    avg = int(sum(s for _, s in scores) / len(scores))
    weakest_concept, weakest_score = min(scores, key=lambda x: x[1])
    struggling = sum(1 for _, s in scores if s < COMPLETION_THRESHOLD)
    completed = all(s >= COMPLETION_THRESHOLD for _, s in scores)

    return {
        "overall": avg,
        "weakest": CONCEPT_NAMES.get(weakest_concept, weakest_concept.replace("_", " ").title()),
        "weakest_score": weakest_score,
        "struggling": struggling,
        "completed": completed,
        "subject_scores": {c: s for c, s in scores},
    }

@app.get("/api/teacher/overview")
def teacher_overview(subject: Optional[str] = "all", user: dict = Depends(get_current_user)):
    concepts = _get_subject_concepts(subject)

    # ---- Per-student stats ----
    student_rows = []
    for stu in STUDENT_ROSTER:
        stats = _compute_student_subject_stats(stu["id"], concepts)
        student_rows.append({
            "name": stu["name"],
            "id": stu["id"],
            "overall": stats["overall"],
            "weakest": stats["weakest"],
            "weakest_score": stats.get("weakest_score", 0),
            "struggling": stats["struggling"],
            "completed": stats["completed"],
            "subject_scores": stats["subject_scores"],
        })

    # Sort weakest first
    student_rows.sort(key=lambda s: s["overall"])

    # ---- Most-struggled concepts ----
    concept_stats: Dict[str, dict] = {}
    for concept in concepts:
        scores_for_concept = []
        for stu in STUDENT_ROSTER:
            s = STUDENT_CONCEPT_SCORES.get(stu["id"], {}).get(concept)
            if s is not None:
                scores_for_concept.append(s)
        if not scores_for_concept:
            continue
        avg_score = int(sum(scores_for_concept) / len(scores_for_concept))
        struggling_count = sum(1 for s in scores_for_concept if s < COMPLETION_THRESHOLD)
        # Determine which subject this concept belongs to
        concept_subject = "python"
        for subj, subj_concepts in SUBJECT_CONCEPT_PREFIXES.items():
            if concept in subj_concepts:
                concept_subject = subj
                break
        concept_stats[concept] = {
            "concept": concept,
            "name": CONCEPT_NAMES.get(concept, concept.replace("_", " ").title()),
            "subject": concept_subject,
            "avg": avg_score,
            "struggling": struggling_count,
            "count": len(scores_for_concept),
        }

    # Sort by avg score ascending (most struggled first), limit to 8
    most_struggled = sorted(concept_stats.values(), key=lambda x: x["avg"])[:8]

    # ---- Aggregate stats ----
    all_overall = [s["overall"] for s in student_rows]
    class_average = int(sum(all_overall) / len(all_overall)) if all_overall else 0
    completed_count = sum(1 for s in student_rows if s["completed"])

    # ---- Subject averages ----
    subject_averages = []
    for subj, subj_concepts in SUBJECT_CONCEPT_PREFIXES.items():
        subj_scores = []
        for stu in STUDENT_ROSTER:
            sm = STUDENT_CONCEPT_SCORES.get(stu["id"], {})
            sc = [sm[c] for c in subj_concepts if c in sm]
            if sc:
                subj_scores.append(int(sum(sc) / len(sc)))
        if subj_scores:
            subject_averages.append({"subject": subj, "avg": int(sum(subj_scores) / len(subj_scores))})

    # ---- Subjects list ----
    subjects_list = db.get("subjects", {}).get("all", [])
    if not subjects_list:
        subjects_list = [
            {"id": "python",    "name": "Python Programming", "icon": "Code2",        "has_levels": False},
            {"id": "physics",   "name": "Physics",            "icon": "Atom",          "has_levels": True},
            {"id": "chemistry", "name": "Chemistry",          "icon": "FlaskConical",  "has_levels": True},
            {"id": "maths",     "name": "Mathematics",        "icon": "Sigma",         "has_levels": True},
        ]

    return {
        "subject": subject,
        "student_count": len(STUDENT_ROSTER),
        "class_average": class_average,
        "completed_count": completed_count,
        "students": student_rows,
        "most_struggled": most_struggled,
        "subject_averages": subject_averages,
        "subjects": subjects_list,
        "concept_names": CONCEPT_NAMES,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
