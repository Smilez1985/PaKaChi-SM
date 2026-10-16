# Anbieter und Modelle

**Stand 0.17.1.** Unter **Optionen → KI-Anbieter** lassen sich Profile unabhängig Assistent, 3D-Generator und Rigging-Dienst zuordnen. Alle Rollen dürfen im Zielbild lokal oder in der Cloud ausgeführt werden. Ein Profil kann mehrere Rollen bedienen, wenn dessen Adapter die benötigten Fähigkeiten nachweist.

1. Profilnamen und Schnittstelle wählen, API-Basisadresse eintragen.
2. Optional im dafür vorgesehenen Passwortfeld einen Bearer-Schlüssel eingeben.
3. Angezeigte Anfrageadresse prüfen und **Verbindung prüfen & Modelle laden** klicken. Es werden nur Modellmetadaten abgefragt, keine Bilder oder Prompts übertragen.
4. Modell aus der Antwort wählen oder seine ID manuell eintragen; Profil hinzufügen beziehungsweise Änderungen speichern.
5. Profile den drei Rollen unabhängig zuordnen. Bearbeiten und Entfernen sind möglich; Entfernen hebt nur betroffene Zuordnungen auf.

| Schnittstelle | Beispielbasis | Modellabfrage |
| --- | --- | --- |
| Ollama | `http://localhost:11434` | `/api/tags` |
| LM Studio | `http://localhost:1234/v1` | `/v1/models` |
| OpenAI-kompatibel | `https://example.com/v1` | `/v1/models` |
| Anthropic | `https://api.anthropic.com` | `/v1/models` |
| Eigener 3D-/Rigging-Dienst | Dienstabhängig | Noch kein Modelllistenadapter |

Bei OpenAI-kompatiblen APIs wird an einen vorhandenen Basispfad `/models` angehängt; ohne Basispfad wird `/v1/models` verwendet. Nicht jeder Anbieter verwendet dieses Protokoll. Anthropic verwendet seit 0.17.0 einen eigenen nativen Adapter; weitere abweichende APIs benötigen passende Adapter. OpenAI, DeepInfra und OpenRouter sind gewünschte Cloud-Anbindungen; die generische Modellabfrage ist keine vollständige Anbieterintegration.

## Verbindung und Zugangsdaten

Der Browser spricht die eingegebene Adresse direkt an. Der Dienst muss die App-Adresse per CORS erlauben. Bei Ollama wird dies über `OLLAMA_ORIGINS`, bei LM Studio über die Servereinstellungen eingerichtet. HTTPS-Seiten und Browserregeln für lokale Netze können lokale HTTP-Abfragen zusätzlich blockieren. Es gibt keinen versteckten Proxy und keinen automatischen Anbieterwechsel.

Schlüssel bleiben nur im geöffneten Dialog und werden bei Schließen, Profilwechsel, Speichern oder Änderung der Verbindung gelöscht. Sie landen weder im Browserspeicher noch in Projektdateien. Außerhalb von Loopback-Adressen wird ein Schlüssel nur über HTTPS gesendet. Keine Schlüssel in Profilnamen, Modell-IDs oder URLs eintragen. Dauerhafte geschützte Schlüsselverwaltung und offiziell unterstütztes OAuth sind noch offen; ein Chat-Abonnement bedeutet nicht automatisch API-Zugang.

Maximal 64 Profile werden unter `pakachi-providers-v1` im lokalen Browserspeicher abgelegt. Gespeichert werden ID, Name, Schnittstelle, Adresse, Modell-ID und Rollenzuordnungen. Andere Browser oder App-Adressen haben einen eigenen Stand. Projektdateien transportieren diese Einstellungen nicht. Ungültige Daten werden abgewiesen; bei Speicherfehlern bleiben zuvor aktive Daten und Entwurf erhalten.

## Was eine erfolgreiche Abfrage bedeutet

Die Verbindung hat eine gültige Modellliste geliefert. Das bestätigt weder Werkzeugaufrufe noch 3D-Generierung oder Rigging. Die Registry verlangt weiterhin die zur Rolle passende Fähigkeit und einen Ausführungsadapter. Seit 0.16.0 verwendet der separate Assistentenablauf Ollama und OpenAI-kompatible Chat-Endpunkte. Im Generator-/Rigging-Auftragskern sind weiterhin keine produktiven Ausführungsadapter registriert. Ein LLM darf künftig Fachwerkzeuge koordinieren; der vollständige Ablauf muss die Ergebnisse der jeweiligen Rolle liefern und prüfen.

Zeitlimit, Abbruch, Antwortgrößenbegrenzung und das Verwerfen verspäteter Antworten sind implementiert. Abbrechen beendet das lokale Warten; es bestätigt keinen serverseitigen Auftragsabbruch. Sprachwechsel Deutsch/English erhält eigene Namen.

[Lokale Einrichtung](LOKALE-MODELLE.md) · [Design](KONZEPT.md#11-studio-als-ki-harness-und-freie-anbieterwahl) · [Roadmap](ROADMAP.md)

Quellen: [Ollama Modellliste](https://docs.ollama.com/api/tags), [Ollama FAQ](https://docs.ollama.com/faq), [LM Studio Modelle](https://lmstudio.ai/docs/developer/openai-compat/models), [LM Studio Server](https://lmstudio.ai/docs/developer/core/server/settings).

[Assistent: Aufgaben und bestätigte Studio-Änderungen](ASSISTENT.md)

## Anthropic seit 0.17.0

Schnittstelle **Anthropic** wählen: Die Basisadresse `https://api.anthropic.com` wird seit 0.17.1 automatisch eingetragen und bleibt editierbar; auch `https://api.anthropic.com/v1` ist möglich. „Standardadresse einsetzen“ stellt den Vorgabewert wieder her. Einen zum gewünschten Workspace gehörenden API-Schlüssel in das Passwortfeld eintragen und Modellliste laden; keine Modellnamen werden fest vorgegeben. Anschließend das Profil der gewünschten Rolle zuordnen. Ausführbar ist derzeit der Assistent; eine Zuordnung zu Generator oder Rigging implementiert deren Fachverfahren noch nicht.

Der Adapter verwendet `x-api-key`, `anthropic-version: 2023-06-01` sowie für direkte Browseranfragen `anthropic-dangerous-direct-browser-access: true`. Der Schlüssel ist damit während des geöffneten Dialogs dem Browser zugänglich und wird ausschließlich an die angezeigte Adresse übertragen. Keine dauerhafte Speicherung, kein versteckter Proxy. Browser-CORS und Organisationsrichtlinien können den Zugriff verhindern; sie werden nicht umgangen. Credentials, die eine zusätzliche Workspace-Auswahl benötigen, sind noch nicht unterstützt. Einen Workspace-gebundenen API-Schlüssel verwenden.

Die Modellabfrage fordert maximal 1000 Einträge an. Meldet der Dienst weitere Seiten, wird die Antwort als unvollständig abgewiesen; eine bekannte Modell-ID kann weiterhin manuell eingegeben werden. Automatische Pagination und Workspace-Auswahl bleiben offen. Ein Claude-Chat-Abonnement wird nicht als API-Zugang behandelt; OAuth ist nicht implementiert.

Im Assistenten den Schlüssel separat eingeben und die Aufgabe ausdrücklich senden. Native `tool_use`-/`tool_result`-Nachrichten werden übersetzt, Vorschläge aber weiterhin erst nach Übernahme ausgeführt. Echte Anthropic-Konto-/Browserabnahme steht aus.

Quellen: [Authentifizierung](https://platform.claude.com/docs/en/manage-claude/authentication), [Modelle](https://platform.claude.com/docs/en/api/http/models/list), [Werkzeuge definieren](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools), [Werkzeugantworten](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls).

Seit 0.17.1: Auch Ollama und LM Studio erhalten editierbare Standardadressen. Beim Wechsel werden eigene Adressentwürfe je Schnittstelle erhalten. Die Modell-ID wird geleert, Schlüssel und alte Modellliste werden verworfen. Ein vorhandenes Profil zu öffnen oder die Sprache zu wechseln überschreibt seine Adresse nicht. Für generische OpenAI-kompatible und eigene Fachschnittstellen wird keine konkrete Anbieteradresse geraten.

## Anbietervorlagen seit 0.17.1

Unter **Anbietervorlage einsetzen** wird ausdrücklich eine Kombination aus Schnittstelle und Adresse übernommen. Anschließend bleibt die Adresse frei editierbar. Die Auswahl leert Modell-ID, Modellliste und Schlüssel und startet keine Netzwerkverbindung. Sie ersetzt den aktuellen Verbindungsentwurf; gespeicherte Profile ändern sich erst nach Speichern.

| Vorlage | Schnittstelle | Vorgabeadresse |
| --- | --- | --- |
| Anthropic | Anthropic | `https://api.anthropic.com` |
| OpenAI | OpenAI-kompatibel | `https://api.openai.com/v1` |
| OpenRouter | OpenAI-kompatibel | `https://openrouter.ai/api/v1` |
| DeepInfra | OpenAI-kompatibel | `https://api.deepinfra.com/v1/openai` |
| Ollama | Ollama | `http://localhost:11434` |
| LM Studio | LM Studio | `http://localhost:1234/v1` |

OpenAI, OpenRouter und DeepInfra verwenden den vorhandenen generischen Chat-Adapter. Das sind Einrichtungsvorlagen, keine neue vollständige Anbieterintegration: Nicht jedes gelistete Modell unterstützt das bestehende Chat-/Werkzeugformat. Konto, CORS, Modellfähigkeit und Parameterkompatibilität sind weiterhin real zu prüfen. Große Modellkataloge können an der vorhandenen Antwortgrenze scheitern; manuelle Modell-IDs bleiben möglich. Kein OAuth ergänzt.

Quellen: [OpenAI API](https://developers.openai.com/api/reference/overview), [OpenRouter](https://openrouter.ai/docs/community/frameworks), [DeepInfra](https://deepinfra.com/docs/openai_api).
