from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), default="")
    role: Mapped[str] = mapped_column(String(20), default="student", nullable=False)  # "student" or "admin"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    profile: Mapped["StudentProfileModel"] = relationship("StudentProfileModel", back_populates="user", uselist=False, cascade="all, delete-orphan")
    evaluations: Mapped[list["Evaluation"]] = relationship("Evaluation", back_populates="user")
    plans: Mapped[list["ApplicationPlan"]] = relationship("ApplicationPlan", back_populates="user", cascade="all, delete-orphan")

class StudentProfileModel(Base):
    __tablename__ = "student_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    
    state: Mapped[str] = mapped_column(String(80), default="Maharashtra")
    category: Mapped[str] = mapped_column(String(40), default="OBC")
    annual_income: Mapped[int] = mapped_column(Integer, default=150000)
    marks_percentage: Mapped[float | None] = mapped_column(Float, nullable=True, default=80.0)
    course_level: Mapped[str] = mapped_column(String(50), default="Post-Matric")
    course_type: Mapped[str] = mapped_column(String(50), default="Professional")
    attendance_percentage: Mapped[float | None] = mapped_column(Float, nullable=True, default=80.0)
    cap_admission: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=True)
    receiving_other_scholarship: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=False)
    passed_previous_year: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=True)
    is_fresh_application: Mapped[bool] = mapped_column(Boolean, default=True)
    available_documents_json: Mapped[str] = mapped_column(Text, default='["Income Certificate", "Mark Sheet", "Domicile Certificate"]')
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="profile")

class Scholarship(Base):
    __tablename__ = "scholarships"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    state: Mapped[str] = mapped_column(String(80), default="All India")
    source_url: Mapped[str] = mapped_column(String(600), default="")
    source_verified_on: Mapped[str] = mapped_column(String(20), default="")
    is_official: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    academic_year: Mapped[str] = mapped_column(String(30), default="2026-2027")
    version: Mapped[int] = mapped_column(Integer, default=1)
    criteria_json: Mapped[str] = mapped_column(Text, default="[]")
    notes: Mapped[str] = mapped_column(Text, default="")
    
    # Extended attributes for AI graph search, hill climbing ranking & A* planning
    deadline: Mapped[str] = mapped_column(String(40), default="2026-11-30")
    award_amount: Mapped[int] = mapped_column(Integer, default=50000)
    category: Mapped[str] = mapped_column(String(50), default="All")
    course_level: Mapped[str] = mapped_column(String(50), default="Post-Matric")
    required_documents_json: Mapped[str] = mapped_column(Text, default='["Income Certificate", "Caste Certificate", "Domicile Certificate", "Mark Sheet"]')
    application_effort_hours: Mapped[float] = mapped_column(Float, default=4.0)

    # Relationships
    audit_logs: Mapped[list["RuleAuditLog"]] = relationship("RuleAuditLog", back_populates="scholarship", cascade="all, delete-orphan")

class Evaluation(Base):
    __tablename__ = "evaluations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    rule_version: Mapped[int] = mapped_column(Integer, default=1)
    student_summary_json: Mapped[str] = mapped_column(Text)
    results_json: Mapped[str] = mapped_column(Text)

    user: Mapped["User | None"] = relationship("User", back_populates="evaluations")

class ApplicationPlan(Base):
    __tablename__ = "application_plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    scholarship_id: Mapped[int] = mapped_column(Integer, ForeignKey("scholarships.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="interested")  # "interested", "preparing_documents", "ready_to_apply", "submitted", "under_review", "approved", "rejected"
    notes: Mapped[str] = mapped_column(Text, default="")
    applied_date: Mapped[str] = mapped_column(String(40), default="")
    tasks_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="plans")
    scholarship: Mapped["Scholarship"] = relationship("Scholarship")

class RuleAuditLog(Base):
    __tablename__ = "rule_audit_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    scheme_id: Mapped[int] = mapped_column(Integer, ForeignKey("scholarships.id", ondelete="CASCADE"), index=True, nullable=False)
    admin_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(40), default="update")  # "create", "update", "archive", "unarchive", "rule_change"
    version: Mapped[int] = mapped_column(Integer, default=1)
    changes_summary: Mapped[str] = mapped_column(Text, default="")
    criteria_snapshot_json: Mapped[str] = mapped_column(Text, default="[]")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    scholarship: Mapped["Scholarship"] = relationship("Scholarship", back_populates="audit_logs")
    admin_user: Mapped["User | None"] = relationship("User")

