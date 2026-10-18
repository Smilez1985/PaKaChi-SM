# Prüfbericht 0.26.0

Zeitstempel: 2026-10-18T12:38:23+02:00 (Europe/Berlin)

- `npm test`: 147 Tests bestanden. Enthält Originaldatei-Erhaltung; 72 Transformationsbilder bleiben unverändert.
- `npm run build`: TypeScript und Produktionsbuild bestanden; bekannte Warnung zum gemeinsamen JS-Bundle bleibt bestehen.
- Sieben neue Tests: isolierte gültige Projektkopien und Namensgrenzen; fehlendes IndexedDB; Speichern/Laden und erneutes Mounten; fehlgeschlagene Speicherung; Revision/Dispose während des Lesens; bestätigtes Löschen; Erfolg erst nach Transaktionsabschluss sowie Abort und 50-Eintragsgrenze.
- DOM-Tests verwenden happy-dom und einen Speicher-Testdouble. Der IndexedDB-Vertrag wird mit einem gesonderten Transaktions-Testdouble geprüft. Kein Nachweis einer echten IndexedDB-Implementierung oder Persistenz über einen Browserneustart.
- Codeprüfung: Laden nutzt weiterhin den bestehenden GLB-/Projektpfad mit Revisionsschutz, vorbereiteter Installation und Modellwechsel-Verlauf. Sammlung speichert Kopien und verändert keine Originaldateien oder Anbieterprofile.
- Offen: echter Browserlauf mit F5, mehreren Tabs, privatem Modus und Kontingentfehlern; gerenderte Modellübernahme; GPU-Inferenz. Chromium-Start war zuvor durch einen verbotenen Socket-Systemaufruf blockiert und wurde für diesen Meilenstein nicht erneut versucht.
