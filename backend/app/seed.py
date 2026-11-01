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
    },
    {
        "name": "Government of India Post-Matric Scholarship for SC Students (Maharashtra)",
        "description": "Comprehensive tuition fee waiver and maintenance allowance for Scheduled Caste (SC) students pursuing recognized post-matriculation courses.",
        "state": "Maharashtra",
        "source_url": "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51AB02E984835E89FEFF518F45DE932A0F5DC575A384BF70DA5",
        "source_verified_on": "2026-10-12",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-12-31",
        "award_amount": 55000,
        "category": "SC",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Caste Certificate", "Caste Validity Certificate", "Domicile Certificate", "Mark Sheet", "Fee Receipt"],
        "application_effort_hours": 5.5,
        "notes": "Centrally sponsored scheme administered by the Department of Social Justice & Special Assistance, Government of Maharashtra. Family annual income ceiling ₹2,50,000.",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "Applicant must be a Maharashtra domicile resident."},
            {"field": "category", "operator": "eq", "value": "SC", "message": "Applicant must belong to Scheduled Caste (SC) category."},
            {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Annual family income must not exceed ₹2,50,000."},
            {"field": "attendance_percentage", "operator": "gte", "value": 75, "message": "Mandatory minimum 75% attendance during the academic term."},
            {"field": "receiving_other_scholarship", "operator": "eq", "value": False, "message": "Cannot hold any other scholarship or fellowship simultaneously."}
        ]
    },
    {
        "name": "Post Matric Scholarship Scheme for ST Students (Maharashtra)",
        "description": "Educational financial support covering compulsory fees and maintenance costs for Scheduled Tribe (ST) students in Maharashtra.",
        "state": "Maharashtra",
        "source_url": "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51AB02E984835E89FEF6A88B468C7210928CF41E79A81467AC0",
        "source_verified_on": "2026-10-12",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-12-31",
        "award_amount": 50000,
        "category": "ST",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Caste Certificate", "Tribe Validity Certificate", "Domicile Certificate", "Mark Sheet", "Fee Receipt"],
        "application_effort_hours": 5.0,
        "notes": "Administered by the Tribal Development Department of Maharashtra for higher and professional education with income ceiling of ₹2.5 Lakh.",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "Applicant must be a Maharashtra domicile resident."},
            {"field": "category", "operator": "eq", "value": "ST", "message": "Applicant must belong to Scheduled Tribe (ST) category."},
            {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Parental annual income must be ₹2,50,000 or less."},
            {"field": "attendance_percentage", "operator": "gte", "value": 75, "message": "Minimum 75% attendance is required."},
            {"field": "receiving_other_scholarship", "operator": "eq", "value": False, "message": "Applicant cannot hold multiple state/central scholarship benefits."}
        ]
    },
    {
        "name": "Dr. Panjabrao Deshmukh Vastigruh Nirvah Bhatta Yojna (Hostel Allowance)",
        "description": "Hostel maintenance allowance for children of registered agricultural laborers and marginal landholders pursuing professional higher education in Maharashtra.",
        "state": "Maharashtra",
        "source_url": "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51AB02E984835E89FEF7870A0699BE17454A66B96D76DF51BD5",
        "source_verified_on": "2026-10-14",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-12-15",
        "award_amount": 30000,
        "category": "All",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Domicile Certificate", "CAP Allotment Letter", "Mark Sheet", "Fee Receipt"],
        "application_effort_hours": 4.0,
        "notes": "MahaDBT scheme providing ₹30,000/year for students in MMRDA/Pune municipal areas or ₹20,000 for other districts for hostel maintenance.",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "Applicant must be a resident of Maharashtra state."},
            {"field": "annual_income", "operator": "lte", "value": 800000, "message": "Annual family income must not exceed ₹8,00,000."},
            {"field": "course_type", "operator": "eq", "value": "Professional", "message": "Must be enrolled in an approved technical/professional degree course."},
            {"field": "cap_admission", "operator": "eq", "value": True, "message": "Admission must have been secured via the Centralized Admission Process (CAP)."},
            {"field": "attendance_percentage", "operator": "gte", "value": 75, "message": "75% attendance record is mandatory."}
        ]
    },
    {
        "name": "AICTE Pragati Scholarship Scheme for Girl Students (Technical Degree/Diploma)",
        "description": "Government of India AICTE initiative to empower young women pursuing technical education (Engineering/Technology degree or diploma).",
        "state": "All India",
        "source_url": "https://www.aicte-india.org/schemes/students-development-schemes/Pragati",
        "source_verified_on": "2026-10-01",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-11-25",
        "award_amount": 50000,
        "category": "All",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Class 12 Mark Sheet", "College Bonafide Certificate", "CAP Allotment Letter", "Aadhaar Card"],
        "application_effort_hours": 4.0,
        "notes": "Provides ₹50,000 per annum for tuition fees, computer, books, and equipment for girls admitted to 1st year of AICTE approved technical degrees.",
        "criteria": [
            {"field": "annual_income", "operator": "lte", "value": 800000, "message": "Total family annual income must not exceed ₹8,00,000."},
            {"field": "course_type", "operator": "eq", "value": "Professional", "message": "Course must be an approved technical or engineering degree/diploma."},
            {"field": "cap_admission", "operator": "eq", "value": True, "message": "Must have been admitted through centralized entrance/CAP counseling."},
            {"field": "marks_percentage", "operator": "gte", "value": 60.0, "message": "Minimum 60% aggregate in qualifying examination."},
            {"field": "receiving_other_scholarship", "operator": "eq", "value": False, "message": "Cannot hold another scholarship for tuition or maintenance."}
        ]
    },
    {
        "name": "State Minority Scholarship Scheme Part II (Higher & Technical Education)",
        "description": "Government of Maharashtra scholarship for meritorious students from notified minority communities (Muslim, Christian, Sikh, Buddhist, Jain, Parsi, Jewish).",
        "state": "Maharashtra",
        "source_url": "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51AB02E984835E89FEFD7FE7EBEC7CFB77E235F8E26FF5DA2F8",
        "source_verified_on": "2026-10-08",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-12-20",
        "award_amount": 25000,
        "category": "Minority",
        "course_level": "Post-Matric",
        "required_documents": ["Income Certificate", "Domicile Certificate", "Mark Sheet", "Fee Receipt", "College Bonafide Certificate"],
        "application_effort_hours": 3.5,
        "notes": "MahaDBT Minority Development Department scheme offering up to ₹25,000 or actual tuition fee for higher education.",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "Applicant must be a Maharashtra domicile resident."},
            {"field": "category", "operator": "eq", "value": "Minority", "message": "Applicant must belong to a notified religious minority community."},
            {"field": "annual_income", "operator": "lte", "value": 800000, "message": "Annual family income must not exceed ₹8,00,000."},
            {"field": "marks_percentage", "operator": "gte", "value": 50.0, "message": "Minimum 50% marks in the preceding qualifying examination."},
            {"field": "attendance_percentage", "operator": "gte", "value": 75, "message": "Minimum 75% attendance in current academic year."},
            {"field": "receiving_other_scholarship", "operator": "eq", "value": False, "message": "Cannot receive any other scholarship concurrently."}
        ]
    },
    {
        "name": "Prime Minister's Scholarship Scheme (PMSS) for CAPF & Assam Rifles",
        "description": "Scholarship encouraging higher technical and professional education for dependent wards & widows of Central Armed Police Forces & Assam Rifles personnel.",
        "state": "All India",
        "source_url": "https://scholarships.gov.in/public/schemeGuidelines/WARB_PMSS_Guidelines.pdf",
        "source_verified_on": "2026-09-30",
        "is_official": True,
        "is_active": True,
        "deadline": "2026-11-15",
        "award_amount": 36000,
        "category": "All",
        "course_level": "Post-Matric",
        "required_documents": ["Class 12 Mark Sheet", "College Bonafide Certificate", "CAP Allotment Letter", "Aadhaar Linked Bank Passbook"],
        "application_effort_hours": 4.0,
        "notes": "NSP Central scheme providing ₹3,000/month for girls (₹36,000/yr) and ₹2,500/month for boys (₹30,000/yr) for approved professional degree courses.",
        "criteria": [
            {"field": "course_type", "operator": "eq", "value": "Professional", "message": "Scheme is only applicable to first professional degree courses (Engineering, Medical, Dental, Nursing, etc.)."},
            {"field": "marks_percentage", "operator": "gte", "value": 60.0, "message": "Minimum 60% marks in Class 12 (or Diploma for direct 2nd-year lateral entry)."},
            {"field": "passed_previous_year", "operator": "eq", "value": True, "message": "Must have successfully passed previous academic year without backlogs."},
            {"field": "receiving_other_scholarship", "operator": "eq", "value": False, "message": "Cannot receive another central or state scholarship."}
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
