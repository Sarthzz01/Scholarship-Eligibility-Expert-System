from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Authentication Schemas ---

class UserRegister(BaseModel):
    email: str = Field(min_length=5, max_length=160)
    password: str = Field(min_length=6, max_length=100)
    full_name: str = Field(min_length=2, max_length=120)

class UserLogin(BaseModel):
    email: str = Field(min_length=5, max_length=160)
    password: str = Field(min_length=1, max_length=100)
    expected_role: Optional[str] = None  # "student" or "admin" if coming from role-specific login

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: str
    full_name: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

# --- Student Profile Schemas ---

class StudentProfileSchema(BaseModel):
    state: str = Field(default="Maharashtra", min_length=2, max_length=80)
    category: str = Field(default="OBC", min_length=2, max_length=40)
    annual_income: int = Field(default=150000, ge=0, le=100_000_000)
    marks_percentage: Optional[float] = Field(default=80.0, ge=0, le=100)
    course_level: str = Field(default="Post-Matric", min_length=2, max_length=50)
    course_type: str = Field(default="Professional", min_length=2, max_length=50)
    attendance_percentage: Optional[float] = Field(default=80.0, ge=0, le=100)
    cap_admission: Optional[bool] = True
    receiving_other_scholarship: Optional[bool] = False
    passed_previous_year: Optional[bool] = True
    is_fresh_application: bool = True
    available_documents: list[str] = Field(default_factory=lambda: ["Income Certificate", "Mark Sheet", "Domicile Certificate"])

# --- Scholarship Schemas ---

class Criterion(BaseModel):
    field: str
    operator: str
    value: Any = None
    message: str
    required: bool = True
    when: Optional[dict[str, Any]] = None

class ScholarshipCreate(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    description: str = ""
    state: str = "All India"
    source_url: str = ""
    source_verified_on: str = ""
    is_official: bool = False
    is_active: bool = True
    is_archived: bool = False
    academic_year: str = "2026-2027"
    version: int = 1
    criteria: list[Criterion] = []
    notes: str = ""
    deadline: str = "2026-11-30"
    award_amount: int = 50000
    category: str = "All"
    course_level: str = "Post-Matric"
    required_documents: list[str] = Field(default_factory=lambda: ["Income Certificate", "Caste Certificate", "Domicile Certificate", "Mark Sheet"])
    application_effort_hours: float = 4.0

class ScholarshipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    state: str
    source_url: str
    source_verified_on: str
    is_official: bool
    is_active: bool
    is_archived: bool = False
    academic_year: str = "2026-2027"
    version: int = 1
    criteria: list[Criterion] = []
    notes: str
    deadline: str
    award_amount: int
    category: str
    course_level: str
    required_documents: list[str] = []
    application_effort_hours: float

# --- Application Tracking Schemas ---

class ApplicationRecordCreate(BaseModel):
    scholarship_id: int
    status: str = Field(default="interested", pattern="^(interested|preparing_documents|ready_to_apply|submitted|under_review|approved|rejected)$")
    notes: str = ""
    applied_date: str = ""

class ApplicationRecordUpdate(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(interested|preparing_documents|ready_to_apply|submitted|under_review|approved|rejected)$")
    notes: Optional[str] = None
    applied_date: Optional[str] = None

class ApplicationRecordOut(BaseModel):
    id: int
    user_id: int
    scholarship_id: int
    scholarship_name: str
    status: str
    notes: str
    applied_date: str
    deadline: str
    award_amount: int
    official_source_url: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# --- Rule Validation & Audit Schemas ---

class RuleValidationRequest(BaseModel):
    criteria: list[Criterion]

class RuleValidationResponse(BaseModel):
    is_valid: bool
    errors: list[str] = []
    warnings: list[str] = []
    duplicates: list[str] = []
    contradictions: list[str] = []

class RuleAuditLogOut(BaseModel):
    id: int
    scheme_id: int
    admin_id: Optional[int] = None
    action: str
    version: int
    changes_summary: str
    timestamp: Optional[datetime] = None

# --- Evaluation Schemas ---

class EvaluateRequest(BaseModel):
    student: StudentProfileSchema

class EvaluateResponse(BaseModel):
    results: list[dict]
    evaluation_id: int

# --- AI Algorithm Schemas ---

class BackwardChainingRequest(BaseModel):
    scheme_id: int
    student: Optional[StudentProfileSchema] = None

class BFSRequest(BaseModel):
    student_state: Optional[str] = "Maharashtra"
    student_category: Optional[str] = "OBC"
    course_level: Optional[str] = "Post-Matric"
    start_node_id: Optional[str] = None
    filter_by_profile: Optional[bool] = False

class DFSRequest(BaseModel):
    scheme_id: int
    student: Optional[StudentProfileSchema] = None

class HillClimbingRequest(BaseModel):
    student: Optional[StudentProfileSchema] = None
    weights: Optional[dict[str, float]] = None

class AStarRequest(BaseModel):
    scheme_id: int
    student: Optional[StudentProfileSchema] = None
    available_documents: Optional[list[str]] = None
