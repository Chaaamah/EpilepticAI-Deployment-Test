
import sys
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# Configuration (Hardcoded for testing based on your test_twilio.py success)
# We will use the environment variables if available, otherwise prompt or error
# The user already has them in .env loaded by the app, but running standalone requires load_dotenv or passing env.
# We will assume user runs this in same env or we load from .env file ourselves manually if needed.
# But simpler: rely on `app.core.config` if possible, but standalone script is safer to be self-contained.

# Let's try to load from app.core.config like test_twilio.py did
sys.path.insert(0, os.getcwd())
try:
    from app.core.config import settings
    ACCOUNT_SID = settings.TWILIO_ACCOUNT_SID
    AUTH_TOKEN = settings.TWILIO_AUTH_TOKEN
    FROM_PHONE = settings.TWILIO_PHONE_NUMBER
except ImportError:
    print("Could not load settings. Please run from backend directory.")
    sys.exit(1)

TO_PHONE = "+19293711061" # Number from screenshot

print(f"📧 Attempting to send SMS to {TO_PHONE}...")
print(f"📤 From: {FROM_PHONE}")

try:
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    
    body = "EpilepticAI Test: Can you read this? Reply YES."
    
    message = client.messages.create(
        body=body,
        from_=FROM_PHONE,
        to=TO_PHONE
    )
    
    print(f"\n✅ Message Accepted by Twilio!")
    print(f"🆔 SID: {message.sid}")
    print(f"📊 Status: {message.status}")
    print(f"🔗 Track delivery here: https://console.twilio.com/us1/monitor/logs/sms/{message.sid}")
    
    if message.error_code:
        print(f"⚠️ Error Code: {message.error_code}")
        print(f"⚠️ Error Message: {message.error_message}")
        
except TwilioRestException as e:
    print(f"\n❌ Twilio API Error:")
    print(f"  Code: {e.code}")
    print(f"  Message: {e.msg}")
    if e.code == 21608:
        print("  👉 This is a Trial Account restriction. You must verify the recipient number.")
        print("  👉 Verify here: https://console.twilio.com/us1/develop/phone-numbers/manage/verified")
    elif e.code == 30007:
        print("  👉 Carrier Filtering. Message content flagged.")
except Exception as e:
    print(f"\n❌ Unexpected Error: {e}")
