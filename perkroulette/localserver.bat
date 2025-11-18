@echo off
cd /d "C:\Users\PC\Desktop\PerkRouletteLocal"

REM Lancer le serveur Python en tâche de fond sans fenêtre visible
start "" /B "C:\Users\PC\AppData\Local\Programs\Python\Python311\python.exe" -m http.server 7474

REM Attendre 60 secondes sans afficher quoi que ce soit
ping -n 61 127.0.0.1 >nul

REM Trouver et tuer le processus écoutant sur le port 7474
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7474') do taskkill /f /pid %%a
