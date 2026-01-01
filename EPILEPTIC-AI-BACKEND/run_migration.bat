@echo off
REM Script pour exécuter la migration SQL
REM Ajustez les paramètres de connexion selon votre configuration

set PGPASSWORD=yourpassword
psql -U postgres -d epileptic_ai -f add_missing_columns.sql

pause
