"""Read-only hybrid recommendation and retrieval API for scheme records."""

from __future__ import annotations

import csv
import os
import re
import json
import shutil
import subprocess
from contextlib import asynccontextmanager
from datetime import date, datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


ROOT = Path(__file__).resolve().parent.parent
load_dotenv(Path(__file__).resolve().parent / ".env")
CSV_SETTING = Path(os.getenv("SCHEME_CSV_PATH", "updated_data.csv"))
CSV_PATH = CSV_SETTING if CSV_SETTING.is_absolute() else (ROOT / CSV_SETTING).resolve()
MAX_QUERY_LENGTH = 1200
MAX_RESULTS = 10
INDEX_FIELD_CHARS = 1200
URL_RE = re.compile(r"https?://[^\s<>\]\[()\"']+", re.IGNORECASE)
STATE_NAMES = (
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
    "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
    "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
    "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
    "andaman and nicobar islands", "chandigarh", "dadra and nagar haveli",
    "dadra and nagar haveli and daman and diu",
    "delhi", "jammu and kashmir", "ladakh", "lakshadweep", "puducherry",
)


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\ufeff", " ")).strip()


def field_value(row: dict[str, str], *names: str) -> str:
    normalized = {re.sub(r"[^a-z0-9]+", "", key.casefold()): value for key, value in row.items()}
    for name in names:
        key = re.sub(r"[^a-z0-9]+", "", name.casefold())
        if normalized.get(key):
            return normalized[key]
    return ""


def split_values(value: str, split_commas: bool = False) -> list[str]:
    value = clean(value)
    if not value:
        return []
    if value.startswith("["):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return list(dict.fromkeys(clean(item) for item in parsed if clean(item)))
        except ValueError:
            pass
    pattern = r"[;,|\n•]+" if split_commas else r"[;|\n•]+"
    return list(dict.fromkeys(part.strip() for part in re.split(pattern, value) if part.strip()))


def parse_date(value: str) -> str | None:
    value = clean(value)
    if not value:
        return None
    for parser in (date.fromisoformat, lambda text: datetime.fromisoformat(text.replace("Z", "+00:00")).date()):
        try:
            return parser(value[:10]).isoformat()
        except ValueError:
            continue
    return None


def normalize_status(value: str) -> str:
    status = clean(value).casefold()
    if status in {"open", "active", "accepting applications", "applications open"}:
        return "open"
    if status in {"closed", "inactive", "expired", "applications closed"}:
        return "closed"
    return "unknown"


def read_catalog(path: Path) -> tuple[list[dict[str, Any]], dict[str, int]]:
    if not path.is_file():
        raise RuntimeError(f"Scheme CSV not found: {path}")

    rows: list[dict[str, Any]] = []
    seen: set[tuple[str, ...]] = set()
    duplicates = 0
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for source_row, raw in enumerate(csv.DictReader(handle), start=2):
            row = {clean(key): clean(value) for key, value in raw.items() if clean(key)}
            name = row.get("scheme_name", "")
            slug = row.get("slug", "")
            if not name or not slug:
                continue
            key = tuple(row.get(column, "").casefold() for column in (
                "slug", "scheme_name", "details", "benefits", "eligibility", "application",
                "documents", "level", "schemeCategory", "tags",
            ))
            key += tuple(field_value(row, column).casefold() for column in (
                "applicable_states", "districts", "department", "official_source_url",
                "application_steps", "application_status", "deadline", "last_verified_at",
            ))
            if key in seen:
                duplicates += 1
                continue
            seen.add(key)
            record = {
                "id": slug,
                "name": name,
                "level": "central" if row.get("level", "").casefold() == "central" else "state",
                "details": row.get("details", ""),
                "benefits": row.get("benefits", ""),
                "eligibility": row.get("eligibility", ""),
                "application": row.get("application", ""),
                "documents": row.get("documents", ""),
                "category": row.get("schemeCategory", ""),
                "tags": row.get("tags", ""),
                "source_row": source_row,
                # Optional enrichment columns remain empty/unknown if the source CSV lacks them.
                "applicable_states": split_values(field_value(row, "applicable_states", "applicable states", "state", "states", "state/ut"), split_commas=True),
                "districts": split_values(field_value(row, "districts", "district"), split_commas=True),
                "department": field_value(row, "department", "managed_by", "managed by", "ministry"),
                "official_source_url": field_value(row, "official_source_url", "official source url", "source_url", "source url"),
                "application_steps": split_values(field_value(row, "application_steps", "application steps", "steps_to_apply")),
                "application_status": normalize_status(field_value(row, "application_status", "application status", "status")),
                "deadline": parse_date(field_value(row, "deadline", "application_deadline", "application deadline")),
                "last_verified_at": parse_date(field_value(row, "last_verified_at", "last verified at", "last_verified", "last verified")),
            }
            searchable = "\n".join(
                f"{label}: {value}"
                for label, field in (
                    ("Scheme", "name"), ("Category", "category"), ("Tags", "tags"),
                    ("Details", "details"), ("Benefits", "benefits"),
                    ("Eligibility", "eligibility"), ("Application", "application"),
                    ("Documents", "documents"),
                )
                if record[field]
                for value in (record[field][:INDEX_FIELD_CHARS],)
            )
            record["search_text"] = searchable
            urls = []
            for url in URL_RE.findall(record["application"]):
                url = url.rstrip(".,;:")
                if urlparse(url).scheme == "https" and urlparse(url).netloc:
                    urls.append(url)
            record["urls"] = list(dict.fromkeys(urls))[:4]
            official_url = urlparse(record["official_source_url"])
            if official_url.scheme != "https" or not official_url.netloc:
                record["official_source_url"] = ""
            record["required_documents"] = split_values(record["documents"], split_commas=True)
            record["metadata_completeness"] = {
                "state": bool(record["applicable_states"]),
                "district": bool(record["districts"]),
                "department": bool(record["department"]),
                "official_source": bool(record["official_source_url"]),
                "application_steps": bool(record["application_steps"]),
                "application_status": record["application_status"] != "unknown",
                "deadline": bool(record["deadline"]),
                "last_verified_at": bool(record["last_verified_at"]),
            }
            rows.append(record)

    if not rows:
        raise RuntimeError("No valid scheme rows were found in the CSV")
    return rows, {
        "rows": len(rows),
        "duplicate_rows_removed": duplicates,
        "missing_application": sum(not row["application"] for row in rows),
        "missing_documents": sum(not row["documents"] for row in rows),
        "missing_tags": sum(not row["tags"] for row in rows),
    }


class SearchRequest(BaseModel):
    question: str = Field(default="", max_length=MAX_QUERY_LENGTH)
    language: str = Field(default="en", pattern="^(en|hi|pa)$")
    profile: dict[str, Any] | None = None
    limit: int = Field(default=6, ge=1, le=MAX_RESULTS)


class DiscoveryRequest(BaseModel):
    question: str = Field(default="", max_length=500)
    state: str = Field(min_length=2, max_length=80)
    limit: int = Field(default=5, ge=1, le=8)


class Catalog:
    def __init__(self) -> None:
        self.rows, self.stats = read_catalog(CSV_PATH)
        self.word = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, max_df=0.98, max_features=180_000)
        self.char = TfidfVectorizer(analyzer="char", ngram_range=(3, 4), min_df=2, max_features=100_000)
        self.word_matrix = self.word.fit_transform([r["search_text"] for r in self.rows])
        self.char_matrix = self.char.fit_transform([r["search_text"] for r in self.rows])
        self.encoder = None
        if os.getenv("USE_MULTILINGUAL_EMBEDDINGS", "false").lower() == "true":
            from sentence_transformers import SentenceTransformer

            model_name = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-small")
            self.encoder = SentenceTransformer(model_name)
            self.embeddings = self.encoder.encode(
                [f"passage: {r['search_text']}" for r in self.rows],
                normalize_embeddings=True,
                show_progress_bar=True,
                batch_size=32,
            )

    @staticmethod
    def profile_text(profile: dict[str, Any] | None) -> str:
        if not profile:
            return ""
        aliases = {
            "farmer": "farmer agriculture farming", "farm_labour": "farm labour agricultural worker",
            "student": "student education scholarship", "salaried": "employee worker",
            "self_employed": "self employed business entrepreneur", "daily_wage": "daily wage labour worker",
            "construction": "construction worker labour", "street_vendor": "street vendor small business",
            "artisan": "artisan craft worker", "unemployed": "unemployed job seeker",
            "homemaker": "homemaker women family", "sc": "scheduled caste sc",
            "st": "scheduled tribe st", "obc": "other backward class obc",
            "bpl": "below poverty line low income bpl", "ews": "economically weaker section ews",
            "minority": "minority", "general": "general category",
        }
        values: list[str] = []
        for key in ("occupation",):
            val = clean(profile.get(key))
            if val:
                values.append(aliases.get(val.casefold(), val.replace("_", " ")))
        for key in ("categories",):
            raw = profile.get(key, [])
            if isinstance(raw, list):
                values.extend(aliases.get(clean(x).casefold(), clean(x).replace("_", " ")) for x in raw)
        income_terms = {
            "lt50k": "annual family income below 50000 rupees low income",
            "50k_1l": "annual family income between 50000 and 100000 rupees",
            "1l_25l": "annual family income between 100000 and 250000 rupees",
            "25l_5l": "annual family income between 250000 and 500000 rupees",
            "5l_8l": "annual family income between 500000 and 800000 rupees",
            "gt8l": "annual family income above 800000 rupees",
        }
        income = clean(profile.get("incomeBand")).casefold()
        if income:
            values.append(income_terms.get(income, income.replace("_", " ")))
        age = profile.get("age")
        if isinstance(age, int) and 0 < age < 120:
            values.append(f"applicant age {age}")
        for key in ("gender", "district", "state"):
            val = clean(profile.get(key))
            if val:
                values.append(val)
        return " ".join(values)

    def search(self, request: SearchRequest) -> list[dict[str, Any]]:
        query = clean(request.question)
        profile_text = self.profile_text(request.profile)
        combined = " ".join(part for part in (query, profile_text) if part)
        if not combined:
            return []

        word_score = cosine_similarity(self.word.transform([combined]), self.word_matrix).ravel()
        char_score = cosine_similarity(self.char.transform([combined]), self.char_matrix).ravel()
        lexical = 0.65 * word_score + 0.35 * char_score
        if self.encoder is not None:
            qvec = self.encoder.encode([f"query: {combined}"], normalize_embeddings=True)
            semantic = (self.embeddings @ qvec[0]).clip(0, 1)
            scores = 0.75 * semantic + 0.25 * lexical
        else:
            scores = lexical

        requested_state = clean((request.profile or {}).get("state", "")).casefold()
        district = clean((request.profile or {}).get("district", "")).casefold()
        results = []
        for idx, row in enumerate(self.rows):
            if row["level"] == "state" and requested_state:
                region_text = " ".join((row["name"], row["details"], row["eligibility"], row["application"])).casefold()
                # State-level rows are included only when their own source text names the user's state.
                if requested_state not in region_text:
                    continue
            score = float(scores[idx])
            if district and district in row["search_text"].casefold():
                score += 0.08
            if score <= 0.005:
                continue
            results.append({**row, "score": score, "semantic_score": float(scores[idx])})
        results.sort(key=lambda item: item["score"], reverse=True)
        return results[: request.limit]

    def filter_records(
        self, *, query: str = "", state: str = "", category: str = "",
        department: str = "", application_status: str = "", offset: int = 0, limit: int = 50,
    ) -> tuple[list[dict[str, Any]], int]:
        query, state = clean(query).casefold(), clean(state).casefold()
        category, department = clean(category).casefold(), clean(department).casefold()
        status = normalize_status(application_status) if application_status else ""
        matches = []
        for row in self.rows:
            if query and query not in row["search_text"].casefold():
                continue
            if category and category not in row["category"].casefold():
                continue
            if department and department not in row["department"].casefold():
                continue
            if status and row["application_status"] != status:
                continue
            if state:
                if row["level"] == "central":
                    row["state_match"] = "all_india"
                elif row["applicable_states"]:
                    if not any(state == item.casefold() or item.casefold() == "all india" for item in row["applicable_states"]):
                        continue
                    row["state_match"] = "structured"
                else:
                    region_text = " ".join((row["name"], row["details"], row["eligibility"], row["application"])).casefold()
                    if state not in region_text:
                        continue
                    row["state_match"] = "text"
            else:
                row["state_match"] = "not_filtered"
            matches.append(row)
        return matches[offset:offset + limit], len(matches)

    def filter_options(self) -> dict[str, list[str]]:
        categories = set()
        departments = set()
        states = set()
        statuses = set()
        for row in self.rows:
            categories.update(split_values(row["category"], split_commas=True))
            if row["department"]:
                departments.add(row["department"])
            states.update(row["applicable_states"])
            if row["application_status"] != "unknown":
                statuses.add(row["application_status"])
        return {"categories": sorted(categories), "departments": sorted(departments),
                "states": sorted(states), "applicationStatuses": sorted(statuses)}


catalog: Catalog | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global catalog
    catalog = Catalog()
    yield
    catalog = None


app = FastAPI(title="Scheme Recommendation and Retrieval API", version="1.0.0", lifespan=lifespan)
origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


def get_catalog() -> Catalog:
    if catalog is None:
        raise HTTPException(status_code=503, detail="Scheme index is still loading")
    return catalog


def public_record(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"], "title": row["name"], "level": row["level"],
        "category": row["category"], "summary": row["details"][:700],
        "benefits": row["benefits"][:700], "eligibility": row["eligibility"][:700],
        "application": row["application"][:700], "documents": row["documents"][:500],
        "score": round(row["score"], 4), "sourceRow": row["source_row"],
        "sourceUrls": row["urls"], "officialSourceUrl": row["official_source_url"],
        "applicableStates": row["applicable_states"], "districts": row["districts"],
        "department": row["department"], "applicationSteps": row["application_steps"],
        "requiredDocuments": row["required_documents"], "applicationStatus": row["application_status"],
        "deadline": row["deadline"], "lastVerifiedAt": row["last_verified_at"],
        "metadataCompleteness": row["metadata_completeness"],
        "eligibilityStatus": "needs_official_verification",
        "stateMatch": row.get("state_match", "not_filtered"),
    }


def public_catalog_record(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"], "title": row["name"], "level": row["level"],
        "category": row["category"], "summary": row["details"],
        "benefits": row["benefits"], "eligibility": row["eligibility"],
        "application": row["application"], "documents": row["documents"],
        "sourceUrls": row["urls"], "officialSourceUrl": row["official_source_url"],
        "applicableStates": row["applicable_states"], "districts": row["districts"],
        "department": row["department"], "applicationSteps": row["application_steps"],
        "requiredDocuments": row["required_documents"], "applicationStatus": row["application_status"],
        "deadline": row["deadline"], "lastVerifiedAt": row["last_verified_at"],
        "metadataCompleteness": row["metadata_completeness"], "sourceRow": row["source_row"],
        "eligibilityStatus": "needs_official_verification",
        "stateMatch": row.get("state_match", "not_filtered"),
    }


@app.get("/health")
def health() -> dict[str, Any]:
    index = get_catalog()
    return {"status": "ok", "index": index.stats, "retrieval": "multilingual-e5-small" if index.encoder else "word+character-tfidf"}


@app.post("/recommend")
def recommend(payload: SearchRequest) -> dict[str, Any]:
    hits = get_catalog().search(payload)
    return {
        "recommendations": [public_record(row) for row in hits],
        "notice": "Text relevance is not an eligibility decision. Verify the rules and source with the scheme authority.",
    }


@app.get("/filters")
def filters() -> dict[str, list[str]]:
    return get_catalog().filter_options()


@app.get("/schemes")
def list_schemes(
    query: str = Query(default="", max_length=MAX_QUERY_LENGTH),
    state: str = Query(default="", max_length=80),
    category: str = Query(default="", max_length=120),
    department: str = Query(default="", max_length=200),
    application_status: str = Query(default="", alias="applicationStatus", pattern="^(|open|closed|unknown)$"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> dict[str, Any]:
    rows, total = get_catalog().filter_records(
        query=query, state=state, category=category, department=department,
        application_status=application_status, offset=offset, limit=limit,
    )
    return {"schemes": [public_catalog_record(row) for row in rows], "total": total,
            "offset": offset, "limit": limit,
            "notice": "Missing metadata is left unknown; confirm scheme details and eligibility with the official source."}


def extractive_answer(rows: list[dict[str, Any]], language: str) -> str:
    if not rows:
        return {
            "en": "I could not find a relevant scheme record in the imported catalogue.",
            "hi": "आयात किए गए योजना संग्रह में इससे जुड़ा रिकॉर्ड नहीं मिला।",
            "pa": "ਆਯਾਤ ਕੀਤੇ ਯੋਜਨਾ ਕੈਟਾਲਾਗ ਵਿੱਚ ਇਸ ਨਾਲ ਸੰਬੰਧਿਤ ਰਿਕਾਰਡ ਨਹੀਂ ਮਿਲਿਆ।",
        }[language]
    best = rows[0]
    prefix = {
        "en": "Retrieved source text (English; not translated):",
        "hi": "स्रोत का पाठ अंग्रेज़ी में है और इसका अनुवाद नहीं किया गया है:",
        "pa": "ਸਰੋਤ ਦਾ ਪਾਠ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹੈ ਅਤੇ ਇਸਦਾ ਅਨੁਵਾਦ ਨਹੀਂ ਕੀਤਾ ਗਿਆ:",
    }[language]
    parts = [f"{prefix}\n{best['name']}"]
    for label, field in (("Details", "details"), ("Benefits", "benefits"), ("Eligibility", "eligibility"), ("Application", "application"), ("Documents", "documents")):
        if best[field]:
            parts.append(f"{label}: {best[field][:900]}")
    return "\n\n".join(parts)


def generate_answer(question: str, language: str, rows: list[dict[str, Any]]) -> str | None:
    if os.getenv("ENABLE_LLM_GENERATION", "false").lower() != "true":
        return None
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL")
    if not api_key or not model or not rows:
        return None
    import json
    import urllib.error
    import urllib.request

    context = "\n\n".join(
        f"[{row['id']}] {row['name']}\n{row['search_text']}" for row in rows
    )
    language_name = {"en": "English", "hi": "Hindi", "pa": "Punjabi"}[language]
    body = json.dumps({
        "model": model,
        "temperature": 0.1,
        "messages": [
            {"role": "system", "content": "Answer only from the supplied scheme records. Never infer eligibility from similarity scores. If the records do not answer the question, say so. Keep specific caveats. Cite every factual scheme claim with its record id in square brackets, for example [scheme-slug]. Reply in " + language_name + "."},
            {"role": "user", "content": f"Question: {question}\n\nRetrieved scheme records:\n{context}"},
        ],
    }).encode("utf-8")
    endpoint = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/") + "/chat/completions"
    req = urllib.request.Request(endpoint, data=body, headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=35) as response:
            data = json.loads(response.read().decode("utf-8"))
        return clean(data["choices"][0]["message"]["content"])
    except (urllib.error.URLError, KeyError, IndexError, ValueError, TimeoutError):
        return None


@app.post("/ask")
def ask(payload: SearchRequest) -> dict[str, Any]:
    if not clean(payload.question):
        raise HTTPException(status_code=422, detail="A question is required")
    rows = get_catalog().search(payload.model_copy(update={"limit": min(payload.limit, 4)}))
    generated_answer = generate_answer(clean(payload.question), payload.language, rows)
    answer = generated_answer or extractive_answer(rows, payload.language)
    citations = [
        {"id": row["id"], "source": f"Imported scheme catalogue · row {row['source_row']}: {row['name']}", "link": row["official_source_url"] or None}
        for row in rows
    ]
    return {"answer": answer, "citations": citations, "retrieved": len(rows), "generated": generated_answer is not None}


@app.post("/discover")
def discover(payload: DiscoveryRequest) -> dict[str, Any]:
    """Search public web leads through Agent Reach; these are not verified scheme records."""
    if not shutil.which("agent-reach"):
        raise HTTPException(status_code=503, detail="Agent Reach CLI is not installed on the API host")
    state = clean(payload.state)
    if state.casefold() not in STATE_NAMES:
        raise HTTPException(status_code=422, detail="Choose an Indian state or union territory")
    question = clean(payload.question)
    query = f"government welfare schemes benefits eligibility {state} India official government" + (f" {question}" if question else "")
    try:
        result = subprocess.run(
            ["agent-reach", "web", "search", query, "--limit", str(payload.limit)],
            capture_output=True, text=True, timeout=35, check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Agent Reach search timed out") from exc
    if result.returncode != 0:
        raise HTTPException(status_code=502, detail="Agent Reach web search failed or needs setup")
    try:
        data = json.loads(result.stdout)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Agent Reach returned an unreadable response") from exc
    if not data.get("ok"):
        error = data.get("error", {})
        raise HTTPException(status_code=502, detail=clean(error.get("message") or error.get("code") or "Agent Reach search failed"))
    items = []
    for item in data.get("items", [])[:payload.limit]:
        url = clean(item.get("url"))
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.netloc:
            continue
        items.append({"title": clean(item.get("title"))[:240] or url, "url": url,
                      "snippet": clean(item.get("text"))[:700], "source": parsed.netloc})
    return {"results": items, "state": state, "notice": "Web search leads only. Verify scheme rules and eligibility on the linked official government portal."}
