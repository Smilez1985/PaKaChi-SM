# Eigene Avatare im lokalen Model Zoo

Seit 0.26.0 speichert der Bereich **Eigene Avatare · lokal** im Player und Studio vollständige Projektkopien im Browser. Seit 0.28.0 erscheinen diese Einträge außerdem in der gemeinsamen Avatar-Auswahl und in `list_avatars`. Die Sammlung ergänzt die mitgelieferten Avatare; Original-PaKaChi und seine Referenzdateien werden nicht verändert.

## Speichern und laden

1. Einen 3D-Avatar oder ein Projekt laden und im Studio bearbeiten.
2. Unter **Name für neue Kopie** einen Namen mit höchstens 100 Zeichen eingeben.
3. **Kopie im Model Zoo speichern** legt einen neuen Eintrag an. Auch ein gleicher Name erzeugt eine weitere Kopie; vorhandene Einträge werden nicht überschrieben.
4. Eintrag auswählen und **Avatar laden** anklicken. Das Modell wird mit Studio-Daten über die vorhandene GLB-/Projektprüfung und abgesicherte Modellübernahme geöffnet. Die vorhandene Rückfrage zu ungespeicherten Änderungen gilt weiterhin.
5. **Gespeicherte Kopie löschen** entfernt nach Bestätigung nur diesen Eintrag. Ein bereits geladener Avatar bleibt erhalten.

Gesichert werden eingebettetes Modell, Avatarbeschreibung, vorhandene Clips/Zustandszuordnungen sowie Punkte, Verbindungen, Posen, Moves und Entwurfspose im bestehenden Projektformat 1. Die Speicherung verändert weder die aktuelle Figur noch deren Ungespeichert-Markierung. Weitere Bearbeitungen werden nicht automatisch nachgespeichert. Ein neuer Speichervorgang erzeugt eine neue Kopie.

## Speicherort und Grenzen

- IndexedDB im jeweiligen Browserprofil und unter der jeweiligen Webadresse (Origin). Nach F5 bleibt die Sammlung erhalten; eine andere Adresse, ein anderer Port oder Browser verwendet eine andere Sammlung.
- Bis zu 50 Einträge, höchstens 80 MiB JSON je Projekt; das Browserkontingent kann früher erreicht sein. Metadaten und Projekt werden gemeinsam in einer Schreibtransaktion gespeichert. Eine fehlgeschlagene Transaktion wird nicht als erfolgreich gemeldet.
- Nur Metadaten werden für die Auswahlliste geladen. Bei Änderungen in einem anderen Tab **Liste aktualisieren** verwenden.
- Browserdatenlöschung, privater Modus oder Speicherbereinigung können Einträge entfernen. **Projektdateien zusätzlich herunterladen und sichern.** Kein Backup, kein zugesicherter dauerhafter Speicher und keine Cloud-Synchronisierung.
- Der Original-Bildplayer ist keine bearbeitbare 3D-Projektdatei und kann hier nicht als neues 3D-Modell gespeichert werden.
- Gemeinsames Dropdown, Avatar-Karten, Zähler und `list_avatars` enthalten seit 0.28.0 auch gespeicherte Kopien. Die zusätzliche Verwaltung unter **Eigene Avatare · lokal** bleibt für Speichern/Löschen/Aktualisieren erhalten. Beim Laden bleibt die gespeicherte ID erhalten. Die Sammlung schreibt keine Dateien nach `public/model-zoo` und besitzt keinen gemeinsamen Veröffentlichungsweg.
- Nach dem Löschen bleibt eine bereits geladene Kopie unter ihrer ID als **Nur diese Sitzung** sichtbar und steuerbar. Nach Wechsel zu einer anderen Figur ist sie ohne Sicherungsdatei nicht erneut ladbar; der begrenzte Modellwechsel-Verlauf kann sie innerhalb derselben Sitzung noch enthalten.
- Katalogabfragen liefern nur IDs, Namen und Auswahlstatus. Fähigkeiten und Moves gibt es weiterhin nur für den tatsächlich geladenen Avatar. Ein Agent kann über diese Ergänzung keinen Modellwechsel auslösen.
- Während einer Speicher-/Ladeoperation ist die gemeinsame Auswahl vorübergehend gesperrt. Das verhindert konkurrierende Auswahlen während des Lesens einer gespeicherten Kopie.
- Während einer Studio-Geste oder eines Modellwechsels ist Speichern/Laden blockiert. Eine Projektänderung während des asynchronen Lesens verhindert die Übernahme des veralteten Ladevorgangs.

## Prüfstand

DOM-Verhalten und Projektkopien sind automatisiert geprüft; IndexedDB-Commit, Abort und Eintragsgrenze sind mit einem Transaktions-Testdouble geprüft. Eine echte Browserprüfung der Persistenz über F5, Kontingentfehler und mehrere Tabs steht aus. Die bisherige Umgebung konnte Chromium wegen einer Socket-Beschränkung nicht starten.
