import os
import re
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import httpx

from .models import Scholarship
from .engine import evaluate_scheme

DEFAULT_SUGGESTIONS = [
    "Am I eligible for any scholarships?",
    "What documents do I need for MahaDBT OBC?",
    "Which scholarships offer the highest award amount?",
    "What are the upcoming deadlines?",
    "Can General / Open category students apply for EBC?"
]

def format_currency(val: int) -> str:
    return f"₹{val:,.0f}" if val else "₹0"

def get_all_active_schemes(db: Session) -> List[Dict[str, Any]]:
    rows = db.query(Scholarship).filter(Scholarship.is_active == True, Scholarship.is_archived == False).all()
    results = []
    for s in rows:
        docs = []
        if s.required_documents_json:
            try:
                docs = json.loads(s.required_documents_json)
            except Exception:
                pass
        criteria = []
        if s.criteria_json:
            try:
                criteria = json.loads(s.criteria_json)
            except Exception:
                pass
        results.append({
            "id": s.id,
            "name": s.name,
            "description": s.description or "",
            "state": s.state or "All India",
            "source_url": s.source_url or "",
            "is_official": bool(s.is_official),
            "deadline": s.deadline or "",
            "award_amount": s.award_amount or 0,
            "category": s.category or "All",
            "course_level": s.course_level or "Post-Matric",
            "required_documents": docs,
            "criteria": criteria,
            "notes": s.notes or ""
        })
    return results

def build_system_prompt(schemes: List[Dict[str, Any]], student_profile: Optional[Dict[str, Any]]) -> str:
    schemes_summary = []
    for s in schemes:
        crit_text = "; ".join([c.get("message", "") for c in s.get("criteria", [])[:5]])
        docs_text = ", ".join(s.get("required_documents", []))
        schemes_summary.append(
            f"- Scheme #{s['id']}: **{s['name']}**\n"
            f"  Category: {s['category']} | State: {s['state']} | Award: ₹{s['award_amount']:,}/yr | Deadline: {s['deadline']}\n"
            f"  Official Portal: {s['source_url']}\n"
            f"  Required Documents: {docs_text}\n"
            f"  Key Rules: {crit_text}\n"
            f"  Description: {s['description']}"
        )

    schemes_block = "\n\n".join(schemes_summary)

    profile_block = "No student profile currently provided."
    if student_profile:
        docs = student_profile.get("available_documents", [])
        docs_str = ", ".join(docs) if isinstance(docs, list) else str(docs)
        profile_block = (
            f"Connected Student Facts:\n"
            f"- State: {student_profile.get('state', 'Unknown')}\n"
            f"- Category: {student_profile.get('category', 'Unknown')}\n"
            f"- Annual Family Income: ₹{student_profile.get('annual_income', 0):,}\n"
            f"- Qualifying Marks %: {student_profile.get('marks_percentage', 'Unknown')}%\n"
            f"- Course Level: {student_profile.get('course_level', 'Unknown')}\n"
            f"- Course Type: {student_profile.get('course_type', 'Unknown')}\n"
            f"- Attendance: {student_profile.get('attendance_percentage', 'Unknown')}%\n"
            f"- CAP Admission (Professional): {student_profile.get('cap_admission')}\n"
            f"- Currently receiving another scholarship: {student_profile.get('receiving_other_scholarship')}\n"
            f"- Passed previous year: {student_profile.get('passed_previous_year')}\n"
            f"- Available Scanned Documents: {docs_str}"
        )

    return f"""You are the intelligent, helpful, and empathetic AI Academic & Scholarship Counselor for the Scholarship Eligibility Expert System.
You have the ability to answer ANY question asked by the student.

YOUR EXPERTISE INCLUDES:
1. All government and state scholarships (MahaDBT Maharashtra, National Scholarship Portal NSP, AICTE, Central schemes).
2. Eligibility checking, required documents, certificate verification (Tehsildar Income certificate, Caste Validity, CAP Allotment, Bonafide).
3. Deadlines, application workflows, direct benefit transfer (DBT), Aadhaar seeding.
4. College admissions, entrance exams (MHT-CET, JEE, NEET, GATE), exam preparation tips, higher education paths, and careers.
5. ANY general, academic, study guidance, or conversational question the student asks.

GROUNDED KNOWLEDGE BASE OF ACTIVE SCHOLARSHIPS:
{schemes_block}

CURRENT STUDENT CONTEXT:
{profile_block}

GUIDELINES FOR YOUR RESPONSES:
- If asked about scholarship eligibility, compare the student's connected facts against the official rules and give clear, honest verdicts with specific deadlines and award amounts.
- If asked ANY general educational, career, exam, document, or personal question, provide a knowledgeable, structured, encouraging, and complete answer.
- Format responses in clean GitHub-style Markdown (use bold text, bullet points, headers `###`, and blockquotes `>`).
- Always mention relevant scholarship names exactly as written in the database so the system can attach interactive action cards.
- Keep tone warm, motivating, clear, and professional.
"""

logger = logging.getLogger("ai_chatbot")

def query_gemini_api(api_key: str, message: str, history: List[Dict[str, str]], system_prompt: str) -> Optional[str]:
    """Calls Google Gemini REST API using currently supported model versions."""
    models_to_try = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-1.5-flash"
    ]
    
    # Format conversational contents for Gemini API
    contents = []
    for h in history[-4:]:
        role = "user" if h.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": h.get("content", "")}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        # Prioritize thinkingBudget: 0 so internal thought reasoning does not consume the output token ceiling
        for use_thinking_budget in [True, False]:
            gen_cfg = {
                "temperature": 0.7,
                "maxOutputTokens": 3500 if use_thinking_budget else 4096
            }
            if use_thinking_budget:
                gen_cfg["thinkingConfig"] = {"thinkingBudget": 0}

            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": contents,
                "generationConfig": gen_cfg
            }
            try:
                with httpx.Client(timeout=25.0) as client:
                    res = client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            texts = [p.get("text", "") for p in parts if "text" in p and p.get("text")]
                            if texts:
                                return "\n\n".join(texts)
                    elif res.status_code == 400 and use_thinking_budget:
                        # Fallback for models that do not support thinkingConfig
                        continue
                    else:
                        logger.warning(f"Gemini model {model} returned HTTP {res.status_code}: {res.text[:200]}")
                        break
            except Exception as exc:
                logger.warning(f"Gemini model {model} call error: {exc}")
                break
    return None

def query_openai_api(api_key: str, message: str, history: List[Dict[str, str]], system_prompt: str, base_url: str = "https://api.openai.com/v1") -> Optional[str]:
    """Calls OpenAI-compatible Chat Completions API."""
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-4:]:
        role = "user" if h.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": h.get("content", "")})
    messages.append({"role": "user", "content": message})

    url = f"{base_url.rstrip('/')}/chat/completions"
    model = "llama-3.3-70b-versatile" if "groq" in base_url else "gpt-4o-mini"
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2500
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    try:
        with httpx.Client(timeout=25.0) as client:
            res = client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    return choices[0]["message"].get("content")
            else:
                logger.warning(f"OpenAI endpoint returned HTTP {res.status_code}: {res.text[:200]}")
    except Exception as exc:
        logger.warning(f"OpenAI endpoint call error: {exc}")
    return None

def find_matched_schemes(text: str, schemes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Identifies which scholarships are referenced in the LLM response or query."""
    text_lower = text.lower()
    matched = []
    seen = set()

    # Nicknames & keywords mapping
    aliases = {
        "obc": "post matric scholarship to obc students",
        "ebc": "rajarshi chhatrapati shahu maharaj",
        "shahu maharaj": "rajarshi chhatrapati shahu maharaj",
        "central sector": "central sector scheme of scholarships",
        "pragati": "aicte pragati scholarship",
        "aicte": "aicte pragati scholarship",
        "panjabrao": "dr. panjabrao deshmukh",
        "deshmukh": "dr. panjabrao deshmukh",
        "hostel": "dr. panjabrao deshmukh",
        "minority": "state minority scholarship",
        "pmss": "prime minister's scholarship scheme",
        "capf": "prime minister's scholarship scheme",
        "sc scholarship": "post-matric scholarship for sc",
        "st scholarship": "post matric scholarship scheme for st",
    }

    for s in schemes:
        s_name = s["name"].lower()
        if s["id"] in seen:
            continue
        if s_name in text_lower:
            matched.append(s)
            seen.add(s["id"])
            continue
        for alias, target in aliases.items():
            if alias in text_lower and target in s_name and s["id"] not in seen:
                matched.append(s)
                seen.add(s["id"])
                break

    return matched[:4]

def process_chat_query(
    message: str,
    student_profile: Optional[Dict[str, Any]],
    chat_history: List[Dict[str, str]],
    db: Session
) -> Dict[str, Any]:
    """
    Intelligent AI Chatbot Assistant.
    1. Checks if GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY is configured in .env.
    2. If present, calls LLM with comprehensive knowledge base & student facts.
    3. If not present or if call fails, falls back to the deterministic expert rule engine.
    """
    # Reload .env dynamically so live edits to .env are picked up immediately
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_path):
        load_dotenv(dotenv_path=env_path, override=True)
    else:
        load_dotenv(override=True)

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()

    schemes = get_all_active_schemes(db)
    system_prompt = build_system_prompt(schemes, student_profile)

    llm_reply = None

    # Try Gemini API if key provided
    if gemini_key and not gemini_key.startswith("your_"):
        llm_reply = query_gemini_api(gemini_key, message, chat_history, system_prompt)

    # Try OpenAI API if key provided and no response yet
    if not llm_reply and openai_key and not openai_key.startswith("your_"):
        llm_reply = query_openai_api(openai_key, message, chat_history, system_prompt)

    # Try Groq API if key provided and no response yet
    if not llm_reply and groq_key and not groq_key.startswith("your_"):
        llm_reply = query_openai_api(groq_key, message, chat_history, system_prompt, base_url="https://api.groq.com/openai/v1")

    # If LLM answered successfully
    if llm_reply:
        return {
            "reply": llm_reply,
            "matched_schemes": [],
            "suggested_questions": [
                "Am I eligible for any scholarships?",
                "What documents are required?",
                "Which scholarship has the nearest deadline?",
                "How do I apply on the official portal?"
            ]
        }

    # =========================================================================
    # Fallback to Built-in Domain Expert Knowledge Engine
    # =========================================================================
    q = message.lower().strip()
    now = datetime.now(timezone.utc)

    matched_schemes = []
    reply_lines = []

    # 1. Greeting
    is_greeting = bool(re.search(r'\b(hello|hi|hey|namaste|good\s+morning|good\s+evening|who\s+are\s+you)\b', q)) and len(q.split()) <= 4
    if is_greeting:
        intro = (
            "Hello! I am your **AI Scholarship Assistant**.\n\n"
            f"I have direct access to our verified database of **{len(schemes)} scholarship schemes** "
            "(including official MahaDBT schemes, National Scholarship Portal (NSP) schemes, and AICTE grants).\n\n"
        )
        if student_profile:
            cat = student_profile.get("category", "Student")
            state = student_profile.get("state", "India")
            inc = student_profile.get("annual_income")
            inc_str = f" with annual income ₹{inc:,}" if inc else ""
            intro += f"💡 *I am currently synced with your profile:* **{cat} category** in **{state}**{inc_str}.\n\n"
        intro += "How can I help you today? You can ask about your eligibility, required documents, deadlines, or how to apply!"
        return {
            "reply": intro,
            "matched_schemes": [],
            "suggested_questions": [
                "Am I eligible for any scholarships?",
                "Which scholarships offer the highest award?",
                "What documents do I need?",
                "Upcoming deadlines"
            ]
        }

    # 2. Eligibility
    if any(phrase in q for phrase in [
        "eligible", "eligibility", "can i apply", "what can i get", "qualify", "check my profile",
        "which scholarship", "am i fit", "options for me"
    ]):
        if student_profile and any(student_profile.get(k) is not None for k in ["category", "annual_income"]):
            eval_results = []
            for s in schemes:
                eval_res = evaluate_scheme(student_profile, s)
                eval_results.append((s, eval_res))

            eligible = [item for item in eval_results if item[1]["status"] == "potential_match"]
            needs_action = [item for item in eval_results if item[1]["status"] in ("ineligible", "needs_information")]

            reply_lines.append(f"### 🎯 Personalized Eligibility Assessment")
            reply_lines.append(
                f"Based on your profile (**{student_profile.get('category')}** category, "
                f"State: **{student_profile.get('state')}**, "
                f"Income: **{format_currency(student_profile.get('annual_income', 0))}**, "
                f"Marks: **{student_profile.get('marks_percentage', 0)}%**):\n"
            )

            if eligible:
                reply_lines.append(f"You are **potentially eligible** for **{len(eligible)} scheme(s)**:\n")
                for s, res in eligible:
                    matched_schemes.append(s)
                    badge = "✅ Official" if s["is_official"] else "🧪 Demo"
                    reply_lines.append(
                        f"- **[{s['name']}]({s['source_url']})** ({badge})\n"
                        f"  - **Award Amount:** {format_currency(s['award_amount'])}/year\n"
                        f"  - **Deadline:** `{s['deadline']}`\n"
                        f"  - **Key Documents:** {', '.join(s['required_documents'][:4])}"
                    )
            else:
                reply_lines.append("Currently, you do not meet all mandatory criteria for active schemes.")

            if needs_action and len(eligible) < 3:
                reply_lines.append("\n**Schemes requiring specific conditions:**")
                for s, res in needs_action[:3]:
                    fails = [f.get("message") for f in res.get("failed_conditions", [])]
                    fail_str = f" (*{fails[0]}*)" if fails else ""
                    reply_lines.append(f"- **{s['name']}**{fail_str}")

            return {
                "reply": "\n".join(reply_lines),
                "matched_schemes": matched_schemes[:4],
                "suggested_questions": [
                    "What documents do I need to prepare?",
                    "Which scholarship has the nearest deadline?",
                    "Can I apply for multiple scholarships?",
                    "How do I update my profile details?"
                ]
            }

    # 3. Documents
    if any(phrase in q for phrase in ["document", "docs", "certificate", "income cert", "caste cert", "affidavit", "allotment"]):
        target_schemes = [s for s in schemes if any(w in s["name"].lower() for w in q.split() if len(w) > 3)]
        if not target_schemes:
            target_schemes = schemes[:4]

        reply_lines.append("### 📄 Required Documentation Guide\n")
        reply_lines.append("Here are the standard documents required across verified scholarship schemes:\n")
        for s in target_schemes[:3]:
            matched_schemes.append(s)
            docs = s.get("required_documents", [])
            reply_lines.append(f"**{s['name']}:**")
            for doc in docs:
                reply_lines.append(f"  • {doc}")
            reply_lines.append("")

        reply_lines.append(
            "> 💡 **Tip:** Keep scanned copies (PDF/JPEG under 250KB) of your **Income Certificate from Tehsildar**, "
            "**Domicile Certificate**, and **Mark Sheet** ready before the portal deadline."
        )

        return {
            "reply": "\n".join(reply_lines),
            "matched_schemes": matched_schemes,
            "suggested_questions": [
                "How do I track these documents?",
                "What is the CAP allotment letter?",
                "What if I don't have a Caste Validity certificate?"
            ]
        }

    # 4. Deadlines
    if any(phrase in q for phrase in ["deadline", "date", "last date", "closing", "urgent", "when to apply"]):
        reply_lines.append("### ⏰ Active Scholarship Deadlines\n")
        sorted_by_date = sorted(schemes, key=lambda x: x.get("deadline", "9999-99-99"))

        approaching = []
        for s in sorted_by_date:
            dl_str = s.get("deadline")
            if dl_str:
                try:
                    parts = [int(p) for p in dl_str.split("-")[:3]]
                    dl_dt = datetime(parts[0], parts[1], parts[2], tzinfo=timezone.utc)
                    days_left = (dl_dt - now).days
                    if days_left >= 0:
                        approaching.append((s, days_left))
                except Exception:
                    pass

        if approaching:
            for s, days in approaching[:6]:
                matched_schemes.append(s)
                urgency = "🔴 Urgent" if days <= 15 else ("🟡 Approaching" if days <= 30 else "🟢 Open")
                reply_lines.append(
                    f"- **{s['name']}**\n"
                    f"  - **Deadline:** `{s['deadline']}` ({days} days remaining) — {urgency}\n"
                    f"  - **Award:** {format_currency(s['award_amount'])}"
                )
        else:
            reply_lines.append("All active scholarships have open deadlines for the current academic session.")

        return {
            "reply": "\n".join(reply_lines),
            "matched_schemes": matched_schemes[:3],
            "suggested_questions": [
                "Am I eligible for any of these?",
                "Add to my Application Tracker",
                "What documents do I need?"
            ]
        }

    # 5. Fallback keyword match or general advice
    words = [w for w in re.findall(r'\w+', q) if len(w) > 3 and w not in ["what", "which", "when", "about", "this", "that", "there", "some"]]
    hits = []
    for s in schemes:
        text = f"{s['name']} {s['description']} {s['state']} {s['category']} {s['notes']}".lower()
        score = sum(1 for w in words if w in text)
        if score > 0:
            hits.append((s, score))

    if hits:
        hits.sort(key=lambda x: x[1], reverse=True)
        top_hits = [h[0] for h in hits[:4]]
        reply_lines.append("### 🔎 Relevant Scholarship Information\n")
        for s in top_hits:
            matched_schemes.append(s)
            reply_lines.append(
                f"- **[{s['name']}]({s['source_url']})**\n"
                f"  - **State:** {s['state']} | **Category:** {s['category']} | **Award:** {format_currency(s['award_amount'])}\n"
                f"  - **Deadline:** `{s['deadline']}`\n"
                f"  - **Summary:** {s['description']}\n"
            )
        return {
            "reply": "\n".join(reply_lines),
            "matched_schemes": matched_schemes,
            "suggested_questions": [
                "Am I eligible for these?",
                "What documents do I need?",
                "Upcoming deadlines"
            ]
        }

    # Open query fallback with API Key notice
    api_key_notice = ""
    if not (gemini_key or openai_key or groq_key):
        api_key_notice = (
            "\n\n> 💡 **Notice:** To answer general open-ended questions using Gemini or OpenAI, "
            "add your `GEMINI_API_KEY` or `OPENAI_API_KEY` to the `backend/.env` file!"
        )

    return {
        "reply": (
            f"I searched our verified knowledge base of **{len(schemes)} scholarship schemes**.\n\n"
            "You can ask me questions such as:\n"
            "- *\"Am I eligible for any scholarship?\"*\n"
            "- *\"What documents are required for MahaDBT OBC?\"*\n"
            "- *\"Which scholarship offers the highest amount?\"*\n"
            "- *\"What are the deadlines for open schemes?\"*\n"
            "- *\"Can General category students apply for EBC?\"*"
            f"{api_key_notice}"
        ),
        "matched_schemes": schemes[:2],
        "suggested_questions": DEFAULT_SUGGESTIONS
    }
