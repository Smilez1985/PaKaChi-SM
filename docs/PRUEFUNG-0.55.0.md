# Prüfbericht 0.55.0

**0.55.0:** Oberflächen-Einfluss eines Knochens lässt sich anteilig auf einen anderen übertragen. Mengenregler, Undo/Redo, Projekt-/Katalogpersistenz, gemischte Knochenänderungen und `transfer_weights` für Assistent/MCP sind vorhanden. Die Grundgeometrie bleibt erhalten; Posen werden mit `skin-weights` zur Prüfung markiert. Lokal bestanden 263 Tests im Gesamtlauf plus der anschließend ergänzte Mika-Test; Build bestanden. 17 Chromium-Fälle vorbereitet, neuer CI-Nachweis steht aus.

Sechs gezielte Fälle prüfen Gewichtsverschmelzung, Grundgeometrie und veränderte posierte Haut; gemischte Topologie/Katalogexport/Move-Bindung; ungültige Eingaben und Rollback; Begrenzung auf vier normalisierte Einflüsse; UI/Agent mit Freigabe, Revision, Posenmarkierung und Undo; Mika mit echten Paletten und rekonstruierter Projektdatei. Node-MCP transportiert den Befehl; Python-Syntax geprüft. Ein Chromium-Fall prüft den Mausregler, Undo/Redo und Speichern/Laden.

Die Übertragung betrifft alle Vertices mit Quellgewicht, ohne räumlichen Malpinsel. Bei mehr als vier Einflüssen bleiben die vier stärksten, anschließend auf Summe 1 normalisiert; dadurch kann der effektive Anteil vom Reglerwert abweichen. Fehlende Zielpaletten, leere Quellen und ungültige Werte werden ohne bleibende Änderung abgewiesen. Manuelle Haut-/Bewegungsqualität und reale Anbieterabnahme bleiben offen.
