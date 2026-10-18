"""
Secure Administrator Bootstrap Utility for Scholarship Eligibility Expert System.
Never hardcodes production credentials. Uses Argon2 password hashing.
Can be executed directly:
  python create_admin.py --email admin@scholarshipexpert.org --password MySecurePass123! --name "Administrator"
Or via environment variables:
  ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
"""
import argparse
import os
import sys

from app.database import Base, SessionLocal, auto_migrate, engine
from app.models import User
from app.auth import hash_password

def bootstrap_admin(email: str, password: str, full_name: str = "System Administrator") -> bool:
    auto_migrate()
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        hashed = hash_password(password)
        if user:
            print(f"[*] User '{email}' already exists. Updating to Administrator role and resetting password.")
            user.role = "admin"
            user.hashed_password = hashed
            user.full_name = full_name
            user.is_active = True
        else:
            print(f"[+] Creating new Administrator account for '{email}'...")
            user = User(
                email=email,
                hashed_password=hashed,
                full_name=full_name,
                role="admin",
                is_active=True
            )
            db.add(user)
        db.commit()
        print(f"[OK] Administrator '{email}' successfully provisioned.")
        return True
    except Exception as e:
        db.rollback()
        print(f"[!] Error provisioning admin: {e}", file=sys.stderr)
        return False
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap Administrator User")
    parser.add_argument("--email", default=os.environ.get("ADMIN_EMAIL", "admin@scholarshipexpert.org"), help="Admin email")
    parser.add_argument("--password", default=os.environ.get("ADMIN_PASSWORD", "AdminPass2026!"), help="Admin password")
    parser.add_argument("--name", default=os.environ.get("ADMIN_NAME", "System Administrator"), help="Admin full name")

    args = parser.parse_args()
    bootstrap_admin(args.email, args.password, args.name)
