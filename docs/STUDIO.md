# Avatar-Studio – 0.87.0

Das Studio ist Teil des Players. Mika, Nori und eigene GLB-Modelle können bearbeitet werden. Der Original-Bildplayer mit beiden Formen und 72 Bildern bleibt erhalten. Die bearbeitbaren 3D-Rekonstruktionen beider PaKaChi-Formen sind zusätzlich im Model Zoo verfügbar; Charakterqualität und gemeinsame 3D-Verwandlung bleiben in Arbeit.

## Eine erste eigene Bewegung

1. Im Player einen 3D-Avatar auswählen und **Avatar-Studio** öffnen. Die laufende Animation hält an und die Grundpose wird angezeigt.
2. In **Figur bewegen** einen Skelettpunkt anklicken oder aus der Liste wählen. Den Punkt direkt oder an einem farbigen Achsgriff ziehen. Verbundene Skelettpunkte beugen dabei die Kette mit erhaltenen Knochenlängen. Unter **Griffe → Drehen** lässt sich ein Skelettpunkt drehen; seine gebundenen Körperteile folgen. X/Y/Z ermöglichen genaue Positionen.
3. Einen Posennamen eingeben und **Aktuelle Pose speichern** wählen. Figur verändern und eine zweite Pose speichern.
4. Die Übergangszeit jeder Pose festlegen. Mit **Früher/Später** wird die Reihenfolge für die nächste gespeicherte Bewegung geändert. **Anzeigen** lädt eine Pose; **Ersetzen** übernimmt die aktuelle Haltung.
5. Bewegungsname und eindeutiges Schlagwort eingeben, z. B. `laecheln`. **Bewegung speichern** übernimmt alle Posen in der angezeigten Reihenfolge. Eine Bewegung benötigt mindestens zwei Posen. Optional läuft sie als Schleife.
6. **Vorschau** abspielen oder zurück zum Player wechseln. Die eigene Bewegung steht dort in der Bewegungslegende und über MQTT/MCP zur Verfügung.
7. **Speichern** lädt eine `.pakachi.json`-Projektdatei herunter. Sie enthält das ursprüngliche Modell, das bearbeitete Kontrollsystem, die aktuelle Arbeitspose, gespeicherte Posen und Bewegungen. **Projekt laden** öffnet diese Datei später wieder vollständig, auch ohne die ursprüngliche GLB-Datei.

Die Zeit der ersten Pose bestimmt bei Schleifen den Rückweg von der letzten zur ersten Pose. Bei einmaligen Bewegungen startet die erste Pose sofort; die folgenden Zeiten bestimmen die jeweiligen Übergänge. Nach einer einmaligen Bewegung im Player folgt wieder der aktive Grundzustand. Eigene Bewegungen verwenden Positionsinterpolation und Quaternion-Interpolation für Drehungen. Die Überblendung zwischen Originalclips und eigenen Moves besitzt Grenzen bei bearbeiteten Rigs; siehe [Roadmap](ROADMAP.md).

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
- Allgemeines anatomisches Auto-Rigging, Gewichts-Malwerkzeuge und Ganzkörper-IK bleiben offen. Bild-zu-3D benötigt eine eingerichtete Laufzeit; [Generierung](KI-GENERIERUNG.md), vorhandene Beugegrenzen und [GLB-Export](GLB-EXPORT.md) beschreiben den jeweiligen Umfang.
- Automatisierte Geometrie-, Daten-, DOM- und Browsernachweise stehen im [Prüfbericht](PRUEFUNG.md). Manuelle Design-/Anatomieabnahme bleibt erforderlich.

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

Projektformat bleibt 1. Für die Auswertung von `bendLimit` und neuen Prüfhinweisen ist Software ab 0.33.0 nötig; ältere Versionen können Grenzen ignorieren oder den neuen Prüfgrund ablehnen. [Prüfbericht](PRUEFUNG.md#version-0330).

## Gespeicherte Pose prüfen (0.34.0)

Eine gespeicherte Pose auswählen und **Beugegrenzen der Pose prüfen** anklicken. Das Studio misst ihre Beugung an verbundenen Zweiglied-Ketten mit konfigurierten Grenzen. Der Bericht nennt Gelenkname und ID, gemessenen Winkel, erlaubten Bereich und das Ergebnis: innerhalb der Grenze, Grenze verletzt oder nicht messbar. Konfigurierte Gelenke ohne passende verbundene Kette werden ausdrücklich separat ausgewiesen.

Die Messung liest gespeicherte Transformationen; sie zeigt die Pose nicht automatisch an und verändert weder die aktuelle Figur noch Projekt, Undo-Verlauf oder bestehende Prüfmarkierungen. Ein erfolgreicher Einzeltest bedeutet nicht, dass die Bewegung insgesamt geprüft ist. Die Anzeige wird bei neuer Auswahl oder Editor-Neudarstellung verworfen; nach Änderungen erneut prüfen. Während Wiedergabe oder Ziehgesten ist die Prüfung gesperrt.

Gemessen wird im selben Anker-Elternraum wie beim IK-Ziehen, mit den ursprünglichen lokalen Knochenskalierungen. Eine Toleranz von 0,0001 Grad verhindert falsche Grenzverletzungen durch Rundung. Segmente ohne messbare Länge werden nicht als bestanden behandelt. Es werden nur gespeicherte Einzelposen geprüft: keine Zwischenbilder, Originalclips, Twistgrenzen, Kollisionen oder allgemeine Anatomie. **Keine automatische Korrektur.** Pose bei Bedarf anzeigen, manuell korrigieren, ersetzen und erneut prüfen. Der Bericht wird nicht gespeichert. [Prüfbericht](PRUEFUNG.md#version-0340).

## Bewegung stichprobenartig prüfen (0.35.0)

Unter **Eigene Bewegungen** einen Move auswählen und **Beugegrenzen der Bewegung prüfen** anklicken. **Prüfung abbrechen** beendet den laufenden Vorgang. Das Studio verwendet dieselbe Interpolation wie bei der Wiedergabe, ohne die Figur zu bewegen oder Projektdaten zu ändern.

Jeder Übergang wird in 16 gleichmäßigen Schritten geprüft, zusätzlich die erste Pose. Unterschiedliche Posendauern und wiederholte Posen bleiben erhalten; bei Schleifen wird auch der Rückweg zur ersten Pose geprüft. Höchstens 1601 Stichproben pro Aufruf. Das ist keine feste Bildrate und kein lückenloser Nachweis: kurze Verletzungen zwischen Stichproben können unentdeckt bleiben.

Der Bericht zeigt Stichprobenzahl, gemessenen Winkelbereich je Gelenk, eingestellte Grenzen und den ersten auffälligen Zeitpunkt in Sekunden ab Bewegungsstart. Nicht messbare Segmente und nicht verbundene Ketten werden nicht als bestanden behandelt. Seit 0.36.0 öffnet „Auffälliges Bild ansehen“ den gemeldeten Zeitpunkt direkt als pausierte Vorschau.

Änderungen, Verlassen oder Schließen des Studios machen laufende Ergebnisse ungültig. Während Wiedergabe und Ziehgesten startet keine Prüfung. Die Berechnung gibt regelmäßig die Oberfläche frei. Berichte sind flüchtig und werden bei Auswahlwechsel oder Neudarstellung entfernt. Es werden keine Prüfmarkierungen gelöscht und keine Korrekturen ausgeführt. Originalclips, Kollisionen, Twistgrenzen und allgemeine Anatomie bleiben ungeprüft. [Prüfbericht](PRUEFUNG.md#version-0350).

## Prüfbilder ansehen und übernehmen (0.36.0)

1. Einen eigenen Move auf Beugegrenzen prüfen.
2. Bei einem auffälligen Gelenk **Auffälliges Bild ansehen** anklicken. Die Vorschau öffnet exakt den gemeldeten Zeitpunkt und bleibt pausiert. Der Bericht wird beim Wechsel zur Vorschau entfernt.
3. Mit **Stopp** zur vorherigen Bearbeitungspose zurückkehren. Das reine Ansehen speichert keine neue Pose und verändert den Move nicht.
4. Alternativ **Prüfbild als neue Pose übernehmen** wählen. Die Vorschau endet; das sichtbare Bild wird als neue Pose mit einer Sekunde Dauer angelegt und ausgewählt. Zurück/Wiederholen nimmt die Übernahme als Ganzes zurück beziehungsweise stellt sie wieder her, einschließlich der angezeigten Pose.

Die neue Pose wird nicht automatisch in einen bestehenden Move eingefügt. Sie ist auch nicht automatisch korrigiert oder als geprüft bestätigt. Im Modus „Figur bewegen“ bei Bedarf manuell korrigieren und ersetzen, anschließend erneut prüfen. Die bisherigen gespeicherten Posen und Moves bleiben erhalten. Bei bereits 100 Posen wird keine weitere angelegt.

Veraltete Berichte, ungültige Zeitpunkte und geschlossene Studios werden abgewiesen. Die Vorschau verwendet die bestehende Interpolation und bleibt von der Stichprobenbegrenzung der Prüfung abhängig. Stopp bezieht sich hier auf die Prüfbildvorschau; die normale Vorschau behält ihr bisheriges Verhalten. Gerenderte Bedienabnahme steht aus. [Prüfbericht](PRUEFUNG.md#version-0360).

## Bestehende Posenfolge bearbeiten (0.37.0)

Im Modus **Figur bewegen** einen eigenen Move auswählen. **Posenfolge dieser Bewegung** zeigt dessen tatsächliche Reihenfolge, einschließlich mehrfach verwendeter Posen. Jeder Eintrag enthält Positionsnummer, Posenname, ID und die für diese Pose gespeicherte Übergangszeit.

- **Schritt nach vorne/hinten** verschiebt das ausgewählte Vorkommen um eine Position.
- **Schritt entfernen** entfernt nur dieses Vorkommen aus dem Move. Die Pose bleibt im Projekt; mindestens zwei Schritte sind erforderlich.
- Oben in der Posenliste eine Pose auswählen und **Ausgewählte Pose einfügen** wählen: Sie wird nach dem ausgewählten Schritt eingefügt, auch als Wiederholung.
- **Schritt durch ausgewählte Pose ersetzen** tauscht nur den ausgewählten Verweis aus.

So kann eine zuvor übernommene Prüfpose gezielt an die Stelle einer bisherigen Pose treten. Jede tatsächliche Änderung ist ein einzelner Undo-/Redo-Schritt. Andere Moves, gespeicherte Posenwerte, Schleifeneinstellung und die aktuelle Figurenstellung bleiben erhalten. Vorschau und Beugegrenzenprüfung verwenden sofort die neue Folge; laufende Prüfungen werden verworfen.

Erlaubt sind 2–100 Verweise auf vorhandene Projektposen. Während Wiedergabe/Ziehgesten und im Modus „Gelenke bearbeiten“ ist die Sequenzbearbeitung gesperrt. Die Reihenfolge der allgemeinen Projekt-Posenliste ist davon unabhängig. Neue Moves werden weiterhin zunächst aus der allgemeinen Posenliste erstellt.

Die Zeit gehört weiterhin zur referenzierten Pose: Ändern ihrer Dauer betrifft alle Vorkommen und Moves, die diese Pose verwenden. Bei Schleifen gilt die Dauer der ersten Pose für den Rückweg. Es gibt keine unabhängigen Zeiten pro Vorkommen. Sequenzbearbeitung korrigiert keine Gelenkwinkel automatisch; Vorschau und Prüfung anschließend erneut ausführen. Seit 0.38.0 können MCP-Clients und der Assistent bestehende Sequenzen auslesen und ändern; siehe [MCP-Anleitung](MCP-STUDIO.md#bestehende-sequenzen-ab-0380). Die gerenderte Abnahme steht aus. [Prüfbericht](PRUEFUNG.md#version-0370).


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
2. „Position auf der Knochenstrecke“ mit der Maus auf 10–90 % einstellen. Gemessen wird vom Elternknochen zum ausgewählten Kindknochen; 50 % ist die Mitte. Der Regler bereitet den nächsten Eingriff vor. Erst „Knochen dazwischen einfügen“ erzeugt dort das echte Zwischengelenk mit zwei verbundenen Teilstrecken und angepassten Hautgewichten.
3. Das neue Gelenk benennen und bei Bedarf in der Grundpose verschieben. Unter „Figur bewegen“ die Bewegung prüfen.
4. Vorhandene Posen sind als prüfbedürftig markiert. Änderungen ansehen und gegebenenfalls Posen korrigieren.
5. Das vollständige Projekt speichern. Es benötigt zum erneuten Laden mindestens Version 0.47.0. Undo/Redo nimmt den gesamten Einfügeschritt zurück beziehungsweise stellt ihn wieder her.

Die Gewichtsverteilung ist geometrisch angenähert; die Oberfläche besonders an Gelenken kontrollieren. Der Knopf benötigt ein vorhandenes Skelett und erzeugt kein vollständiges Rig aus einer ungeriggten Figur. „Kontrollpunkt löschen“ entfernt weiterhin nur den Griff, nicht den Knochen. Die ursprünglichen Modellbytes bleiben erhalten.

## Einen echten Knochen löschen (0.48.0)

Unter „Gelenke bearbeiten“ den Knochen auswählen und „Knochen wirklich löschen“ anklicken. Der Knopf „Kontrollpunkt löschen“ entfernt weiterhin nur den Bearbeitungsgriff. Beim echten Löschen bleiben Kinder verbunden: Sie wechseln zum Elternknochen, der auch die Hautgewichte übernimmt. Vorhandene Posen werden umgerechnet und zur Kontrolle markiert. Oberfläche und Moves danach prüfen; besonders eine zuvor stark gebeugte gelöschte Gelenkspur kann anders aussehen.

Undo/Redo stellt den gesamten Eingriff einschließlich Hierarchie und Gewichten wieder her. Die Projektdatei speichert die Löschungen; zum Laden ist mindestens 0.48.0 erforderlich. Wurzelknochen, selbst skalierte Knochen und Knochen mit Anbauteilen können derzeit nicht gelöscht werden. Falls Griffe fehlen, zuerst vorhandene Gelenke erkennen. In 0.48.0 war weiteres Einfügen nach Löschungen gesperrt; seit 0.49.0 entfällt diese Einschränkung.

## Nach dem Löschen wieder einfügen (0.49.0)

Die frühere Sperre entfällt: Nach „Knochen wirklich löschen“ einen verbleibenden Endpunkt auswählen und „Knochen dazwischen einfügen“ anklicken. So lässt sich beispielsweise ein Knie entfernen und zwischen Hüfte und Fuß ein neues Gelenk einsetzen. Anschließend die Gelenkposition und Hautverformung kontrollieren.

Jedes Löschen und Einfügen hat einen eigenen Undo-/Redo-Schritt. Beim Speichern und Laden bleibt die Reihenfolge erhalten; für solche gemischten Abläufe ist mindestens 0.49.0 erforderlich. Die Schutzregeln für Wurzeln, skalierte Knochen und Anbauteile gelten weiterhin.


## Knochenbearbeitung durch Agenten (0.50.0)

Seit **0.50.0** unterstützen `edit_studio` und der integrierte Assistent zwei weitere Aktionen: `insert_bone` mit der ID des Kindknochens fügt ein echtes Zwischengelenk ein (seit 0.52.0 optional `ratio: 0.1…0.9`, Standard `0.5`, vom Elternknochen zum Kind gemessen); `delete_bone` entfernt den angegebenen Knochen und überträgt Kinder und Gewichte an seinen Elternknochen. `delete_point` entfernt weiterhin nur den Griff. Zuerst `get_studio` mit `section: points` lesen, dann im Rig-Modus mit aktueller Sitzung/Revision und erteilter Bearbeitungsfreigabe arbeiten. Der integrierte Assistent legt Änderungen weiterhin zur ausdrücklichen Übernahme vor. Jeder Eingriff ist über Undo/Redo rückgängig machbar; vorhandene Posen danach prüfen. Die Schutzregeln für Wurzeln, skalierte Knochen und Anbauteile bleiben bestehen.

249 Tests und Build bestanden; Node-MCP-Transport mit beiden Aktionen geprüft. Python-Modell und Werkzeugbeschreibung erweitert, Syntax geprüft. Keine neue reale Python-MCP-/Anbieterabnahme; neuer CI-Nachweis steht aus.


## Knochen umhängen (0.53.0)

1. „Gelenke bearbeiten“ öffnen und den umzuhängenden Knochen auswählen.
2. Unter „Neuer Elternknochen“ den gewünschten Knochen auswählen.
3. „Knochen umhängen“ anwählen. Die echte Skelettverbindung ändert sich, ohne den Knochen in der Grundstellung zu versetzen. Kinder bleiben am umgehängten Knochen.
4. Gespeicherte Posen und vor allem die Übergänge der Moves prüfen. Einzelposen werden umgerechnet; Zwischenbewegungen können sich durch die neue Hierarchie ändern.

Undo/Redo und Speichern/Laden erhalten die Änderung. Umhängen kann mit Einfügen und Löschen gemischt werden. Hautgewichte werden keinem anderen Knochen zugewiesen. Wurzeln, Selbst-/Nachfahrenverbindungen, andere Skelettbäume, skalierte Knochenketten und Anbauteile mit eigenem Skelett werden abgewiesen. Seit 0.54.0 bleiben starre Anbauteile beim Umhängen am Knochen befestigt, auch wenn sie selbst verschachtelt, gedreht oder skaliert sind. Das Löschen eines Knochens mit Anbauteilen bleibt gesperrt.

Für Assistent/MCP: `reparent_bone` benötigt `id` des umzuhängenden Knochens und `target` des neuen Elternknochens, aktuellen `session`/`expectedRevision`, Rig-Modus und erteilte Bearbeitungsfreigabe. Der Assistent braucht zusätzlich die ausdrückliche Übernahme. `get_studio` mit `section: points` liefert nun `parentBone` (Knochenindex oder null) und `parentId` (Griff-ID oder null, wenn kein Griff vorhanden ist).

Projektformat 1 enthält optional `boneReparents: [{bone, parent, after}]`; `after` zählt vorausgehende Einfüge-/Löschoperationen. Umgehängte Projekte benötigen mindestens Software 0.53.0; ältere Leser kennen diese Hierarchieänderung nicht. Originalclips verwenden weiterhin die unveränderte Quellhierarchie.


Umhängen mit starren Anbauteilen benötigt Software 0.54.0. Die Projektstruktur bleibt unverändert; ältere Versionen weisen diese Umhängung beim Laden ab. Die Bewegung zwischen gespeicherten Posen muss weiterhin geprüft werden.


## Oberflächen-Einfluss übertragen (0.55.0)

1. „Gelenke bearbeiten“ öffnen und den Quellknochen auswählen.
2. Unter „Oberflächen-Einfluss übertragen auf“ den Zielknochen auswählen.
3. Den Anteil mit dem Mausregler einstellen und „Einfluss übertragen“ anklicken. 30 % bedeutet: 30 % des vorhandenen Quellgewichts pro betroffenem Oberflächenpunkt übertragen.
4. Posen und Moves prüfen: Die Grundpose bleibt erhalten, die Haut folgt bei Bewegung nun stärker dem Zielknochen. Undo/Redo stellt die Gewichte wieder her.

Ohne Bereichsbegrenzung werden alle vom Quellknochen beeinflussten Vertices bearbeitet. Seit 0.56.0 kann die Übertragung auf einen kugelförmigen Umkreis begrenzt werden; kontinuierliches Malen bleibt offen. Bei mehr als vier resultierenden Einflüssen bleiben die vier stärksten und werden normalisiert; dadurch kann der effektive Anteil abweichen. Starre Anbauteile sind keine gewichtete Haut und bleiben unverändert. Bis zu 128 Übertragungen werden in ihrer Reihenfolge gespeichert, auch zwischen Knochen-Einfüge-/Löschoperationen.

Assistent/MCP: `transfer_weights` mit `id` der Quelle, `target` des Ziels und `amount` größer 0 bis einschließlich 1. Rig-Modus, Bearbeitungsfreigabe und aktuelle Sitzung/Revision sind erforderlich; der integrierte Assistent braucht die ausdrückliche Übernahme. Fehlende Zielknochen in betroffenen Skinning-Paletten und Quellen ohne Gewicht werden abgewiesen.

Projektformat 1 erhält optional `weightTransfers: [{from,to,amount,after}]`. Der Prüfgrund `skin-weights` markiert betroffene Posen. Solche Projekte benötigen mindestens Software 0.55.0. Originalclips verwenden weiterhin ursprüngliche Gewichte. Move-Dateien bleiben an die bearbeitete Rig-Struktur gebunden.


## Hautgewichte im Umkreis bearbeiten (0.56.0)

Bei der Gewichtsübertragung „Nur im Umkreis des Quellgelenks“ aktivieren und den Radius einstellen (0,005 bis 2 in normalisierten Modelleinheiten). Mittelpunkt ist die gespeicherte Grundposition des ausgewählten Gelenks. Im Mittelpunkt wirkt der volle eingestellte Anteil; zum Rand nimmt die Stärke weich auf null ab. Außerhalb der Kugel werden keine Gewichte geändert. Deaktivieren der Option stellt die globale Übertragung wieder her.

Die Auswahl wird an den ursprünglichen Vertexpositionen in der Grundpose berechnet. Figurbewegung, Skalierung und bereits veränderte Hautgewichte verschieben diesen gespeicherten Bereich nicht. Eine leere Auswahl führt zu einer Fehlermeldung und keiner Änderung. Undo/Redo, Projektdateien und Katalogexport erhalten den Bereich.

Assistent/MCP: optional `region: {center: [x,y,z], radius: r}` bei `transfer_weights`. Der Mittelpunkt darf frei in normalisierten Weltkoordinaten der ursprünglichen Grundpose angegeben werden (jede Koordinate −100 bis 100); Radius 0,005 bis 2. Ohne `region` bleibt der bisherige globale Ablauf erhalten. Projekte mit Bereichen benötigen Software 0.56.0.

Seit 0.57.0 zeigen grüne Außenringe die Bereichsgrenze und orange Innenringe die halbe Übertragungsstärke. Kontinuierliches Pinseln ist noch nicht implementiert. Die Vier-Einfluss-Grenze und Normalisierung gelten weiterhin.


## Bereichsvorschau (0.57.0)

Sobald „Nur im Umkreis des Quellgelenks“ aktiv ist und ein Knochen im Modus „Gelenke bearbeiten“ ausgewählt ist, erscheint die Vorschau. Drei grüne Außenringe zeigen die Kugelgrenze; drei orange, gestrichelte Innenringe liegen beim halben Radius, wo der weiche Randabfall die Stärke halbiert. Eine schwach transparente Kugelfläche unterstützt die räumliche Orientierung. Die Bedienhinweise sind auf Deutsch und Englisch vorhanden.

Auswahlwechsel, Radiusregler, Gelenkverschiebung und Undo/Redo aktualisieren die Anzeige. Im Modus „Figur bewegen“, bei Wiedergabe und nach Verlassen des Studios ist sie ausgeblendet. Die Vorschau wird nicht im Modell oder Projekt gespeichert und fängt keine Auswahlklicks ab. Sie zeigt den räumlichen Bereich, keine farbige Vertex-Gewichtsanalyse.

## Freie Knochen setzen (0.58.0)

Im Modus **Gelenke bearbeiten** einen vorhandenen Elternknochen auswählen, **＋ Knochen setzen** anklicken und die neue Position auf der Figur anklicken. Neben der Figur liegt die Position auf der aktuellen Ansichtsebene; anschließend lässt sie sich verschieben. Der neue Kindknochen ist mit dem Elternknochen verbunden, kann weitere Kinder erhalten und besitzt zunächst keinen Haut-Einfluss. Zum Zuweisen den Quellknochen auswählen und mit **Einfluss übertragen** Einfluss an den neuen Knochen abgeben. Undo/Redo umfasst jeweils die vollständige Änderung. Vorhandene Posen werden zur Prüfung markiert.

Für Agenten: `add_bone` verwendet `id` des Elternknochens und `position: [x,y,z]` in normalisierten Weltkoordinaten der Grundpose. Nur im Rig-Modus, mit Bearbeitungsfreigabe, aktueller Sitzung und Revision; der Assistent legt den Vorschlag zur Übernahme vor.

Benötigt einen vorhandenen Elternknochen; kein neues Skelett auf einer ungeriggten Oberfläche. Neue Knochen wirken erst nach Gewichtsübertragung auf die Haut. Neue Abzweigungen unter skalierten Quellknochen werden seit 0.72.0 unterstützt; Umhängen und Löschen skalierter Knochen bleiben eingeschränkt. Kontinuierlicher Gewichtspinsel, Gewichtsfärbung und manuelle Hautabnahme bleiben offen. Projekte mit freien Knochen benötigen mindestens 0.58.0; ältere Leser lehnen diese Einträge ab.

## Mit dem Gewichtspinsel malen (0.59.0)

In **Gelenke bearbeiten** den Quellknochen auswählen und unter **Oberflächen-Einfluss übertragen auf** den Zielknochen wählen. **Anteil** und **Radius** einstellen (für den Radiusregler gegebenenfalls **Nur im Umkreis des Quellgelenks** aktivieren). **Mit Pinsel übertragen** anklicken und mit gedrückter linker Maustaste über die Haut ziehen. Der Pinsel gilt immer lokal am Maustreffer, unabhängig von der Umkreis-Checkbox. Beim Aktivieren wird die Grundpose angezeigt. Nach dem Loslassen endet der Strich und die normale Auswahl ist wieder aktiv; zum nächsten Strich den Pinsel erneut aktivieren. Die mittlere Maustaste bleibt zwischen Strichen zur Ansichtsdrehung verfügbar.

Der räumliche Abstand zwischen Aufträgen beträgt ein Viertel des Radius. Leere Quellbereiche ändern nichts. Jeder wirksame Strich erhöht die Revision einmal und lässt sich mit einem Undo vollständig zurücknehmen. Ein Verlust der Mausaufnahme oder Pointer-Abbruch nimmt den laufenden Strich zurück. Gespeichert werden die vorhandenen räumlichen Gewichtsübertragungen, daher ist kein neues Projektformat nötig.

Erste Pinselstufe: kugelförmiger Einfluss, auch durch dünne Oberflächen hindurch; keine Beschränkung auf sichtbare Vertices, keine Gewichtsfärbung. Überlappende Aufträge verstärken den Effekt. Höchstens 128 gespeicherte Übertragungen pro Projekt einschließlich Einzelaufträgen; lange Striche können das Limit erreichen. Große Sprünge und fehlende Oberflächentreffer unterbrechen die Verbindung zwischen Aufträgen. Manuelle Hautqualitäts- und Performance-Abnahme bleibt offen.

## Hautgewichte farbig anzeigen (0.60.0)

Im Modus **Gelenke bearbeiten** einen Knochen auswählen und **Hautgewichte farbig anzeigen** aktivieren. Blau steht für keinen Einfluss, Grün für 50 % und Rot für vollständigen Einfluss des ausgewählten Knochens. Dazwischen liegen interpolierte Farben. Auch nach einer Gewichtsübertragung, beim Malen und nach Undo/Redo zeigt die Ansicht den aktuellen Stand. Zum Prüfen des Zielknochens diesen auswählen.

Die Diagnoseansicht ersetzt vorübergehend die Materialien geriggter Oberflächen durch unbeleuchtete Gewichtsfarben. Ausschalten, Wechsel in **Figur bewegen** oder Verlassen des Studios stellt ursprüngliche Materialien und Vertex-Farben wieder her. Nicht geriggte Teile behalten ihre normale Darstellung. Die Auswahl ist eine lokale Ansichtseinstellung und wird nicht in die Projektdatei geschrieben.

Nur geriggte Oberflächen mit Skinning-Gewichten. Farben werden zwischen Vertices über Dreiecke interpoliert; die Anzeige ist keine Anatomie- oder Qualitätsbewertung. Der bestehende Pinsel bleibt kugelförmig und auf 128 gespeicherte Übertragungen begrenzt. Beschränkung auf sichtbare Vertices, größere Pinselbudgets und manuelle Hautqualitäts-/Performance-Abnahme bleiben offen.

## Pinselbudget und längere Verläufe (0.61.0)

Pinsel und Einzelübertragungen teilen sich jetzt **1024 Aufträge pro Projekt**. Ein Strich bleibt ein gemeinsamer Undo-Schritt. Wird das Limit innerhalb eines Strichs überschritten, wird weiterhin der ganze Strich zurückgenommen. Neue Aufträge berechnen nur die nächste Gewichtsänderung; sie spielen den bisherigen Verlauf nicht erneut ab. Export und Wiederladen erhalten die Aufträge in ihrer Reihenfolge.

Projekte mit mehr als 128 Gewichtsaufträgen benötigen mindestens 0.61.0. Das Projektformat bleibt Version 1; ältere Leser lehnen das größere Budget ab. Laden und Undo/Redo rekonstruieren weiterhin den gespeicherten Verlauf. Die manuelle Performance-Abnahme großer Modelle bleibt offen; keine pauschale Echtzeit-Zusage. Sichtbare Oberflächen begrenzen den kugelförmigen Pinsel weiterhin nicht.

## Gewichtsverläufe messen (0.62.0)

`npm run benchmark:weights` misst dreimal den Rig-Wiederaufbau des mitgelieferten Mika-Modells mit 256 räumlichen Gewichtsaufträgen und gibt Einzelzeiten sowie Median als JSON aus. Der Test verändert keine Projektdateien. Dateiimport, Oberfläche und Rendering sind nicht Teil dieser Messung. Der Chromium-Test protokolliert dagegen die Zeit bis zur Bereitschaftsmeldung nach dem Dateiimport.

Das Budget bleibt bei 1024 Aufträgen. Lokale Messung mit 256 Aufträgen: 1626/1471/1551 ms für den reinen Rig-Reset (Median 1551 ms); vorherige Vergleichsmessung 6375/5903/5718 ms. Dies ist kein vollständiger Browserimport und keine allgemeine Echtzeit-Zusage. Vorberechnete Weltpositionen benötigen 24 Byte pro Vertex statt zuvor 12 Byte für die Positionskopie. Beschränkung des Pinsels auf sichtbare Oberflächen und manuelle Prüfung großer Modelle bleiben offen.

## Nur sichtbare Oberflächen bemalen (0.63.0)

Vor **Mit Pinsel übertragen** die Checkbox **Pinsel nur auf sichtbare Oberfläche** aktivieren. Die Ansicht beim Beginn des Strichs bestimmt, welche Vertices im Blickfeld und nicht durch andere Dreiecke verdeckt sind. Der räumliche Radius und sein weicher Abfall gelten zusätzlich. Nach einer Drehung und einem neuen Strich wird die neue Kamera verwendet. Der alte Strich behält seine gespeicherte Ansicht auch beim späteren Laden oder Undo/Redo.

Für Agenten liefert `get_studio.view` die Kameraposition `eye` und die 16 Werte der kombinierten Projektions-/Ansichtsmatrix `projection`. Sie können unverändert in `transfer_weights.region.view` übernommen werden. Fehlt `view`, bleibt die Übertragung ohne Sichtfilter.

Sichtprüfung bezieht sich auf die ursprüngliche Grundpose. Dreiecke gelten beidseitig als undurchsichtige Hindernisse; Transparenz, Alpha-Ausschnitte und Materialgruppen-Sichtbarkeit werden nicht ausgewertet. Die erste Sichtprüfung baut eine Suchstruktur auf und benötigt zusätzlichen Speicher; große Modelle sind noch nicht manuell abgenommen. Ohne Checkbox gilt weiterhin der kugelförmige Pinsel. Projekte mit `region.view` benötigen mindestens 0.63.0.


### Material-Sichtprüfung ab 0.64.0

**0.64.0:** Neue sichtgefilterte Pinselstriche berücksichtigen ausgeblendete Materialien und Materialgruppen sowie transparente Materialien mit Opazität 0. Die ursprünglichen Materialeigenschaften werden beim Laden festgehalten; eine temporäre Gewichtsfärbung verändert die Auswahl nicht. `region.view.materials: true` speichert diese Regel. Ohne das Feld gilt weiterhin die geometrische Sichtprüfung aus 0.63.0, damit alte Verläufe unverändert bleiben.

Teiltransparente Materialien und Alpha-Texturen gelten weiterhin als undurchsichtige Hindernisse; Dreiecke bleiben beidseitig. Große Modelle und Materialdarstellung sind noch nicht manuell abgenommen. Dateien mit dem neuen Feld benötigen mindestens 0.64.0.


### Alpha-Ausschnitte ab 0.65.0

**0.65.0:** Neue sichtgefilterte Pinselstriche berücksichtigen Alpha-Ausschnitte über `alphaTest`, Bildalpha und den Grünkanal einer `alphaMap`. Die Prüfung interpoliert UVs am Strahltreffer und berücksichtigt Texturtransformation, UV-Kanal, Wiederholung, Spiegelung, Flip und Nearest-/Linear-Vergrößerungsfilter. Pixel und Materialdaten werden beim Laden festgehalten. `region.view.alpha: true` zusammen mit `materials: true` speichert die neue Regel; ältere Aufträge behalten ihre bisherige Sichtprüfung.

Die Alpha-Prüfung verwendet deterministisch die Basisebene der Textur, keine Mipmaps oder anisotrope Filterung. Dadurch sind Abweichungen zur gerenderten Kante bei Verkleinerung möglich. Unterstützt sind lesbare RGBA-8-Bit-Bilder bis 16.777.216 Pixel pro Textur. Nicht lesbare/komprimierte Texturen, fehlende UVs, Shader-Materialien und Alpha-to-Coverage bleiben verdeckend. Teiltransparenz wird nicht simuliert; Dreiecke bleiben beidseitig. GPU-/Materialqualität und große Modelle sind nicht manuell abgenommen. Neue Alpha-Aufträge benötigen mindestens 0.65.0; kein automatischer Umbau alter Verläufe.

### Neue Abzweigungen unter skalierten Eltern

Seit **0.72.0** können neue Knochen auch unter gleichmäßig, ungleichmäßig oder negativ skalierten Quellknochen platziert werden. Die Weltposition wird über die inverse Elternmatrix in die lokale Grundpose umgerechnet; die Skalierung der Quelle bleibt erhalten. Nicht invertierbare Elternmatrizen und lokale Koordinaten außerhalb ±100 werden ohne Änderung der Studio-Daten abgewiesen. Das gilt für neue Abzweigungen, nicht für das Umhängen oder Löschen skalierter Knochen. Anatomische IK-Qualität bleibt separat zu prüfen.

Seit **0.73.0** können skalierte Endknochen ohne Kinder oder Anbauteile gelöscht werden. Ihre Hautgewichte gehen an den Elternknochen; die Grundgeometrie bleibt erhalten. Gespeicherte Posen verlieren die Spur des entfernten Knochens und müssen auf veränderte Bewegung geprüft werden. Skalierte Zwischenknochen sowie Knochen mit Anbauteilen bleiben gesperrt.

Seit **0.74.0** ist Umhängen innerhalb eines gemeinsam skalierten Teilbaums möglich: Nur die beiden Äste unterhalb ihres nächsten gemeinsamen Vorfahren müssen unskaliert sein. Die gemeinsame Transformation entfällt bei der Umrechnung der Grundpose, gespeicherten Posen und des Entwurfs. Gemeinsame gleichmäßige, ungleichmäßige und negative Skalierungen sind unterstützt; nicht invertierbare gemeinsame Skalierungen werden abgewiesen. Unterschiedliche Skalierungen auf den betroffenen Ästen und Anbauteile mit eigenem Skelett bleiben ausgeschlossen.

Seit **0.75.0** können Knochen zwischen Ästen mit gleicher kumulierter positiver gleichmäßiger Skalierung umgehängt werden, etwa zwischen 4 × 0,5 und 2. Die Umrechnung berücksichtigt die tatsächlichen Quellskalierungen unterhalb des gemeinsamen Vorfahren. Bis 0.75.0 musste der verschobene Knochen selbst unskaliert bleiben; seit 0.76.0 bleibt seine eigene invertierbare Quellskalierung beim Umhängen erhalten. Ungleiche, nicht gleichmäßige oder negative Astskalierungen bleiben ausgeschlossen; die gemeinsame Vorfahrenskalierung darf wie seit 0.74.0 ungleichmäßig oder negativ sein. Vorhandene Posen und Hautqualität weiterhin visuell prüfen.

Seit **0.76.0** darf der umgehängte Knochen selbst gleichmäßig, ungleichmäßig oder negativ skaliert sein. Seine Quellskalierung bleibt unverändert; die Positions-/Drehungsumrechnung erfolgt ohne diese eigene Skalierung, damit Spiegelungen nicht in eine falsche Drehung umgewandelt werden. Nicht invertierbare Knochenskalierungen werden abgewiesen. Die Elternäste müssen weiterhin dieselbe positive gleichmäßige Gesamtskalierung besitzen. Gerenderte Haut- und Bewegungsqualität bleiben separat zu prüfen.

Seit **0.77.0** exportiert „Figur als GLB (Standbild)“ die aktuelle sichtbare Form als eigenständige GLB-Datei. Haut-/Morph-Verformung, freie Oberflächenpunkte und Welttransformation werden in statische Geometrie übernommen; Materialien und UVs bleiben erhalten. Die Datei enthält kein Rig, keine Studio-Punkte und keine Animationen. Für spätere Bearbeitung zusätzlich das Studio-Projekt speichern. Unsichtbare Zweige werden ausgelassen; Instanzen und teilweise ausgeblendete Materialgruppen werden ausdrücklich abgewiesen. Bei Studio-Änderung, Wiedergabestart oder Schließen vor Abschluss wird das Ergebnis verworfen. Der Export verändert weder Projekt noch Undo-Stand. Texturqualität und Dateigröße hängen vom Modell ab.

Seit **0.78.0** bietet „Figur als GLB (mit Rig)“ zusätzlich eine eigenständige Datei mit aktuellem Hautskelett an. Knochenhierarchie, Hautgewichte, Bindematrizen, Material-/Geometriedaten und aktuelle Form werden unabhängig kopiert; Studio-Hilfen werden nicht übernommen. Die Quelle und der Undo-/Dirty-Stand bleiben erhalten. Die Datei enthält noch keine Animationsclips oder Studio-Moves. Für Studio-Punkte und weitere Bearbeitung das vollständige Projekt zusätzlich speichern. Modelle ohne sichtbares Hautskelett, externe Knochenverweise, ausgeblendete Knochenhierarchien, Instanzen und ausgeblendete Materialgruppen werden mit einer Meldung abgewiesen.

**Korrektur 0.78.1:** Einfügen, Gewichtsübertragung vom Elternknochen und anschließendes Löschen dieses Knochens bleiben beim Replay erhalten. Frühere Elternbezüge dienen ausschließlich der korrekten Berechnung der Einfügeachse. Projektformat unverändert; Undo/Redo und erneutes Laden geprüft.

Seit **0.79.0** exportiert „Move als GLB (mit Rig)“ den ausgewählten eigenen Studio-Move mit Hautskelett als einen Animationsclip. Gelenkbewegung und Figurenverschiebung/-drehung/-größe werden übernommen, einschließlich Drehung um den Figurenmittelpunkt und Schleifenschluss. Ausgabe mit 30 Stützstellen pro Sekunde und allen Schlüsselposen; Wiedergabeschleifen im Zielprogramm einstellen. Bis 0.79.0 waren bewegte freie Oberflächenpunkte ausgeschlossen; seit 0.80.0 werden sie als Morph-Animation ausgegeben. Geschert aufgebaute Modellräume und zu umfangreiche Sequenzen werden weiterhin ausdrücklich abgewiesen. Originalclips und Retargeting gehören nicht zu diesem Export. [Exportanleitung](GLB-EXPORT.md).

Seit **0.80.0** übernimmt „Move als GLB (Animation)“ auch bewegte freie Oberflächen-/Gesichtspunkte als Morph-Animation, mit oder ohne vorhandenes Skelett. Unterschiedliche Oberflächenposen werden je betroffenem Mesh zusammengefasst und an den ursprünglichen Schlüsselzeiten linear gewichtet; Knochen- und Figurenbewegung bleiben kombiniert enthalten. Vorhandene Positions-/Normal-Morphs und deren konstante Gewichte werden berücksichtigt. Normale zwischen Posen werden angenähert interpoliert. Speicher-, Zielanzahl- und Arbeitsbudgets werden vor dem Kopieren und Berechnen geprüft; umfangreiche Sequenzen werden mit Hinweis abgewiesen. Studio-Projekt für die ursprünglichen Kontrollpunkte zusätzlich speichern. [Anleitung](GLB-EXPORT.md).

Seit **0.82.0** können Knochen zwischen unterschiedlich stark, positiv und gleichmäßig skalierten Ästen umgehängt werden. Beispiel: Vom Astmaßstab 2 zu 3 wird die lokale Skalierung des verschobenen Knochens mit 2/3 ausgeglichen. Grundstellung, gespeicherte Schlüsselposen, Entwurf, Hautgewichte und starre Anbauteile behalten ihre bisherigen Welttransformationen. Der Ausgleich wird bei Reset und Projektladen aus der unveränderten Quelle und der Umbaufolge rekonstruiert; Zurück/Wiederholen und Rückkehr zum Original bleiben möglich. Die eigene ungleichmäßige oder negative Skalierung des verschobenen Knochens bleibt mit diesem positiven Faktor kombinierbar. Nicht gleichmäßige/negative Elternäste, Anbauteile mit eigenem Skelett und nicht invertierbare Ausgleiche bleiben gesperrt. Bewegungsverläufe zwischen Schlüsselposen und die Hautqualität weiterhin visuell prüfen. Projekte mit diesem neuen Fall benötigen mindestens 0.82.0; Projektformat bleibt Version 1. [Prüfbericht](PRUEFUNG.md#version-0820).


Seit **0.84.0** stehen die bearbeiteten Original-PaKaChi-Formen mit gemeinsamer 31-Gelenk-Hierarchie im Model Zoo. Für Arm-/Bein-IK das Handgelenk beziehungsweise den Knöchel als Ende der Zweiglied-Kette greifen; Hände/Füße sind nachgelagerte separate Punkte. Augen, Kiefer, Ohren und Schwanz sind zusätzlich vorhanden. Posen lassen sich in beiden Formen bearbeiten, rückgängig machen und speichern. Dies sind riggbare Charakterentwürfe; der 3D-Formwechsel folgt nach der gemeinsamen Netzkorrektur. [Aufbereitung und Grenzen](KI-GENERIERUNG.md#rigging-und-charakteraufbereitung).


Seit **0.85.0** besitzen beide Formen 59 Gelenke einschließlich Finger und Zehen. Im Modus **Figur bewegen** im Gelenkfeld beispielsweise `LeftIndex1` oder `LeftIndex2` auswählen, die Griffe auf **Drehen** stellen und einen Drehring ziehen. `LeftThumb1/2` bewegt den Daumen, `LeftToe1Base/Tip` eine hintere Zehe; die rechte Seite heißt entsprechend `Right…`. Jedes Glied bewegt seine eigene Geometrie, einschließlich der grünen Spitze. Posen, Projektdateien und Rig-GLB-Export erhalten die Fingerstellung. Die 31-Gelenk-Projekte enthalten weiterhin ihre eingebettete frühere Modellfassung; alte Moves werden nicht automatisch auf den erweiterten Rig übertragen. Große Beugungen und Anschlüsse weiter visuell prüfen.


## Oberflächenverformung einer Pose prüfen

Eine gespeicherte Pose auswählen und **Oberfläche der Pose prüfen** anklicken. Die Prüfung verändert weder die aktuelle Figur noch gespeicherte Daten. Verglichen werden die Dreiecke der aktuellen Grundform mit derselben Oberfläche in der gespeicherten Pose. Die Meldung unterscheidet eine Überschreitung der Warnschwellen von einer nicht auswertbaren Oberfläche. **Messwerte nach Teilmodell** zeigt die einzelnen Netze, kleinste/größte Hauptdehnung und bereits in der Grundform degenerierte, nicht messbare Dreiecke (`∅`). Die Zähler beziehen sich auf Dreiecke (`△`), nicht auf Gelenke.

Die festen Warnschwellen sind Dehnung unter 0,25× oder über 3× sowie eine Dreiecksfläche unter 0,1× der Grundfläche. Sie sind ein erster Filter für starke Verzerrungen, keine bestätigten Material- oder Anatomiegrenzen. Reines Verschieben/Drehen der Figur und ihrer starren Teile erzeugt keine Dehnung. Schon fehlerhafte, aber unverformte Grundformen können diese Prüfung bestehen.

Im Modus **Figur bewegen** versucht **Schonendere Pose erstellen** nacheinander 87,5 %, 75 %, 50 %, 25 %, 12,5 % und 6,25 % der Bewegung von der Grundform zur gespeicherten Pose. Positionen werden interpoliert, Drehungen per Quaternion interpoliert; die Gesamtposition/-drehung/-skalierung bleibt erhalten. Der erste Kandidat innerhalb der Oberflächen- und vorhandenen Beugegrenzen wird als zusätzliche Pose **… · Prüfkandidat** gespeichert und angezeigt. Die übrigen gespeicherten Posen und Bewegungen bleiben erhalten. Mit **Zurück** lässt sich die gesamte Anlage rückgängig machen; zum dauerhaften Aufbewahren das Projekt speichern. **Vorschlag abbrechen** beendet die Suche; Änderungen am Projekt oder ein anderer ausgewählter Poseintrag verwerfen veraltete Ergebnisse.

Die Suche schwächt Bewegungen ab. Sie repariert keine falschen Hautgewichte, keine Knochenhierarchie und keine ungeeignete Netzstruktur. Sie prüft weder Kollisionen noch Faltungen, verdeckte Anatomie, Silhouetten oder sämtliche Zwischenbilder einer Bewegung. Ein Prüfkandidat muss deshalb in der Vorschau bewertet werden; er wird keiner bestehenden Bewegung automatisch zugeordnet. Werden selbst die kleinsten Varianten verworfen, bleiben die Daten unverändert.
