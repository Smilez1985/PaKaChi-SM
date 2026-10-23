# Avatar-Studio – 0.24.0

Das Studio ist Teil des Players. Mika, Nori und eigene GLB-Modelle können bearbeitet werden. Der Original-PaKaChi bleibt mit beiden Formen und 72 Bildern erhalten; für ihn fehlt weiterhin das entsprechende 3D-Modell. Seine Bilder werden durch den Editor nicht verändert.

## Eine erste eigene Bewegung

1. Im Player einen 3D-Avatar auswählen und **Avatar-Studio** öffnen. Die laufende Animation hält an und die Grundpose wird angezeigt.
2. In **Figur bewegen** einen Skelettpunkt anklicken oder aus der Liste wählen. Den Punkt direkt oder an einem farbigen Achsgriff ziehen. Verbundene Skelettpunkte beugen dabei die Kette mit erhaltenen Knochenlängen. Unter **Griffe → Drehen** lässt sich ein Skelettpunkt drehen; seine gebundenen Körperteile folgen. X/Y/Z ermöglichen genaue Positionen.
3. Einen Posennamen eingeben und **Aktuelle Pose speichern** wählen. Figur verändern und eine zweite Pose speichern.
4. Die Übergangszeit jeder Pose festlegen. Mit **Früher/Später** wird die Reihenfolge für die nächste gespeicherte Bewegung geändert. **Anzeigen** lädt eine Pose; **Ersetzen** übernimmt die aktuelle Haltung.
5. Bewegungsname und eindeutiges Schlagwort eingeben, z. B. `laecheln`. **Bewegung speichern** übernimmt alle Posen in der angezeigten Reihenfolge. Eine Bewegung benötigt mindestens zwei Posen. Optional läuft sie als Schleife.
6. **Vorschau** abspielen oder zurück zum Player wechseln. Die eigene Bewegung steht dort in der Bewegungslegende und über MQTT/MCP zur Verfügung.
7. **Speichern** lädt eine `.pakachi.json`-Projektdatei herunter. Sie enthält das ursprüngliche Modell, das bearbeitete Kontrollsystem, die aktuelle Arbeitspose, gespeicherte Posen und Bewegungen. **Projekt laden** öffnet diese Datei später wieder vollständig, auch ohne die ursprüngliche GLB-Datei.

Die Zeit der ersten Pose bestimmt bei Schleifen den Rückweg von der letzten zur ersten Pose. Bei einmaligen Bewegungen startet die erste Pose sofort; die folgenden Zeiten bestimmen die jeweiligen Übergänge. Nach einer einmaligen Bewegung im Player folgt wieder der aktive Grundzustand. Eigene Bewegungen verwenden Positionsinterpolation und Quaternion-Interpolation für Drehungen. Der Wechsel zwischen Originalclips und eigenen Moves erfolgt in dieser Version direkt; die 180-ms-Überblendung gilt für Originalclips untereinander.

## Maussteuerung

| Aktion | Wirkung |
| --- | --- |
| Mausrad drücken/halten und Maus bewegen | Ansicht um den aktuellen Mittelpunkt der gesamten Figur frei um alle Achsen drehen; am Rand der virtuellen Kugel auch rollen. |
| Rechts ziehen | Ansicht verschieben. |
| Mausrad drehen | Zum Zeiger zoomen, etwa bis zu Mund oder Augenlid. |
| Links auf einem Punkt ziehen | Im Verschiebemodus: Ziel für die Gelenkkette setzen oder freien Punkt verschieben. Im Drehmodus: Gelenk/Ausrichtung drehen. |
| Farbige Achsgriffe ziehen | Punkt entlang einer Achse bewegen; Skelettpunkte im Drehmodus rotieren. |

Zur Navigation sind keine Tastaturmodifikatoren oder Ansichtsbuttons nötig. Feste Ansichten und Rolltasten bleiben zusätzliche Hilfen; der Sockel ist im Studio ausgeblendet. Die Drehrichtung lässt sich in den Optionen invertieren.

## Freie Gesichtspunkte und Verbindungen

In **Gelenke bearbeiten** zuerst **Punkt setzen**, dann auf die gewünschte Stelle der Figur klicken. Ein Klick neben die Figur setzt einen freien Punkt auf die Ansichtsebene. Anschließend kann er über die Achsgriffe auch in der Tiefe verschoben werden.

Die Anordnung ist frei; innerhalb des Limits von 256 Kontrollpunkten gibt es keine erzwungene Gelenkkette: beispielsweise drei Punkte am Mund, einen pro Auge oder mehrere an jedem Augenlid.

- **Punktgröße** verändert nur die sichtbare Kugel. Kleine Mundpunkte können unabhängig von großen Kniepunkten eingestellt werden. Eine Mindest-Auswahlfläche von 10 Bildschirmpixeln erleichtert das Treffen kleiner Punkte; bei dicht benachbarten Punkten hilft die Auswahlliste.
- **Einflussbereich** bestimmt separat, wie weit die Oberflächenverformung reicht. Sie fällt zum Rand weich ab. Ein Punkt auf einer Oberfläche wirkt zunächst nur auf dieses Teilmodell; ein frei im Raum gesetzter Punkt kann mehrere Oberflächen in seinem Radius beeinflussen. Zu kleine Radien können zwischen groben Vertices liegen und dann keine sichtbare Verformung erzeugen.
- **Verbinden / lösen** und anschließend der zweite Punkt erzeugen oder entfernen eine freie Verbindung. Getrennte Mund-, Augen- und Körpergruppen sind möglich. Es gibt keinen Zwang, sie an ein vorhandenes Skelett anzuschließen.
- In **Figur bewegen** kann **Verbundene freie Punkte gemeinsam bewegen** aktiviert werden. Die verbundenen Oberflächenpunkte verschieben sich dann zusammen. Diese freien Punktgruppen erzeugen keine Knochen. Die getrennt beschriebenen Skelettketten verwenden dagegen seit 0.11.0 inverse Kinematik.
- Freie Oberflächenpunkte folgen beim Posieren der Hautbindung am nächstgelegenen Vertex. Ihre eigene Verformung wird vor der Skelettverformung angewendet. Bei komplexen Gelenkübergängen muss die Zuordnung visuell geprüft werden.

## Bestehende Skelettpunkte und Änderungen

Ein Skelettpunkt verändert in **Gelenke bearbeiten** den Drehpunkt in der Grundpose. Die vorhandene Oberfläche bleibt dabei stehen; die Hautbindung wird für die eigenen Studio-Posen aktualisiert. Die Originalclips bleiben mit ihrem ursprünglichen Skelett abspielbar.

**Kontrollpunkt löschen** entfernt einen freien Punkt und seine Verformung vollständig. Bei einem vorhandenen Skelettpunkt entfernt es dessen bedienbaren Griff; der zugrunde liegende Knochen und seine Gewichte im Quellmodell bleiben bestehen. Beliebige Quellknochen hinzufügen/löschen, neu gewichten und automatisch zu vollständigen Gelenkketten zusammenbauen ist noch nicht implementiert.

Posen und eigene Moves bleiben bei Punktänderungen erhalten. Neue Punkte werden in vorhandenen Posen in Grundstellung ergänzt; gelöschte Punkte werden aus ihnen entfernt. Nach einer Drehpunkt- oder Einflussänderung vorhandene Bewegungen ansehen und gegebenenfalls korrigieren. Seit 0.7.0 helfen automatische Prüfhinweise dabei; eine automatische Reparatur der Bewegung gibt es nicht. Eine von Moves verwendete Pose kann erst nach Löschen dieser Moves gelöscht werden. Änderungen an einer vorhandenen Pose und ihrer Zeit wirken auf alle Moves, die sie verwenden; die Reihenfolge eines bereits gespeicherten Moves bleibt erhalten.

**Zurück/Wiederholen** hält bis zu 40 Bearbeitungsschritte bereit, einschließlich vollständiger Ziehgesten. **Neu** setzt das aktuelle Modell auf seine ursprünglichen Skelettgriffe zurück und entfernt eigene Posen/Moves; auch dieser Schritt lässt sich rückgängig machen.

## Automatische Erkennung und einzelne Verbindungen

Im Modus **Gelenke bearbeiten** stehen **Joints automatisch erkennen** und **Joint-Verbindungen automatisch erkennen** bereit. Die Erkennung liest vorhandene Knochen und deren Eltern-Kind-Beziehungen aus dem 3D-Modell. Schon vorhandene Griffe werden nicht doppelt angelegt; eigene Punkte, Namen und Größen bleiben erhalten. Gelöschte Skelettgriffe lassen sich erneut erkennen. Verbindungen werden nur zwischen vorhandenen Skelettgriffen ergänzt.

Für selbst gesetzte Punkte: ersten Punkt auswählen, **Verbinden / lösen**, zweiten Punkt anklicken. Eine bestehende Verbindung wird dabei gelöst. Die Liste **Verbindungen** zeigt alle Verbindungen; **Verbindung entfernen** löscht genau diese eine Verbindung, unabhängig von ihrer Herkunft. Punkte und andere Verbindungen bleiben bestehen. Erkennung, Löschen und direktes Ziehen unterstützen Zurück/Wiederholen.

Die Buttons sind noch keine KI-Anatomieerkennung: Für Modelle ohne Skelett und für freie Gesichtspunkte bleibt anatomisches KI-Rigging offen. Verbindungen freier Punkte bilden Bearbeitungsgruppen; sie erzeugen keine neuen Knochen oder automatische Hautgewichte.

## Optionen

**Optionen** in der linken Leiste enthält Deutsch/English und **Drehrichtung der mittleren Maustaste invertieren**. Beide Einstellungen werden lokal im Browser gespeichert und sofort angewendet. Studio-Bedienelemente wechseln die Sprache, benutzervergebene Namen bleiben erhalten. Der archivierte Original-Bildplayer bleibt unverändert auf Deutsch; Modellbeschreibungen und einzelne technische Fehlermeldungen sind noch nicht vollständig lokalisiert.

## Die ganze Figur bewegen

Im Modus **Figur bewegen** auf **Gesamte Figur bewegen** klicken. Der Griff sitzt am ursprünglichen Mittelpunkt des Modells. Mit links ziehen oder den farbigen Achsgriffen die gesamte Figur versetzen; X/Y/Z dienen der präzisen Positionierung. Die Ansicht weiterhin mit gedrücktem Mausrad drehen.

Eine Pose speichern, die Figur erneut versetzen und eine zweite Pose speichern. Die daraus erzeugte Bewegung interpoliert die Gesamtposition zusammen mit den Gelenk- und Gesichtspunkten. Das funktioniert auch mit einem statischen GLB ohne Skelett oder Kontrollpunkte. Beispiel: unten – oben – unten für einen Sprung. Es werden keine physikalische Flugbahn oder Bodenkollision berechnet.

**Grundpose** setzt auch Gesamtverschiebung und -drehung zurück. Undo/Redo, Projekt-Speichern, Laden und die bestehenden Player-/Agentenbefehle für eigene Moves verwenden dieselbe Spur. Beim Bearbeiten von Gelenken steht die Figur in ihrer Grundposition; dort gibt es keinen Gesamtgriff. Beim Zurückkehren zu Originalclips wird die Gesamtverschiebung zurückgesetzt.

Ältere Projekte ohne Gesamtspur laden mit neutraler Position. Neu gespeicherte Projekte mit Gesamtspur benötigen Version 0.6.0 oder neuer. Gesamtdrehung ist seit 0.8.0 vorhanden; Skalierung als Bewegungsspur bleibt offen.

## Dateien, Agenten und Grenzen

- Beim Avatarwechsel, Projektwechsel und Schließen der Seite wird auf ungespeicherte Änderungen hingewiesen. Es gibt keine automatische dauerhafte Speicherung; die Projektdatei herunterladen.
- Während der Studio-Bearbeitung werden Zustands-/Move-Befehle aus MQTT, MCP und der Browser-API mit einer verständlichen Fehlermeldung abgewiesen. Es gibt keine nachträglich abgespielte Warteschlange. Zurück im Player sind eigene Moves normal steuerbar.
- Maximal 256 Kontrollpunkte, 2048 Verbindungen, 100 Posen und 100 eigene Moves pro Projekt; maximal 80 MiB beim Projektimport. Eingebettete Modelldaten unterliegen zusätzlich dem GLB-Limit von 50 MiB. Aufwendige Modelle und viele gleichzeitig verformende Punkte können langsam sein.
- Die Datei ist ein versioniertes Studio-Projekt, kein GLB-Export und kein automatischer Eintrag im gemeinsamen Model Zoo auf GitHub. Die eigenen Moves werden mit dem geladenen Projekt im Player angeboten.
- Keine automatische 3D-/Skelettgenerierung, Gewichts-Malwerkzeuge, anatomische Gelenkgrenzen, Ganzkörper-IK oder eigenständiger GLB-Export.
- Automatisierte Geometrie-, Daten- und DOM-Tests sind bestanden. Die visuelle Maus-/WebGL-Abnahme muss weiterhin in einem Browser erfolgen; Chromium kann in der aktuellen Ausführungsumgebung nicht starten.

## Posen nach Gelenkänderungen prüfen

Relevante Änderungen markieren gespeicherte Posen und die Moves, die diese Posen verwenden, mit **⚠**. Bei der ausgewählten Pose werden die Gründe angezeigt:

- Änderungen der Skelett-Grundstellung oder eines Drehpunkts markieren vorsorglich alle vorhandenen Posen, weil Hautbindung und untergeordnete Gelenke betroffen sein können.
- Eine neue Grundposition eines bestehenden freien Punkts markiert vorhandene Posen. Ein anderer Einflussradius markiert nur Posen, in denen dieser Punkt von seiner Grundstellung abweicht.
- Das Entfernen eines Kontrollpunkts markiert Posen, in denen er bewegt war.
- Namen, sichtbare Punktgrößen, Verbindungen, Gesamtverschiebungen während des Posierens und neutral ergänzte Punkte erzeugen keine solchen Hinweise.

**Anzeigen** lädt die ausgewählte Pose. Falls nötig korrigieren und **Ersetzen** wählen; dadurch wird die Korrektur gespeichert und ihr Hinweis aufgehoben. Ist die Pose bereits richtig, **Pose als geprüft markieren** wählen. Beide Schritte lassen sich rückgängig machen. Ein Move bleibt markiert, solange eine seiner Posen noch einen Hinweis trägt. Vorschau und Wiedergabe bleiben möglich.

Die Hinweise werden in der Projektdatei gespeichert und im Player bei den Moves angezeigt. Agentenabfragen erhalten `needsReview` und `reviewPoseIds` für eigene Moves. Das ist eine Änderungsprüfung, keine automatische anatomische Bewertung, Kollisionsprüfung oder Reparatur. Originalclips spielen weiterhin mit ihrer ursprünglichen Bindung und werden nicht markiert.

Alte Projekte ohne Hinweise bleiben lesbar. Bereits vor 0.7.0 erfolgte Änderungen können ohne früheren Vergleichsstand nicht nachträglich erkannt werden. Beim Öffnen und Speichern in älterer Software werden Prüfhinweise nicht zuverlässig nachgeführt; für diese Funktion Version 0.7.0 oder neuer verwenden.

## Die ganze Figur drehen

In **Figur bewegen → Gesamte Figur bewegen** unter **Griffe** den Eintrag **Drehen** wählen. Die farbigen Drehringe drehen das Modell um seinen ursprünglichen Mittelpunkt. Die Kamera lässt sich weiterhin mit gedrücktem Mausrad drehen – diese Ansichtsdrehung wird nicht in Posen gespeichert.

Pose speichern, weiterdrehen und die nächste Pose speichern. Verschiebung, Gesamtdrehung, Knochen- und Gesichtspunkte werden gemeinsam interpoliert. Für eine Rolle oder 360°-Drehung beispielsweise Posen bei 0°, 90°, 180°, 270° und wieder 0° aufnehmen. Zwischen zwei Posen wird die kürzere Drehung verwendet; deshalb Zwischenabstände unter 180° wählen. Gleiche Anfangs- und Endausrichtung allein beschreibt keine volle Umdrehung.

Gesamtdrehung unterstützt Undo/Redo, Projektdateien und eigene Moves im Player. Ein Projekt mit nicht neutraler Gesamtdrehung benötigt mindestens Version 0.8.0. Alte Projekte ohne Drehspur werden unverändert eingelesen. Körpergröße, Bodenkollision und Schwerkraft werden durch diese Funktion nicht gesteuert.

## KI im Studio mitarbeiten lassen

MCP wie in [Python-MCP](PYTHON-MCP.md) einrichten und das 3D-Studio öffnen. **KI darf dieses Studio bearbeiten** freigeben. Der Agent kann dann Punkte anlegen/ändern/löschen, Verbindungen bearbeiten, Posen speichern/anzeigen/ersetzen und Moves erstellen. Änderungen erscheinen sofort und können mit **Zurück/Wiederholen** rückgängig gemacht werden.

Die Freigabe wird nicht gespeichert und endet beim Verlassen oder Ersetzen des Studios. Sie kann auch während einer Vorschau ausgeschaltet werden. Während einer Vorschau oder Ziehgeste werden KI-Schreibbefehle abgewiesen. Manuelle Änderungen machen ältere Befehle ungültig; der Agent muss den aktuellen Stand erneut lesen.

Der Agent löst keinen Dateidownload aus. Das fertige Projekt weiterhin selbst mit **Speichern** herunterladen. API und Beispiel: [MCP-Studio](MCP-STUDIO.md).

## Die ganze Figur größer oder kleiner bewegen

In **Figur bewegen → Gesamte Figur bewegen** den Regler **Figurgröße** mit der Maus ziehen. 100 % entspricht der ursprünglichen Größe; möglich sind 10 % bis 500 %. Die Vorschau reagiert während des Ziehens, die Prozentanzeige zeigt den aktuellen Wert. Eine Reglerbewegung ist ein gemeinsamer Schritt für **Zurück/Wiederholen**.

Die Skalierung bleibt proportional und erfolgt um den ursprünglichen Modellmittelpunkt, gemeinsam mit Verschiebung und Drehung. Skelett und Gesichtspunkte folgen mit; die separat eingestellte sichtbare Griffgröße bleibt erhalten. Zwei unterschiedlich große Posen speichern und daraus einen Move erstellen: Die Größe wird zwischen den Posen linear interpoliert, auch beim Rückweg einer Schleife. **Grundpose** und Originalclips stellen die Ausgangsgröße wieder her.

Arbeitspose, gespeicherte Posen und Projektdateien enthalten den Größenfaktor. Alte Dateien ohne Faktor verwenden 100 %. Projekte mit Größenänderungen benötigen **0.10.0 oder neuer**: Ältere Versionen ignorieren die neue Spur. Die Funktion verändert keine Modellqualität oder Dateigröße und ersetzt keine Schwerkraft/Bodenkollision. Unterschiedliche Skalierung je Achse oder einzelner Körperteile ist nicht enthalten.

## Verbundener Körper statt Auseinanderziehen

Ab 0.11.0 verschiebt **Figur bewegen** die lokalen Skelettknochen nicht mehr einzeln. Hand ziehen dreht Ellenbogen und Schulter; Fuß ziehen dreht Knie und Hüfte. Der Ansatz der Kette bleibt stehen. Ein Ziel außerhalb der Reichweite wird auf die erreichbare Länge begrenzt. Bei Kopf/Hals wirkt die vorhandene kurze Kette; Ziehen am Rumpf-Wurzelpunkt verschiebt die ganze Figur einschließlich Kopf und Gliedmaßen. Füße bleiben dabei nicht am Boden fixiert.

Bei frisch geladenen 3D-Modellen werden alle vorhandenen Eltern-Kind-Verbindungen automatisch als Linien angelegt, nicht nur Arme. In **Gelenke bearbeiten** ergänzen **Joints automatisch erkennen** und **Joint-Verbindungen automatisch erkennen** gelöschte Griffe beziehungsweise Linien aus dem Quellskelett. Vorhandene manuelle Punkte bleiben erhalten. Neue Oberflächenmodelle ohne Knochen benötigen weiterhin echtes Rigging; aus ihnen erzeugt dieser Button noch kein anatomisches Skelett.

Manuell: einen Skelettpunkt auswählen, **Verbinden / lösen**, den benachbarten Skelettpunkt anklicken. Die Liste kennzeichnet **Gelenkkette** und **Punktgruppe**. Als Gelenkkette sind direkte Eltern-Kind-Paare des Quellmodells möglich. Unpassende neue Querverbindungen, etwa linke Hand zu rechtem Fuß, werden mit einer Erklärung abgewiesen. Eine entfernte Kettenlinie beendet die dortige Mitbewegung, löst aber niemals die Haut vom Skelett. Freie Gesichtspunkte lassen sich weiterhin untereinander gruppieren; ein frei gesetzter Punkt ist noch kein neuer Quellknochen.

Unter **Griffe → Drehen** den Punkt direkt mit der Maus ziehen: horizontal/vertikal verändert die Ausrichtung relativ zur Ansicht. Die Drehringe bieten weiterhin einzelne Achsen. Drehbewegungen verändern keine Knochenabstände. Sowohl Ziehen als auch Drehen bleiben als vollständige Gesten rückgängig machbar und werden in Posen/Moves gespeichert.

Mika und Nori enthalten im Beispiel-Rig 2 zusätzlich Hand-, Knie-, Fuß- und Halsknochen mit entsprechenden Hautzuordnungen. Zum Testen die Avatare frisch aus dem Katalog laden. Ein altes Projekt enthält weiterhin sein ursprüngliches Modell; fehlende Hand-/Knieknochen werden dort nicht nachträglich erfunden. Bereits mit älteren Versionen auseinandergezogene Posen bleiben erhalten und müssen aus der Grundpose neu aufgenommen oder ersetzt werden.

**Grenzen:** Die Kettenlösung dreht bis zu zwei verbundene Vorfahren und stoppt vor verzweigten Körperansätzen. Sie ist keine vollständige Körperphysik. Anatomische Winkelgrenzen, Kollisionen, fixierte Füße und gekoppelte Ganzkörper-IK bleiben offen. Die bisherige Form/Beugeseite wird bevorzugt, aber nicht anatomisch bewertet; komplexe Import-Rigs müssen geprüft werden. **Gelenke bearbeiten** darf weiterhin bewusst die Grundstellung ändern.

### Drehpunkt nach Zoom und Verschieben

Seit 0.11.1 bestimmt die aktuelle Modellgeometrie den Mittelpunkt für die mittlere Maustaste. Das zuletzt angeklickte Gelenk und das verschobene Kamera-Ziel bestimmen ihn nicht. Beim Drücken wird der Mittelpunkt einmal ermittelt und für die gesamte Ziehgeste beibehalten. Der gezoomte/verschobene Bildausschnitt bleibt erhalten; es erfolgt kein Sprung zur Bildmitte. Nach einer Änderung der Figur wird bei der nächsten Geste deren neuer Mittelpunkt verwendet.

## Bild zu 3D-Entwurf (0.22.0)

Der Abschnitt **Bild → 3D-Entwurf** ist auch bei ausgewähltem Original-PaKaChi im Studio sichtbar. Er benötigt einen separat eingerichteten lokalen TripoSR-Dienst und das passende Generatorprofil. PNG/JPEG auswählen oder hineinziehen, ausdrücklich generieren, dann die getrennte 3D-Vorschau drehen und zoomen. Erst **Als neuen Avatar laden** ersetzt den aktuellen Projektstand. Seit 0.23.0 lässt sich der letzte vollständige Modellwechsel separat rückgängig machen; Projekte zusätzlich speichern. **Ergebnis verwerfen** lässt das bisherige Modell bestehen. Anatomisches Rigging erfolgt noch nicht automatisch. [Einrichtung, Schritte und Prüfgrenzen](KI-GENERIERUNG.md#bedienung-im-studio-seit-0220).

## Modellwechsel zurück und wiederholen (0.23.0)

Oberhalb der Ansicht stehen **Modellwechsel zurück** und **Modellwechsel wiederholen**. Sie beziehen sich auf den letzten Wechsel zwischen Avataren, GLB-/Projektimporten oder einem übernommenen Generierungsentwurf. Die gewohnten Studio-Buttons **Zurück/Wiederholen** bleiben für einzelne Bearbeitungsschritte zuständig.

Der Rücksprung erhält Modellbytes, Avataridentität, Gelenk-/Gesichtspunkte, Verbindungen, aktuelle Entwurfspose, gespeicherte Posen/Moves und die Ungespeichert-Markierung. Beim Wiederholen wird auch der zuletzt bearbeitete Stand der jeweils anderen Figur wieder geladen. Beispielsweise: A bearbeiten → B laden → B bearbeiten → Modellwechsel zurück zu A → Modellwechsel wiederholen zu B einschließlich der neuen B-Änderungen.

- Genau ein Modellwechsel wird gehalten. Eine neue Auswahl oder ein neuer Import ersetzt den älteren Verlauf. Ein fehlgeschlagener Ladeversuch tut das nicht.
- Nur Arbeitsspeicher dieser Seite; F5/Schließen entfernt den Verlauf. Zusätzlich als Projektdatei speichern.
- Speichergrenze pro gesichertem Stand: geschätzte 160 MiB (JSON-Zeichenanzahl × 2). Das begrenzt den gespeicherten Snapshot, nicht den gesamten Browser- oder GPU-Speicher. Ein zu großer Stand blockiert den Wechsel, bevor das aktuelle Modell ersetzt wird.
- Während Studio-Wiedergabe oder einer laufenden Mausgeste erst stoppen/loslassen. Änderungen während asynchroner Wiederherstellung verhindern die veraltete Übernahme.
- Die Wiederherstellung eröffnet eine neue Editorsitzung. Einzelne frühere Undo-Schritte, Auswahl, Kameraposition und temporäre KI-Bearbeitungsfreigabe werden nicht wiederhergestellt. Die Projektinhalte bleiben erhalten.
- Beim Original-Bildplayer wird die Originalansicht neu gestartet; dessen aktuelle Form-/Abspielposition wird nicht aufgezeichnet. Die 72 Bilder und beide Formen bleiben unverändert verfügbar.

Der Verlauf ist kein dauerhafter Versionsspeicher. Seit 0.24.0 werden neue 3D-Ansicht und Editor vor dem Austausch vollständig vorbereitet. Bei Fehlern während der synchronen Übergabe werden die bisherige Editorsitzung und Ansicht wieder eingesetzt; der Verlauf wird dabei nicht verbraucht. Prozessabstürze, GPU-Kontextverlust und der separate Originalplayer-Neustart sind davon nicht abgedeckt.

### Hinweis zu älteren Projektständen

0.24.0 baut den Rig wieder nach der sichtbaren Modellnormalisierung auf. In 0.22.0/0.23.0 geschah dies davor. In diesen Versionen gespeicherte freie Oberflächenpunkte und Posen sollten deshalb an einer Kopie visuell kontrolliert werden; das unveränderte Projektformat 1 enthält keinen Versionsmarker, aus dem sich ihre Koordinatenherkunft sicher ableiten ließe. Eine automatische Migration wird nicht behauptet.

## Move-Dateien austauschen (0.27.0)

Unter **Eigene Bewegungen** einen Studio-Move auswählen und **Move exportieren** anklicken. **Move importieren** ergänzt eine passende Datei samt Posen, ohne bestehende Bewegungen zu überschreiben. Modell und bewegungsrelevante Gelenkstruktur müssen identisch sein. Der Import ist als Ganzes rückgängig machbar; Wiedergabe startet erst über Vorschau. [Anleitung und Grenzen](MOVE-DATEIEN.md).

## Gemeinsame Move-Sammlung (0.31.0)

Unter den eigenen Bewegungen **Sammlung laden** wählen, einen Katalogeintrag auswählen und **Aus Sammlung importieren** anklicken. Der Import prüft Modell und Gelenkstruktur, ergänzt Posen und Move ohne Überschreiben und lässt sich mit Zurück rückgängig machen. Es startet keine Wiedergabe. Die mitgelieferte Sammlung ist leer. [Sammlung vorbereiten und Grenzen](MOVE-SAMMLUNG.md).

## IK-Beugegrenzen (0.33.0)

1. **Gelenke bearbeiten** öffnen und den mittleren Skelettpunkt einer Zweiglied-Kette auswählen, beispielsweise Ellenbogen zwischen Schulter und Hand oder Knie zwischen Hüfte und Fuß.
2. **IK-Beugegrenze** einschalten. Mit den beiden Mausreglern minimale und maximale Beugung festlegen. 0° bedeutet gestreckt; erlaubt sind 0–175° mit Minimum ≤ Maximum. Die Ausgangseinstellung 0–175° ist keine anatomische Empfehlung.
3. Zu **Figur bewegen** wechseln und Hand beziehungsweise Fuß ziehen. Bei unerreichbarem Ziel bleibt der Endpunkt an der durch Knochenlängen und Beugegrenze bestimmten Reichweite.

Der Grenzwert liegt am mittleren Knochen, nicht an Hand/Fuß. Beide tatsächlichen Eltern-Kind-Verbindungen müssen vorhanden sein; die bestehende Erkennung begrenzt IK auf Ein-/Zweiglied-Ketten ohne verzweigende Anker. Die Beugung wird im Koordinatenraum des Anker-Elternobjekts bestimmt. Uniforme Figurgröße und Drehung sind geprüft; beliebige nichtuniforme Skalierungen und komplexe Rigs sind nicht anatomisch abgenommen.

Regleränderungen und Abschalten lassen sich rückgängig machen. Projekt, lokale Kopien und Katalogprojekt-Export behalten die Grenzen. Änderungen markieren vorhandene Posen konservativ zur Prüfung; gespeicherte Bewegungen werden nicht umgeschrieben. Move-Dateien zählen Beugegrenzen zur Rig-Kompatibilität. Ohne konfigurierte Grenze bleibt das bisherige Verhalten erhalten.

**Geltungsbereich:** Nur Ziehen des Endpunkts einer Zweiglied-IK-Kette. Direkte Drehung, vorhandene Animationsclips, gespeicherte Posen und deren Zwischenbilder werden nicht begrenzt. Es gibt keine automatische Anatomie-/Beugerichtungserkennung, keine Twistgrenzen, keine Kollisionsprüfung und keine Ganzkörper-IK. Die bisherige Beugeseite wird beibehalten; bei gestreckter Kette wird eine stabile geometrische Ersatzrichtung verwendet.

Projektformat bleibt 1. Für die Auswertung von `bendLimit` und neuen Prüfhinweisen ist Software ab 0.33.0 nötig; ältere Versionen können Grenzen ignorieren oder den neuen Prüfgrund ablehnen. [Prüfbericht](PRUEFUNG-0.33.0.md).

## Gespeicherte Pose prüfen (0.34.0)

Eine gespeicherte Pose auswählen und **Beugegrenzen der Pose prüfen** anklicken. Das Studio misst ihre Beugung an verbundenen Zweiglied-Ketten mit konfigurierten Grenzen. Der Bericht nennt Gelenkname und ID, gemessenen Winkel, erlaubten Bereich und das Ergebnis: innerhalb der Grenze, Grenze verletzt oder nicht messbar. Konfigurierte Gelenke ohne passende verbundene Kette werden ausdrücklich separat ausgewiesen.

Die Messung liest gespeicherte Transformationen; sie zeigt die Pose nicht automatisch an und verändert weder die aktuelle Figur noch Projekt, Undo-Verlauf oder bestehende Prüfmarkierungen. Ein erfolgreicher Einzeltest bedeutet nicht, dass die Bewegung insgesamt geprüft ist. Die Anzeige wird bei neuer Auswahl oder Editor-Neudarstellung verworfen; nach Änderungen erneut prüfen. Während Wiedergabe oder Ziehgesten ist die Prüfung gesperrt.

Gemessen wird im selben Anker-Elternraum wie beim IK-Ziehen, mit den ursprünglichen lokalen Knochenskalierungen. Eine Toleranz von 0,0001 Grad verhindert falsche Grenzverletzungen durch Rundung. Segmente ohne messbare Länge werden nicht als bestanden behandelt. Es werden nur gespeicherte Einzelposen geprüft: keine Zwischenbilder, Originalclips, Twistgrenzen, Kollisionen oder allgemeine Anatomie. **Keine automatische Korrektur.** Pose bei Bedarf anzeigen, manuell korrigieren, ersetzen und erneut prüfen. Der Bericht wird nicht gespeichert. [Prüfbericht](PRUEFUNG-0.34.0.md).

## Bewegung stichprobenartig prüfen (0.35.0)

Unter **Eigene Bewegungen** einen Move auswählen und **Beugegrenzen der Bewegung prüfen** anklicken. **Prüfung abbrechen** beendet den laufenden Vorgang. Das Studio verwendet dieselbe Interpolation wie bei der Wiedergabe, ohne die Figur zu bewegen oder Projektdaten zu ändern.

Jeder Übergang wird in 16 gleichmäßigen Schritten geprüft, zusätzlich die erste Pose. Unterschiedliche Posendauern und wiederholte Posen bleiben erhalten; bei Schleifen wird auch der Rückweg zur ersten Pose geprüft. Höchstens 1601 Stichproben pro Aufruf. Das ist keine feste Bildrate und kein lückenloser Nachweis: kurze Verletzungen zwischen Stichproben können unentdeckt bleiben.

Der Bericht zeigt Stichprobenzahl, gemessenen Winkelbereich je Gelenk, eingestellte Grenzen und den ersten auffälligen Zeitpunkt in Sekunden ab Bewegungsstart. Nicht messbare Segmente und nicht verbundene Ketten werden nicht als bestanden behandelt. Seit 0.36.0 öffnet „Auffälliges Bild ansehen“ den gemeldeten Zeitpunkt direkt als pausierte Vorschau.

Änderungen, Verlassen oder Schließen des Studios machen laufende Ergebnisse ungültig. Während Wiedergabe und Ziehgesten startet keine Prüfung. Die Berechnung gibt regelmäßig die Oberfläche frei. Berichte sind flüchtig und werden bei Auswahlwechsel oder Neudarstellung entfernt. Es werden keine Prüfmarkierungen gelöscht und keine Korrekturen ausgeführt. Originalclips, Kollisionen, Twistgrenzen und allgemeine Anatomie bleiben ungeprüft. [Prüfbericht](PRUEFUNG-0.35.0.md).

## Prüfbilder ansehen und übernehmen (0.36.0)

1. Einen eigenen Move auf Beugegrenzen prüfen.
2. Bei einem auffälligen Gelenk **Auffälliges Bild ansehen** anklicken. Die Vorschau öffnet exakt den gemeldeten Zeitpunkt und bleibt pausiert. Der Bericht wird beim Wechsel zur Vorschau entfernt.
3. Mit **Stopp** zur vorherigen Bearbeitungspose zurückkehren. Das reine Ansehen speichert keine neue Pose und verändert den Move nicht.
4. Alternativ **Prüfbild als neue Pose übernehmen** wählen. Die Vorschau endet; das sichtbare Bild wird als neue Pose mit einer Sekunde Dauer angelegt und ausgewählt. Zurück/Wiederholen nimmt die Übernahme als Ganzes zurück beziehungsweise stellt sie wieder her, einschließlich der angezeigten Pose.

Die neue Pose wird nicht automatisch in einen bestehenden Move eingefügt. Sie ist auch nicht automatisch korrigiert oder als geprüft bestätigt. Im Modus „Figur bewegen“ bei Bedarf manuell korrigieren und ersetzen, anschließend erneut prüfen. Die bisherigen gespeicherten Posen und Moves bleiben erhalten. Bei bereits 100 Posen wird keine weitere angelegt.

Veraltete Berichte, ungültige Zeitpunkte und geschlossene Studios werden abgewiesen. Die Vorschau verwendet die bestehende Interpolation und bleibt von der Stichprobenbegrenzung der Prüfung abhängig. Stopp bezieht sich hier auf die Prüfbildvorschau; die normale Vorschau behält ihr bisheriges Verhalten. Gerenderte Bedienabnahme steht aus. [Prüfbericht](PRUEFUNG-0.36.0.md).

## Bestehende Posenfolge bearbeiten (0.37.0)

Im Modus **Figur bewegen** einen eigenen Move auswählen. **Posenfolge dieser Bewegung** zeigt dessen tatsächliche Reihenfolge, einschließlich mehrfach verwendeter Posen. Jeder Eintrag enthält Positionsnummer, Posenname, ID und die für diese Pose gespeicherte Übergangszeit.

- **Schritt nach vorne/hinten** verschiebt das ausgewählte Vorkommen um eine Position.
- **Schritt entfernen** entfernt nur dieses Vorkommen aus dem Move. Die Pose bleibt im Projekt; mindestens zwei Schritte sind erforderlich.
- Oben in der Posenliste eine Pose auswählen und **Ausgewählte Pose einfügen** wählen: Sie wird nach dem ausgewählten Schritt eingefügt, auch als Wiederholung.
- **Schritt durch ausgewählte Pose ersetzen** tauscht nur den ausgewählten Verweis aus.

So kann eine zuvor übernommene Prüfpose gezielt an die Stelle einer bisherigen Pose treten. Jede tatsächliche Änderung ist ein einzelner Undo-/Redo-Schritt. Andere Moves, gespeicherte Posenwerte, Schleifeneinstellung und die aktuelle Figurenstellung bleiben erhalten. Vorschau und Beugegrenzenprüfung verwenden sofort die neue Folge; laufende Prüfungen werden verworfen.

Erlaubt sind 2–100 Verweise auf vorhandene Projektposen. Während Wiedergabe/Ziehgesten und im Modus „Gelenke bearbeiten“ ist die Sequenzbearbeitung gesperrt. Die Reihenfolge der allgemeinen Projekt-Posenliste ist davon unabhängig. Neue Moves werden weiterhin zunächst aus der allgemeinen Posenliste erstellt.

Die Zeit gehört weiterhin zur referenzierten Pose: Ändern ihrer Dauer betrifft alle Vorkommen und Moves, die diese Pose verwenden. Bei Schleifen gilt die Dauer der ersten Pose für den Rückweg. Es gibt keine unabhängigen Zeiten pro Vorkommen. Sequenzbearbeitung korrigiert keine Gelenkwinkel automatisch; Vorschau und Prüfung anschließend erneut ausführen. Seit 0.38.0 können MCP-Clients und der Assistent bestehende Sequenzen auslesen und ändern; siehe [MCP-Anleitung](MCP-STUDIO.md#bestehende-sequenzen-ab-0380). Die gerenderte Abnahme steht aus. [Prüfbericht](PRUEFUNG-0.37.0.md).


## Gemeinsame KI-Änderungen an Bewegungsfolgen (0.40.0)

Der Assistent kann mehrere bestehende Moves in einem Vorschlag zusammenfassen. Prüfe im angezeigten Paket die Ziel-IDs und vollständigen Posenfolgen. „Vorgeschlagene Änderung übernehmen“ führt das Paket nach Studio-Freigabe gemeinsam aus; „Zurück“ nimmt alle enthaltenen Änderungen gemeinsam zurück. Wenn eine Teiländerung ungültig ist oder sich der Studio-Stand geändert hat, wird nichts übernommen. Derzeit sind ausschließlich Sequenzänderungen kombinierbar; die manuelle Einzelbearbeitung bleibt unverändert.


## Vorschläge vor der Übernahme vergleichen (0.41.0)

Bei einzelnen oder gebündelten Sequenzänderungen zeigt der Assistent nun eine Tabelle je Bewegung: **Schritt**, **Vorher**, **Nachher**. Bewegungs- und Posennamen stehen mit ihren IDs dabei, damit gleichnamige Elemente unterscheidbar bleiben. Ein Gedankenstrich kennzeichnet einen fehlenden Schritt auf einer Seite. Wiederholte Posen erscheinen für jedes Vorkommen einzeln.

Die Tabelle liest den aktuellen Stand lokal aus und bewegt die Figur nicht. Das vollständige Befehlspaket steht weiterhin darunter. Erst „Vorgeschlagene Änderung übernehmen“ führt es aus. Bei veraltetem Stand oder nicht mehr vorhandenen Posen wird keine Übernahme angeboten; Aufgabe erneut senden. Änderungen nach Anzeige werden beim Übernehmen nochmals über die Revision geprüft. Nach Übernahme oder Zurücksetzen des Assistenten wird die Vergleichsansicht entfernt. Seit 0.42.0 ergänzen Abspielknöpfe die Vorschau am Modell; siehe folgenden Abschnitt.


## KI-Sequenzvorschläge am Modell ansehen (0.42.0)

Unter dem Bewegungsnamen im Vergleich stehen **Vorher abspielen** und **Nachher abspielen**. Öffne dazu das Studio im Modus „Figur bewegen“. Die Knöpfe spielen die jeweilige Folge direkt am Modell ab; bei mehreren vorgeschlagenen Moves wählst du jede Bewegung einzeln. Tempo, Pause und Abspielposition können über die vorhandene Wiedergabesteuerung benutzt werden.

**Vorschau beenden** stellt die Bearbeitungspose vor der Vorschau wieder her. Ein nicht wiederholter Move beendet die Vorschau automatisch; eine Schleife läuft bis zum Stoppen. Ein Wechsel von Vorher zu Nachher beendet zunächst die bisherige Vorschau. Übernehmen, Schließen oder Zurücksetzen des Assistenten beendet ebenfalls dessen Vorschau. Der normale Studio-Stopp funktioniert weiterhin.

Die Vorschau speichert nichts und benötigt keine KI-Schreibfreigabe. Übernehmen benötigt diese Freigabe weiterhin und prüft die Revision erneut. Während einer anderen Wiedergabe, einer Ziehgeste, einer Beugegrenzenprüfung oder im Gelenkbearbeitungsmodus startet die Vorschau nicht. Bei veraltetem Stand die Aufgabe erneut senden. Die Funktion ist technisch geprüft; die gerenderte Browserabnahme steht aus.


## Lokale Sammlung in mehreren Tabs (0.45.0)

Speichern oder bestätigtes Löschen einer Kopie aktualisiert die Listen in anderen Tabs derselben Anwendung automatisch. Beim erneuten Aktivieren des Fensters wird ebenfalls nachgeladen. Falls der Browser keine Tab-Benachrichtigungen unterstützt, steht „Liste aktualisieren“ weiterhin bereit.

Das Löschen einer gespeicherten Kopie entfernt ihre Ablage und Listenauswahl. Ein bereits geladener Avatar bleibt im anderen Tab erhalten und kann dort weiterbearbeitet oder neu gespeichert werden. Browserdaten zu löschen entfernt weiterhin die gesamte lokale Sammlung; Projektdateien dienen als unabhängige Sicherung.

## Echten Knochen dazwischen einfügen (0.47.0)

1. „Gelenke bearbeiten“ öffnen und den Endpunkt einer vorhandenen Knochenstrecke auswählen, beispielsweise den Fuß einer Hüfte-Fuß-Strecke.
2. „Knochen dazwischen einfügen“ anklicken. In der Mitte entsteht ein echtes Zwischengelenk mit zwei verbundenen Teilstrecken und angepassten Hautgewichten.
3. Das neue Gelenk benennen und bei Bedarf in der Grundpose verschieben. Unter „Figur bewegen“ die Bewegung prüfen.
4. Vorhandene Posen sind als prüfbedürftig markiert. Änderungen ansehen und gegebenenfalls Posen korrigieren.
5. Das vollständige Projekt speichern. Es benötigt zum erneuten Laden mindestens Version 0.47.0. Undo/Redo nimmt den gesamten Einfügeschritt zurück beziehungsweise stellt ihn wieder her.

Die Gewichtsverteilung ist geometrisch angenähert; die Oberfläche besonders an Gelenken kontrollieren. Der Knopf benötigt ein vorhandenes Skelett und erzeugt kein vollständiges Rig aus einer ungeriggten Figur. „Kontrollpunkt löschen“ entfernt weiterhin nur den Griff, nicht den Knochen. Die ursprünglichen Modellbytes bleiben erhalten.

## Einen echten Knochen löschen (0.48.0)

Unter „Gelenke bearbeiten“ den Knochen auswählen und „Knochen wirklich löschen“ anklicken. Der Knopf „Kontrollpunkt löschen“ entfernt weiterhin nur den Bearbeitungsgriff. Beim echten Löschen bleiben Kinder verbunden: Sie wechseln zum Elternknochen, der auch die Hautgewichte übernimmt. Vorhandene Posen werden umgerechnet und zur Kontrolle markiert. Oberfläche und Moves danach prüfen; besonders eine zuvor stark gebeugte gelöschte Gelenkspur kann anders aussehen.

Undo/Redo stellt den gesamten Eingriff einschließlich Hierarchie und Gewichten wieder her. Die Projektdatei speichert die Löschungen; zum Laden ist mindestens 0.48.0 erforderlich. Wurzelknochen, selbst skalierte Knochen und Knochen mit Anbauteilen können derzeit nicht gelöscht werden. Falls Griffe fehlen, zuerst vorhandene Gelenke erkennen. Nach Löschungen ist weiteres Einfügen bis zum Rückgängigmachen der Löschungen gesperrt; weitere Löschungen bleiben möglich.
