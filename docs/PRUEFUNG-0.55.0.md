# Prüfbericht 0.55.0

**0.55.0:** Oberflächen-Einfluss eines Knochens lässt sich anteilig auf einen anderen übertragen. Mengenregler, Undo/Redo, Projekt-/Katalogpersistenz, gemischte Knochenänderungen und `transfer_weights` für Assistent/MCP sind vorhanden. Die Grundgeometrie bleibt erhalten; Posen werden mit `skin-weights` zur Prüfung markiert. 264 Node-Tests, Build und alle 17 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40217823978)).

Sechs gezielte Fälle prüfen Gewichtsverschmelzung, Grundgeometrie und veränderte posierte Haut; gemischte Topologie/Katalogexport/Move-Bindung; ungültige Eingaben und Rollback; Begrenzung auf vier normalisierte Einflüsse; UI/Agent mit Freigabe, Revision, Posenmarkierung und Undo; Mika mit echten Paletten und rekonstruierter Projektdatei. Node-MCP transportiert den Befehl; Python-Syntax geprüft. Ein Chromium-Fall prüft den Mausregler, Undo/Redo und Speichern/Laden.

Die Übertragung betrifft alle Vertices mit Quellgewicht, ohne räumlichen Malpinsel. Bei mehr als vier Einflüssen bleiben die vier stärksten, anschließend auf Summe 1 normalisiert; dadurch kann der effektive Anteil vom Reglerwert abweichen. Fehlende Zielpaletten, leere Quellen und ungültige Werte werden ohne bleibende Änderung abgewiesen. Manuelle Haut-/Bewegungsqualität und reale Anbieterabnahme bleiben offen.

Geprüfter Commit: `922a1a9db572f17e9788829ead348b1ecb992c26`. GitHub Actions bestätigt 264 Node-Tests (0 Fehler), erfolgreichen Build und alle 17 Chromium-Fälle in 4,1 Minuten. Der neue Fall prüft 30 % Übertragung von Mikas linkem Knie auf den linken Fuß einschließlich Undo/Redo und Wiederladen.
