"""
Test de connexion Twilio
"""
import sys
from pathlib import Path

# UTF-8 pour Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from twilio.rest import Client

print("="*60)
print("🧪 TEST CONNEXION TWILIO")
print("="*60)

# Vérifier les credentials
print(f"\n📋 Configuration:")
print(f"  Account SID: {settings.TWILIO_ACCOUNT_SID[:10]}... (masqué)")
print(f"  Auth Token: {'✅ Configuré' if settings.TWILIO_AUTH_TOKEN else '❌ Manquant'}")
print(f"  Phone Number: {settings.TWILIO_PHONE_NUMBER or '❌ Manquant'}")

# Tester la connexion
print(f"\n🔌 Test de connexion...")

try:
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    # Récupérer les infos du compte
    account = client.api.accounts(settings.TWILIO_ACCOUNT_SID).fetch()

    print(f"✅ CONNEXION RÉUSSIE !")
    print(f"\n📊 Informations du compte:")
    print(f"  Nom: {account.friendly_name}")
    print(f"  Status: {account.status}")

    # Vérifier le solde
    try:
        balance = client.balance.fetch()
        print(f"  💰 Solde: {balance.balance} {balance.currency}")
    except Exception as e:
        print(f"  ⚠️  Impossible de récupérer le solde: {e}")

    # Lister les numéros de téléphone
    print(f"\n📞 Numéros de téléphone disponibles:")
    incoming_numbers = client.incoming_phone_numbers.list(limit=10)

    if incoming_numbers:
        for number in incoming_numbers:
            print(f"  ✅ {number.phone_number} ({number.friendly_name})")
    else:
        print(f"  ⚠️  Aucun numéro trouvé. Tu dois en acheter un !")
        print(f"  👉 https://console.twilio.com/us1/develop/phone-numbers/manage/search")

    print(f"\n{'='*60}")
    print(f"✅ TWILIO EST PRÊT À ÊTRE UTILISÉ")
    print(f"{'='*60}")

except Exception as e:
    print(f"\n❌ ERREUR DE CONNEXION:")
    print(f"  {type(e).__name__}: {e}")
    print(f"\n💡 Solutions:")
    print(f"  1. Vérifie que TWILIO_ACCOUNT_SID est correct")
    print(f"  2. Vérifie que TWILIO_AUTH_TOKEN est correct")
    print(f"  3. Vérifie que tu as des crédits Twilio")
    print(f"  4. Console Twilio: https://console.twilio.com/")
