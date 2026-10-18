import json
from sqlalchemy.orm import Session
from .models import Scholarship

MAHADBT_OBC_URL = (
    "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?"
    "str=E9DDFA703C38E51AB02E984835E89FEFDB316E301CE6A991F41C5D42B01A7D7E"
)

MAHADBT_EBC_URL = (
    "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?"
    "str=E9DDFA703C38E51AB02E984835E89FEF8A64952003FECE0FA8BA683F217997BB"
)

NSP_CENTRAL_URL = "https://scholarships.gov.in/public/schemeGuidelines/CSSS_Guidelines.pdf"

SCHEMES = [
    {
        "name": "Post Matric Scholarship to OBC Students (Maharashtra)",
        "description": "Financial assistance for eligible OBC students pursuing approved post-matric education in Maharashtra.",
        "state": "Maharashtra",
        "source_url": MAHADBT_OBC_URL,
        "source_verified_on": "2026-10-09",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-12-15",
        "award_amount": 45000,
        "category": "OBC",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Caste Certificate", "Domicile Certificate", "Mark Sheet", "Fee Receipt", "CAP Allotment Letter"],
        "application_effort_hours": 5.0,
        "notes": "Preliminary rule subset based on the official MahaDBT page. The official scheme includes additional course, admission, family-beneficiary, renewal and documentation conditions. A match is not a guarantee of sanction.",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "Applicant must be a Maharashtra resident/state applicant."},
            {"field": "category", "operator": "eq", "value": "OBC", "message": "Applicant must belong to OBC category."},
            {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Annual parental/guardian income must be ₹2,50,000 or less."},
            {"field": "course_level", "operator": "eq", "value": "Post-Matric", "message": "Applicant must be pursuing post-matric education."},
            {"field": "attendance_percentage", "operator": "gte", "value": 75, "message": "At least 75% attendance is mandatory for the current year."},
            {"field": "receiving_other_scholarship", "operator": "eq", "value": False, "message": "The scheme page says benefit is not paid from the date another scholarship/stipend is accepted."},
            {"field": "cap_admission", "operator": "eq", "value": True, "message": "CAP admission is required for professional courses.", "required": False, "when": {"field": "course_type", "operator": "eq", "value": "Professional"}}
        ]
    },
    {
        "name": "Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna (EBC)",
        "description": "Tuition and exam fee reimbursement scheme for economically weaker students of Maharashtra.",
        "state": "Maharashtra",
        "source_url": MAHADBT_EBC_URL,
        "source_verified_on": "2026-10-05",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-12-31",
        "award_amount": 60000,
        "category": "Open",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Domicile Certificate", "Mark Sheet", "Fee Receipt", "CAP Allotment Letter"],
        "application_effort_hours": 4.5,
        "notes": "Official Maharashtra state scheme for Open/General category economically backward students with family income up to ₹8 lakh.",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "Applicant must be a Maharashtra domicile resident."},
            {"field": "category", "operator": "in", "value": ["Open", "EWS"], "message": "Applicant must belong to General (Open) or EWS category."},
            {"field": "annual_income", "operator": "lte", "value": 800000, "message": "Annual family income must not exceed ₹8,00,000."},
            {"field": "attendance_percentage", "operator": "gte", "value": 75, "message": "Minimum 75% attendance in the current academic year."},
            {"field": "receiving_other_scholarship", "operator": "eq", "value": False, "message": "Applicant should not be receiving any other full fee reimbursement scholarship."}
        ]
    },
    {
        "name": "Central Sector Scheme of Scholarships for College and University Students",
        "description": "Department of Higher Education scholarship scheme on National Scholarship Portal for meritorious students from low-income families.",
        "state": "All India",
        "source_url": NSP_CENTRAL_URL,
        "source_verified_on": "2026-09-28",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-11-20",
        "award_amount": 20000,
        "category": "All",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Class 12 Mark Sheet", "College Bonafide Certificate", "Aadhaar Linked Bank Passbook"],
        "application_effort_hours": 3.5,
        "notes": "Official Central scheme on NSP. Requires marks above 80th percentile in Class 12 board examination and gross family income up to ₹4.50 lakh.",
        "criteria": [
            {"field": "annual_income", "operator": "lte", "value": 450000, "message": "Gross parental/family annual income must not exceed ₹4,50,000."},
            {"field": "marks_percentage", "operator": "gte", "value": 80.0, "message": "Merit condition: Marks must be at or above 80% (top 20th percentile)."},
            {"field": "receiving_other_scholarship", "operator": "eq", "value": False, "message": "Cannot hold any other scholarship simultaneously."},
            {"field": "passed_previous_year", "operator": "eq", "value": True, "message": "Must have successfully passed previous qualifying examination."}
        ]
    },
    {
        "name": "Demo Merit Scholarship (Illustrative Only)",
        "description": "Fictional scholarship rules used to demonstrate inference and explanations. This is not a real scholarship.",
        "state": "All India",
        "source_url": "https://scholarships.gov.in/",
        "source_verified_on": "",
        "is_official": False,
        "is_active": True,
        "deadline": "2026-10-31",
        "award_amount": 30000,
        "category": "All",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Mark Sheet"],
        "application_effort_hours": 2.0,
        "notes": "DEMO ONLY — fictional criteria; do not use for a real application.",
        "criteria": [
            {"field": "marks_percentage", "operator": "gte", "value": 75, "message": "Demo rule: marks must be at least 75%."},
            {"field": "annual_income", "operator": "lte", "value": 500000, "message": "Demo rule: annual family income must be ₹5,00,000 or less."}
        ]
    }
]

def seed_schemes(db: Session):
    existing_count = db.query(Scholarship).count()
    if existing_count == 0:
        for item in SCHEMES:
            scheme = Scholarship(
                name=item["name"],
                description=item["description"],
                state=item["state"],
                source_url=item["source_url"],
                source_verified_on=item["source_verified_on"],
                is_official=item["is_official"],
                is_active=item["is_active"],
                criteria_json=json.dumps(item["criteria"]),
                notes=item["notes"],
                deadline=item.get("deadline", "2026-11-30"),
                award_amount=item.get("award_amount", 50000),
                category=item.get("category", "All"),
                course_level=item.get("course_level", "Post-Matric"),
                required_documents_json=json.dumps(item.get("required_documents", [])),
                application_effort_hours=item.get("application_effort_hours", 4.0),
            )
            db.add(scheme)
        db.commit()
    else:
        # Existing database has schemes (e.g. 2 schemes).
        # Check if we should add the additional official schemes if not present
        existing_names = {s.name for s in db.query(Scholarship).all()}
        added = False
        for item in SCHEMES:
            if item["name"] not in existing_names:
                scheme = Scholarship(
                    name=item["name"],
                    description=item["description"],
                    state=item["state"],
                    source_url=item["source_url"],
                    source_verified_on=item["source_verified_on"],
                    is_official=item["is_official"],
                    is_active=item["is_active"],
                    criteria_json=json.dumps(item["criteria"]),
                    notes=item["notes"],
                    deadline=item.get("deadline", "2026-11-30"),
                    award_amount=item.get("award_amount", 50000),
                    category=item.get("category", "All"),
                    course_level=item.get("course_level", "Post-Matric"),
                    required_documents_json=json.dumps(item.get("required_documents", [])),
                    application_effort_hours=item.get("application_effort_hours", 4.0),
                )
                db.add(scheme)
                added = True
        if added:
            db.commit()
