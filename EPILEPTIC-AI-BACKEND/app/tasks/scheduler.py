import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

# Exemple : Tâche toutes les 5 minutes
@scheduler.scheduled_job('interval', minutes=5)
def check_seizure_alerts():
    """Vérifie les alertes de crise et envoie les notifications"""
    logger.info("Vérification des alertes de crise...")
    # Votre logique ici

@scheduler.scheduled_job('interval', minutes=30)
def cleanup_old_sessions():
    """Nettoie les anciennes sessions"""
    logger.info("Nettoyage des sessions...")
    # Votre logique ici

def start():
    """Démarre le scheduler"""
    if not scheduler.running:
        scheduler.start()
        logger.info("✅ Scheduler démarré")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        scheduler.shutdown()
        logger.info("❌ Scheduler arrêté")

if __name__ == "__main__":
    start()