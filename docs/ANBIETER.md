# Anbieter, Modelle und Fallbacks

**Stand 0.22.0.** Alle Anbieter können gleichzeitig eingerichtet bleiben. Ein Profil bezeichnet eine konkrete Kombination aus Anzeigename, Schnittstelle, API-Adresse und Modell. Für mehrere Modelle desselben Anbieters mehrere Profile anlegen. Alle Profile lassen sich unabhängig den Rollen **Assistent**, **3D-Generator** und **Rigging-Dienst** zuordnen.

## Einrichtung

1. **Anbietervorlage einsetzen** wählen oder eigene Schnittstelle und Adresse angeben. Adressen bleiben editierbar.
2. Profilname, Modell und gegebenenfalls API-Schlüssel eintragen. **Verbindung prüfen & Modelle laden** fragt ausschließlich Modellmetadaten ab; eine Modell-ID darf auch manuell eingetragen werden.
3. **Profil hinzufügen** beziehungsweise **Änderungen speichern**. Weitere Profile hinzufügen, ohne vorhandene Verbindungen zu entfernen.
4. Für jede Rolle das Hauptprofil wählen. Mit **Fallback hinzufügen** weitere Profile anhängen; ↑/↓ bestimmt deren Reihenfolge. Eine Rolle kann dieselben Profile in anderer Reihenfolge verwenden.
5. Ein Profil bearbeiten oder zwischen Anbietern wechseln: Modell- und Schlüsselentwürfe bleiben erhalten. Nur die aktive Modellliste und laufende Abfrage werden verworfen, damit verspätete Antworten nicht zur falschen Verbindung gehören.

| Vorlage | Schnittstelle | Vorgabeadresse |
| --- | --- | --- |
| Anthropic | Anthropic | `https://api.anthropic.com` |
| OpenAI | OpenAI-kompatibel | `https://api.openai.com/v1` |
| OpenRouter | OpenAI-kompatibel | `https://openrouter.ai/api/v1` |
| DeepInfra | OpenAI-kompatibel | `https://api.deepinfra.com/v1/openai` |
| Ollama | Ollama | `http://localhost:11434` |
| LM Studio | LM Studio | `http://localhost:1234/v1` |

Eigene 3D-/Rigging-Dienste bleiben zusätzlich konfigurierbar. Die Vorlagen starten keine Anfrage und bescheinigen keine Modellfähigkeit. Generische APIs verwenden `/models` und `/chat/completions` relativ zur konfigurierten Basis; Ollama `/api/tags` und `/api/chat`.

## Schlüssel und Speicherung

Profilkonfiguration und Rollenzuordnungen einschließlich Fallback-Reihenfolge bleiben im lokalen Browserspeicher. Das bestehende Profilformat wurde um optionale Fallback-Listen erweitert; ältere Konfigurationen sind weiterhin lesbar. Klartextschlüssel stehen nicht darin und nicht in Projektdateien; optional werden sie seit 0.19.0 in einer getrennten verschlüsselten Ablage gespeichert.

API-Schlüssel bleiben **je Profil und tatsächlichem Endpunkt im Arbeitsspeicher der laufenden Seite**. Sie werden beim Bearbeiten wieder angezeigt und vom Assistenten für genau dieses Profil verwendet. Dialogschluss, Wechsel zum anderen Anbieter und Rollenumstellung löschen sie nicht. Ein Schlüssel wird nicht automatisch an eine neu eingetragene Adresse übertragen; beim Zurückwechseln steht der ursprüngliche Schlüssel wieder bereit. „Schlüssel vergessen“ und Entfernen eines Profils sind ausdrückliche Löschaktionen. Beim Neuladen/Beenden der Seite gehen Sitzungsschlüssel verloren; ein optional gespeicherter Tresor kann sie anschließend wiederherstellen.

Nach dem Bearbeiten eines gespeicherten Schlüssels im Optionsdialog diesen Dialog schließen oder Profil speichern, damit der Assistent ihn verwendet. Unterschiedliche Profile können unterschiedliche Schlüssel besitzen, auch beim gleichen Anbieter. Rollen können ein Profil und damit dessen Schlüssel gemeinsam verwenden.

## Fallback-Verhalten

Die Reihenfolge lautet Hauptprofil → erster Fallback → zweiter Fallback usw. Im Assistenten wird die vollständige Route vor dem Senden angezeigt. Das ausdrückliche Senden autorisiert diese konfigurierte Route, auch wenn sie lokale und Cloud-Profile kombiniert. Jeder Kandidat wird höchstens einmal versucht; aktuelle und erfolgreiche Anbieter werden angezeigt. Schlüssel, Profile und Reihenfolge werden für den Auftrag festgehalten.

Der Assistent wechselt bei Netzwerk-/HTTP-Fehlern, fehlender Anmeldung, Zeitlimit, leerer/abgeschnittener Antwort oder nicht unterstütztem Adapter zum nächsten eingetragenen Profil. Bei Abbruch, veraltetem Studio-Stand oder ungültigen Werkzeugbefehlen erfolgt **kein** Fallback. Pro Profil gelten bis zu fünf API-Runden; ein Zeitlimit kann serverseitige Arbeit nicht zurücknehmen. Deshalb können fehlgeschlagene Cloud-Versuche bereits Kosten verursacht haben. Keine zusätzlichen Anbieter außerhalb der konfigurierten Liste werden gewählt.

Für Generator und Rigging werden eigene Routen gespeichert. Seit 0.21.0 gibt es einen separat registrierbaren lokalen TripoSR-Adapter für den Auftragskern; seit 0.22.0 ist seine Studio-Bedienoberfläche angeschlossen. Rigging-Fallbacks sind noch nicht integriert. Für den Generator gilt seit 0.25.0 das unten beschriebene Prüfungs-/Wiederholungsverhalten. [Lokaler Dienst](KI-GENERIERUNG.md#lokaler-generierungsdienst-seit-0210). Eine Rollenzuordnung macht aus einem Sprachmodell keinen Fachgenerator.

## Anthropic und Verbindungsgrenzen

Anthropic verwendet `x-api-key`, `anthropic-version: 2023-06-01` und den Header für direkten Browserzugriff. Workspace-gebundene API-Schlüssel verwenden; zusätzliche Workspace-Auswahl ist noch offen. `/v1/models` fordert höchstens 1000 Einträge an; eine unvollständige Antwort wird abgewiesen. Modell-ID dann gegebenenfalls manuell eintragen. OAuth ist noch nicht umgesetzt; ein Chat-Abonnement bedeutet nicht automatisch API-Zugang.

Der Browser spricht die angezeigte Adresse direkt an. CORS muss vom Dienst erlaubt werden; bei Ollama über `OLLAMA_ORIGINS`, bei LM Studio über die Servereinstellungen. Organisationsrichtlinien werden nicht umgangen. Schlüssel außerhalb von Loopback erfordern HTTPS. Große Modelllisten können an Antwortgrenzen scheitern. Echte Modell-/Konto-/Browserabnahme bleibt offen.

[Assistent](ASSISTENT.md) · [Design](KONZEPT.md) · [Roadmap](ROADMAP.md)

## Optionaler Schlüsseltresor seit 0.19.0

1. Anbieterprofile und Schlüssel einrichten; Profile zuerst speichern.
2. Unter **Schlüsseltresor** eine eigene lange Passphrase (12–1024 Zeichen) eingeben, beim erstmaligen Speichern wiederholen und **Schlüssel verschlüsselt speichern** wählen.
3. Nach Seitenneustart dieselbe App-Adresse öffnen, unter Optionen das Tresorpasswort eingeben und **Gespeicherte Schlüssel entsperren** wählen. Gespeicherte Schlüssel werden den weiterhin passenden Profilen und Endpunkten zugeordnet. Neuere Sitzungsschlüssel werden dabei nicht überschrieben.
4. Neue/geänderte Schlüssel und bewusste Löschungen mit **Schlüssel verschlüsselt speichern** erneut übernehmen. Ein bestehender Tresor erfordert sein bisheriges Passwort. Unbekannte Sitzungsschlüssel werden aus dem vorhandenen Tresor erhalten; entfernte Profile oder geänderte Zieladressen werden beim Speichern ausgesondert.

Ohne Tresor bleibt die bisherige reine Sitzungsnutzung möglich. Ein falsch eingegebenes Passwort, beschädigter Tresor, fehlgeschlagenes Speichern oder zwischenzeitlich geänderte Profile ersetzen die vorhandene Ablage nicht. Dialogschluss verwirft noch laufende Tresoraktionen vor deren Übernahme und leert die Passwortfelder.

Die Ablage verwendet Web Crypto: AES-256-GCM mit zufälliger 96-Bit-IV und authentifiziertem Formatkontext; PBKDF2-HMAC-SHA-256 mit 600.000 Iterationen und zufälligem 128-Bit-Salt. Im Browserspeicher liegen nur Formatparameter und verschlüsselter Inhalt unter `pakachi-credential-vault-v1`. Das Passwort wird weder gespeichert noch an Anbieter gesendet. Standardbibliotheken führen die Kryptografie aus; kein eigenes Verschlüsselungsverfahren.

Die Verschlüsselung schützt die gespeicherte Ablage. Während der Nutzung liegen entschlüsselte Schlüssel im Arbeitsspeicher; sie schützt nicht vor schädlichem Code im bereits entsperrten Browser. Browserdaten löschen entfernt auch den Tresor. Andere Browser/Origins haben eigene Ablagen. Kein Passwortreset vorhanden; ohne Passwort können gespeicherte Schlüssel nicht wiederhergestellt werden. Ein schwaches Passwort bleibt angreifbar. Seit 0.20.0 beendet „Schlüsselsitzung sperren“ die aktive Schlüsselsitzung ausdrücklich.

[MDN Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey) · [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

### Passwort wechseln (0.20.0)

Im Tresorbereich das **bisherige Tresorpasswort**, das **neue Tresorpasswort** und dessen Wiederholung eingeben, dann **Tresorpasswort ändern** wählen. Das bisherige Passwort muss stimmen; das neue benötigt ebenfalls 12–1024 Zeichen. Erst nach erfolgreicher Neuverschlüsselung wird die Ablage ersetzt. Danach entsperrt nur noch das neue Passwort diesen Tresor.

Der gesamte bisher gespeicherte Schlüsselbestand bleibt erhalten, unabhängig von ungespeicherten Änderungen der aktuellen Sitzung. Diese bei Bedarf anschließend separat mit dem neuen Passwort speichern. Bei falschem Passwort, abweichender Bestätigung, Speicherfehler oder zwischenzeitlicher Änderung bleiben die bisherigen verschlüsselten Daten erhalten. Ein Passwortwechsel ist keine Wiederherstellung eines vergessenen Passworts. Bereits früher kopierte Tresordateien werden dadurch nicht nachträglich geändert.

### Schlüsselsitzung sperren (0.20.0)

**Schlüsselsitzung sperren** leert alle aktuell verwendbaren Profilschlüssel, Schlüsselentwürfe und Tresorpasswortfelder. Laufende Modelllistenabfragen und Assistentenaufrufe werden lokal abgebrochen; offene Änderungsvorschläge und verspätete Antworten verworfen. Eine noch laufende Entsperrung, Speicherung oder Passwortänderung darf danach keine Daten übernehmen.

Profilnamen, Modellwahl, Adressen, Fallback-Reihenfolgen und verschlüsselte Ablage bleiben unverändert. Gespeicherte Schlüssel lassen sich anschließend mit dem Tresorpasswort wieder entsperren. **Nicht in den Tresor gespeicherte Schlüssel werden verworfen.** Neue Schlüssel können nach dem Sperren auch manuell eingegeben werden; die Sperre ist keine Anwendungssperre. Lokale Dienste ohne Anmeldung sind weiterhin nutzbar.

Bereits an einen Anbieter gesendete Anfragen können dort weiterlaufen und Kosten verursachen. Die Funktion entfernt die Schlüssel aus dem verwendbaren Sitzungszustand; eine garantierte physische Überschreibung aller Kopien im JavaScript-/Browser-Speicher wird nicht zugesichert. Die Sperre betrifft die aktuelle Seite, nicht andere gleichzeitig geöffnete Tabs.

## Generator-Fallbacks (0.25.0)

Die Studio-Oberfläche zeigt vor dem Start die vollständige konfigurierte Generatorroute. Profile, Reihenfolge, Bild, Zielrevision und Schlüssel je Profil werden für diesen Versuch festgehalten. Nicht unterstützte oder nicht erreichbare Profile werden ausschließlich während der Fähigkeitsprüfung übersprungen. Jede Prüfung hat ein Zeitlimit von zehn Sekunden; verspätete Antworten starten keinen Auftrag. Unmittelbar vor der Ausführung wird die Studio-Zielrevision erneut geprüft.

Nach Beginn einer Generierung gibt es keinen automatischen weiteren Auftrag, auch nicht bei Zeitlimit oder ungültigem Ergebnis. Falls weitere Profile vorhanden sind, bietet **Nächsten Anbieter versuchen** einen ausdrücklich ausgelösten neuen Versuch mit der verbleibenden Route an. Der vorherige Dienst könnte noch arbeiten. Ein Fehler beim Anzeigen der Vorschau bietet keinen Anbieterwechsel an. Projektänderungen sperren die Wiederholung; Änderungen an Profilen/Schlüsseln, Tresorsperre, Abbruch oder Bildwechsel verwerfen sie.

Der ausführbare Fachadapter bleibt der lokale TripoSR-Dienst. Cloud-Generatoren und automatische Rigging-Dienste sind damit noch nicht implementiert. Bestehende Profile und gespeicherte Schlüssel werden nicht gelöscht.
