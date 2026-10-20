# Prüfbericht 0.33.0

- `npm test`: 192 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run build`: TypeScript/Vite erfolgreich; bekannte Bundle-Warnung, rund 1,31 MB / 363 kB gzip.
- Erhaltungsprüfung: 83 Originaldateien einschließlich 72 Transformationsbildern unverändert.

## Neue und erweiterte Nachweise

Sieben neue Tests:

1. Nahe/ferne Ziele halten die Beugegrenzen einer Zweiglied-Kette ein. Anker und lokale Knochenverschiebungen bleiben erhalten; auch gleiche Minimum-/Maximumwerte werden geprüft.
2. Figurrotation und uniforme Skalierung; Entfernen einer Grenze stellt die bisherige Erreichbarkeit wieder her.
3. Projekt-/Befehlsvalidierung weist fehlerhafte Grenzen ab; Move-Kompatibilität erkennt geänderte Grenzen.
4. Setzen/Entfernen markiert gespeicherte Posen, ohne deren Transformationen zu ändern.
5. Editor mit happy-dom: Checkbox-/Reglerereignisse, Undo/Redo, freigegebene Agentenänderung; Pose-Modus weist Grenzänderungen ab.
6. Tatsächliche Mika-/Nori-Modelle: Ellenbogen und Knie halten Grenzwerte ein; berechnete skinned Vertexpositionen bewegen sich mit.
7. Katalogprojekt-Export erhält Grenzen und den neuen Prüfgrund.

Der vorhandene echte Node-MCP-Prozesstest prüft zusätzlich Transport von Grenzwerten und explizitem null. Python-Klassen wurden aus dem Quelltext mit Pydantic auf Schema/Serialisierung und Erkennung expliziten null geprüft; kein neuer Python-MCP-/MQTT-Livelauf. Die endgültige Bereichs-/Modusprüfung liegt im Studio-Router.

## Grenzen

Keine gerenderte Browser-/Mausabnahme. Die numerische Toleranz für den vollständig gestreckten Grenzfall beträgt im Test 0,00001 Grad. Geometrietests ersetzen keine anatomische Bewertung. Grenzen gelten nur für IK-Ziehen, nicht für direkte Drehung, Originalclips oder gespeicherte Moves. Keine automatischen Beugerichtungen, Twistgrenzen, Kollisionen oder Ganzkörper-IK. Ältere Software kann neue Prüfgründe ablehnen beziehungsweise Grenzen ignorieren.
