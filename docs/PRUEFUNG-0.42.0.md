# Prüfbericht 0.42.0

- `npm test`: 233 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung (rund 1,33 MB / 369 kB gzip).
- Originaldateien-Erhaltungsprüfung einschließlich 72 Transformationsbildern besteht.

## Fünf neue Tests

1. Temporäre Folge wird kopiert und tatsächlich über Three.js/StudioRig gesampelt: abweichende Dauer, Zwischenposition, Seek und Pause; Bearbeitung während Wiedergabe gesperrt. Stopp stellt Figur, Daten, Revision und Undo-Status wieder her.
2. Automatisches Ende einer einmaligen Vorschau und ausdrücklicher Schleifenstopp stellen die Bearbeitungspose wieder her. Veraltete Aufräumfunktionen stoppen weder eine neuere Vorschau noch normale Wiedergabe.
3. Fehlende Moves/Posen, ungültige Folgen, fremde Sitzung, veraltete Revision, Ziehgesten und Rig-Modus werden vor dem Start abgewiesen.
4. Verlassen und Entsorgen des Editors beenden die Vorschau; beim Wiedereintritt bleibt die vorherige Bearbeitungspose erhalten.
5. Assistentenpanel startet Vorher/Nachher nur per Klick, beendet die vorherige Vorschau vor Wechsel/Übernahme und räumt bei Profilwechsel auf.

Tests nutzen reale Three.js-Transformationen und happy-dom. Keine gerenderte WebGL-/Mausabnahme und kein echter Anbieter-/MCP-Host-Lauf. Vorschau erfolgt lokal, je Move einzeln; keine geteilte 3D-Ansicht, keine automatische Korrektur und keine Änderung des MCP-Protokolls.
