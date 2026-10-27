# Prüfbericht 0.63.0

**0.63.0:** Die optionale Checkbox „Pinsel nur auf sichtbare Oberfläche“ begrenzt Gewichtsaufträge auf geometrisch sichtbare Vertices im Blickfeld. Eine räumliche Suchstruktur prüft Verdeckung durch andere Dreiecke. Die Kamera wird pro Strich festgehalten und mit den Aufträgen gespeichert; Projekt-/Katalogexport und Undo/Redo reproduzieren die Auswahl. Assistent/MCP können `region.view` aus `get_studio.view` übernehmen.

281 Node-Tests, Build und alle 20 Chromium-Fälle bestanden ([CI-Nachweis](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40529588502)); Python-Syntax lokal geprüft. Der Browserimport mit 256 sichtgefilterten Aufträgen dauerte in diesem Lauf 8909 ms; Einzelmessung, keine allgemeine Laufzeitgarantie.

Zwei neue Node-Tests prüfen vordere/hintere Dreiecke, Kamerawechsel und eingefrorene Kamera, unveränderte verdeckte Vertices, Projekt-/Katalogreplay, Blickfeldgrenzen und ungültige Kameradaten. Der Node-MCP-Transporttest umfasst `region.view`. Der vorhandene Browser-Pinseltest aktiviert die Checkbox und prüft gespeicherte Kameradaten beim Undo/Redo und Wiederladen sowie beim langen Verlauf.

Sichtprüfung bezieht sich auf die ursprüngliche Grundpose. Dreiecke gelten beidseitig als undurchsichtige Hindernisse; Transparenz, Alpha-Ausschnitte und Materialgruppen-Sichtbarkeit werden nicht ausgewertet. Die erste Sichtprüfung baut eine Suchstruktur auf und benötigt zusätzlichen Speicher; große Modelle sind noch nicht manuell abgenommen. Ohne Checkbox gilt weiterhin der kugelförmige Pinsel. Projekte mit `region.view` benötigen mindestens 0.63.0.

## CI-Korrektur und Bestätigung

Der erste Lauf [40457475022](https://github.com/Smilez1985/PaKaChi-SM/actions/runs/40457475022) bestand 19 von 20 Browserfällen. Der Zwei-Tab-Test verglich zusätzlich die neue Kameraprojektion, die sich bei einer Änderung der Ansichtsgröße anpasst. Der korrigierte Test prüft weiterhin den vollständigen übrigen Studiozustand und die Kameraposition sowie eine endliche Projektionsmatrix. Keine Änderung des Anwendungscodes war erforderlich.

Geprüfter Commit: `388e4cd7aadd659e24f307140af9f78492442bf1`. Der Bestätigungslauf besteht alle 20 Browserfälle (5,0 Minuten), 281 Node-Tests und den Build.
