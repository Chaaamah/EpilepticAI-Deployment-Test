"""
Crée un utilisateur admin dans la base de données
"""
import sys
from pathlib import Path

# UTF-8 pour Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()

try:
    # Vérifier si l'admin existe déjà
    existing_admin = db.query(User).filter(User.email == "admin@test.com").first()

    if existing_admin:
        print("✅ Admin existe déjà: admin@test.com")
    else:
        # Créer l'admin
        admin_user = User(
            email="admin@test.com",
            full_name="Admin Test",
            hashed_password=get_password_hash("Admin123!"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            is_superuser=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("✅ Admin créé avec succès!")
        print(f"   Email: admin@test.com")
        print(f"   Password: Admin123!")
        print(f"   ID: {admin_user.id}")

except Exception as e:
    print(f"❌ Erreur: {e}")
    db.rollback()
finally:
    db.close()
