# KI-Assistent

**Seit 0.16.0.** Der aufklappbare Bereich **KI-Assistent** liegt unterhalb der Agentensteuerung. Er ist kein dritter Studio-Modus.

1. Unter Optionen ein Profil der Rolle **Assistent** zuordnen. Unterstützte Schnittstellen: Ollama, LM Studio, OpenAI-kompatible Chat-API und seit 0.17.0 Anthropic Messages. Modell muss Werkzeugaufrufe beherrschen; eine Modellliste beweist dies nicht.
2. KI-Assistent öffnen und angezeigten Anbieter, Modell sowie Zieladresse prüfen. Optionalen API-Schlüssel in das Passwortfeld eingeben.
3. Aufgabe eingeben und ausdrücklich senden. Die Anfrage enthält die Aufgabe und Werkzeugbeschreibungen; bei Bedarf folgen Zustand und Studio-Metadaten. Keine Bilder oder Modellbytes werden übertragen. Ein Cloud-Dienst kann Gebühren berechnen.
4. Für Bearbeitung einen 3D-Avatar im Studio öffnen und **KI darf dieses Studio bearbeiten** aktivieren. Der Assistent kann Daten lesen und eine einzelne Änderung vorschlagen. Die JSON-Vorschau zeigt den konkreten Befehl.
5. **Vorgeschlagene Änderung übernehmen** führt den Befehl aus. Ohne Freigabe oder bei veraltetem Studio-Stand wird er abgewiesen. Änderungen bleiben über das vorhandene Undo rückgängig machbar.

Beispiel: „Lies den Studio-Stand und schlage vor, die gesamte Figur auf Größe 1,2 zu setzen.“ Das Modell muss zunächst Sitzung und Revision abfragen und anschließend einen passenden `update_point`-Befehl für `$figure` liefern. Eine reine Textantwort verändert nichts.

## Daten und Grenzen

Jede Aufgabe startet ohne Chatverlauf. Je Profil höchstens fünf Anfragen, vier lesende Werkzeugaufrufe und zwei Minuten Zeitlimit; höchstens ein Änderungsvorschlag pro Aufgabe. Ollama erhält 4096 Kontext und maximal 1024 Ausgabetokens. Größere Projekte oder komplexe Aufgaben können Kontext-/Antwortgrenzen erreichen. Es gibt keinen Neuversuch desselben Profils. Seit 0.18.0 werden bei definierten Anbieterfehlern die ausdrücklich konfigurierten Fallbacks in Reihenfolge versucht.

Schlüssel werden je Profil in der laufenden Seitensitzung gehalten. Schließen oder Profilwechsel löscht sie nicht; Neuladen der Seite hingegen schon; seit 0.19.0 kann ein optional gespeicherter verschlüsselter Tresor sie wiederherstellen. „Antwort und Schlüssel löschen“ entfernt den Schlüssel des aktuellen Profils ausdrücklich. Profile und Fallbacks bleiben im Browserspeicher. Abbrechen beendet lokales Warten; serverseitige Berechnung oder Kosten können weiterlaufen. Bei Abbruch oder Studio-Konflikt wird kein Fallback versucht.

Ollama nutzt `/api/chat`, LM Studio und OpenAI-kompatible Dienste nutzen `/chat/completions` relativ zur konfigurierten API-Basis. Browser-CORS muss passend eingerichtet sein. Außerhalb von Loopback wird ein Schlüssel nur über HTTPS gesendet. Kein Shell-, Datei- oder beliebiges Netzwerkwerkzeug wird dem Modell angeboten. Tool-Antworten und Modelltexte werden als Text dargestellt.

Der Assistent kann aktuell `get_state`, `get_studio` und Änderungsvorschläge über `edit_studio` verwenden. Er erzeugt weder 3D-Modelle noch Hautgewichte. Die freie lokale/Cloud-Anbieterwahl bleibt für alle drei Rollen bestehen; Generator und Rigging benötigen eigene Ausführungsadapter. OAuth, dauerhafte geschützte Schlüsselablage, Bildkontext und Mehrschrittvorschau sind offen.

Automatisierte Protokoll- und DOM-Prüfungen sind bestanden; eine echte Modellantwort, Qualität auf Zielhardware oder Cloud-Kontoabnahme wurde in dieser Entwicklung nicht getestet.

Quellen: [Ollama Chat-API](https://docs.ollama.com/api/chat), [LM Studio Werkzeugaufrufe](https://lmstudio.ai/docs/developer/openai-compat/tools).

[Anbieter](ANBIETER.md) · [Roadmap](ROADMAP.md) · [Prüfbericht](PRUEFUNG-0.16.0.md)

Anthropic nutzt nativ `/v1/messages` mit API-Schlüssel. Werkzeug- und Thinking-Blöcke bleiben für Folgerunden erhalten; nur Text wird angezeigt. Kein Extended-Thinking-Modus wird ausdrücklich angefordert. Bei ausgeschöpftem Tokenbudget wird die Antwort verworfen. [Einrichtung](ANBIETER.md#anthropic-seit-0170).

Seit 0.18.0 zeigt der Assistent die vollständige konfigurierte Route vor dem Senden und den tatsächlich antwortenden Anbieter danach. Schlüssel werden aus den jeweiligen Profilen übernommen. [Einrichtung und genaue Fallback-Regeln](ANBIETER.md).

Zum dauerhaften Speichern und späteren Entsperren der Profilschlüssel dient der optionale [Schlüsseltresor](ANBIETER.md#optionaler-schlüsseltresor-seit-0190). Der Assistent und seine Fallbacks verwenden danach dieselben Profilschlüssel ohne erneute Eingabe pro Anbieter.

Seit 0.20.0 bricht **Schlüsselsitzung sperren** den lokalen Assistentenlauf ab und verwirft offene/verspätete Vorschläge. Kein weiterer Fallback wird danach gestartet. Der Anbieter kann bereits gesendete Anfragen trotzdem weiterverarbeiten. Profile und Routen bleiben erhalten.
