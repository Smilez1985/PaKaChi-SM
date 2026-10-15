# Prüfbericht 0.13.0

Stand: 15.10.2026. Meilenstein: Anbieterprofile und unabhängige Rollenzuordnung.

## Nachgewiesen

- `npm test`: 58 Tests bestanden, darunter fünf neue Tests für Anbieter-Konfiguration und Optionsoberfläche.
- `npm run build`: TypeScript und Vite erfolgreich. Bundle weiterhin groß: rund 1,23 MB / 335 kB gzip; keine neue Abhängigkeit hinzugefügt.
- Original-Erhaltungsprüfung innerhalb von `npm test` erfolgreich; keine Originalbilder verändert.
- Getrennte Rollen und mehrere Profile überstehen Speichern/Lesen. Löschen eines gemeinsam verwendeten Profils hebt ausschließlich betroffene Zuordnungen auf.
- Ungültige URLs, Zugangsdatenfelder, doppelte IDs und fehlende Profilreferenzen werden abgewiesen. Speicherfehler verändern den aktiven Stand nicht.
- Registry mit simulierten Adaptern: fehlender Adapter, falsches Modell, ungeeignete Rollenfähigkeit und Abbruch werden abgewiesen; kein Ersatzanbieter wird gewählt.
- DOM-Prüfung mit happy-dom: Profile anlegen, bearbeiten, zuordnen und entfernen; Sprachwechsel erhält Eingaben; Profilnamen werden als Text dargestellt. Fehler beim Speichern erhalten den Formularentwurf und die bisherige Zuordnung.

## Grenzen

Die UI-Prüfung verwendet DOM-Ereignisse, keinen gerenderten Browser. Visuelle Prüfung von Dialoggröße, Scrollen, Fokus und Bedienung auf dem Nutzergerät bleibt offen. Die bisherige Umgebung konnte Chromium nicht starten; dies wurde nicht als bestandene Browserprüfung gewertet.

Noch keine produktiven Netzwerkadapter: Es gab keine Verbindung zu Ollama, LM Studio oder einem Cloud-Anbieter, keinen OAuth-Login und keine reale Generierungs-/Rigging-Inferenz. Die Registry-Prüfung mit Testadaptern bestätigt keine Fähigkeiten konkreter Modelle. Python-MCP und separater Originalplayer-Test wurden in diesem Meilenstein nicht erneut ausgeführt; ihre letzten Nachweise bleiben im [Prüfstand](PRUEFUNG.md) ausgewiesen.

## Manuell nachprüfen

1. Optionen öffnen, drei Profile mit unterschiedlichen Namen und Modell-IDs anlegen und den drei Rollen zuordnen.
2. Dialog schließen und Seite neu laden; Profile und Zuordnungen kontrollieren.
3. Ein Profil bearbeiten und während eines Formularentwurfs Deutsch/English wechseln; Eingaben sollen erhalten bleiben.
4. Ein zugeordnetes Profil entfernen; nur dessen Rollenzuordnungen müssen leer werden.
5. Bei schmalem Fenster bis zum Schließen-Button scrollen. Keine neue Studio-Betriebsart und keine Netzwerkanfrage durch Profiländerungen erwarten.
