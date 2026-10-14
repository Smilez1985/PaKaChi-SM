# Avatar-Studio – 0.12.0

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
