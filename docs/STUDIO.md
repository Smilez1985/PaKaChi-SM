# Avatar-Studio – 0.5.0

Das Studio ist Teil des Players. Mika, Nori und eigene GLB-Modelle können bearbeitet werden. Der Original-PaKaChi bleibt mit beiden Formen und 72 Bildern erhalten; für ihn fehlt weiterhin das entsprechende 3D-Modell. Seine Bilder werden durch den Editor nicht verändert.

## Eine erste eigene Bewegung

1. Im Player einen 3D-Avatar auswählen und **Avatar-Studio** öffnen. Die laufende Animation hält an und die Grundpose wird angezeigt.
2. In **Figur bewegen** einen Skelettpunkt anklicken oder aus der Liste wählen. An einem farbigen Achsgriff ziehen. Unter **Griffe → Drehen** lässt sich ein Skelettpunkt drehen; seine gebundenen Körperteile folgen. X/Y/Z ermöglichen genaue Positionen.
3. Einen Posenname eingeben und **Aktuelle Pose speichern** wählen. Figur verändern und eine zweite Pose speichern.
4. Die Übergangszeit jeder Pose festlegen. Mit **Früher/Später** wird die Reihenfolge für die nächste gespeicherte Bewegung geändert. **Anzeigen** lädt eine Pose; **Ersetzen** übernimmt die aktuelle Haltung.
5. Bewegungsname und eindeutiges Schlagwort eingeben, z. B. `laecheln`. **Bewegung speichern** übernimmt alle Posen in der angezeigten Reihenfolge. Eine Bewegung benötigt mindestens zwei Posen. Optional läuft sie als Schleife.
6. **Vorschau** abspielen oder zurück zum Player wechseln. Die eigene Bewegung steht dort in der Bewegungslegende und über MQTT/MCP zur Verfügung.
7. **Speichern** lädt eine `.pakachi.json`-Projektdatei herunter. Sie enthält das ursprüngliche Modell, das bearbeitete Kontrollsystem, die aktuelle Arbeitspose, gespeicherte Posen und Bewegungen. **Projekt laden** öffnet diese Datei später wieder vollständig, auch ohne die ursprüngliche GLB-Datei.

Die Zeit der ersten Pose bestimmt bei Schleifen den Rückweg vom letzten zum ersten Bild. Bei einmaligen Bewegungen startet die erste Pose sofort; die folgenden Zeiten bestimmen die jeweiligen Übergänge. Nach einer einmaligen Bewegung im Player folgt wieder der aktive Grundzustand. Eigene Bewegungen verwenden Positionsinterpolation und Quaternion-Interpolation für Drehungen. Der Wechsel zwischen Originalclips und eigenen Moves erfolgt in dieser Version direkt; die 180-ms-Überblendung gilt für Originalclips untereinander.

## Freie Gesichtspunkte und Verbindungen

In **Gelenke bearbeiten** zuerst **Punkt setzen**, dann auf die gewünschte Stelle der Figur klicken. Ein Klick neben die Figur setzt einen freien Punkt auf die Ansichtsebene. Anschließend kann er über die Achsgriffe auch in der Tiefe verschoben werden.

Es gibt keine vorgegebene Anzahl oder erzwungene Gelenkkette: beispielsweise drei Punkte am Mund, einen pro Auge oder mehrere an jedem Augenlid. Mausrad zoomt zum Zeiger; rechte Maustaste verschiebt die Ansicht. Seit 0.5.0: **Mausrad drücken und halten (Maustaste 3)** und die Maus bewegen, um frei um alle Achsen zu drehen; Bewegungen am Rand der virtuellen Kugel rollen die Ansicht. Linkes Ziehen bewegt einen Punkt direkt auf der Ansichtsebene; die farbigen Griffe erlauben achsengebundene Änderungen. Rechts ziehen verschiebt die Ansicht, das Mausrad zoomt. Zur Navigation sind keine Tastatur-Modifikatoren oder Ansichtsbuttons nötig. Feste Ansichten und Rolltasten bleiben optional verfügbar; der Sockel ist im Studio ausgeblendet.

- **Punktgröße** verändert nur die sichtbare Kugel. Kleine Mundpunkte können unabhängig von großen Kniepunkten eingestellt werden. Eine Mindest-Auswahlfläche von 10 Bildschirmpixeln erleichtert das Treffen kleiner Punkte; bei dicht benachbarten Punkten hilft die Auswahlliste.
- **Einflussbereich** bestimmt separat, wie weit die Oberflächenverformung reicht. Sie fällt zum Rand weich ab. Ein Punkt auf einer Oberfläche wirkt zunächst nur auf dieses Teilmodell; ein frei im Raum gesetzter Punkt kann mehrere Oberflächen in seinem Radius beeinflussen. Zu kleine Radien können zwischen groben Vertices liegen und dann keine sichtbare Verformung erzeugen.
- **Verbinden / lösen** und anschließend der zweite Punkt erzeugen oder entfernen eine freie Verbindung. Getrennte Mund-, Augen- und Körpergruppen sind möglich. Es gibt keinen Zwang, sie an ein vorhandenes Skelett anzuschließen.
- In **Figur bewegen** kann **Verbundene freie Punkte gemeinsam bewegen** aktiviert werden. Die verbundenen Oberflächenpunkte verschieben sich dann zusammen. Verbindungen erzeugen keine automatische Gelenkphysik oder inverse Kinematik.
- Freie Oberflächenpunkte folgen beim Posieren der Hautbindung am nächstgelegenen Vertex. Ihre eigene Verformung wird vor der Skelettverformung angewendet. Bei komplexen Gelenkübergängen muss die Zuordnung visuell geprüft werden.

## Bestehende Skelettpunkte und Änderungen

Ein Skelettpunkt verändert in **Gelenke bearbeiten** den Drehpunkt in der Grundpose. Die vorhandene Oberfläche bleibt dabei stehen; die Hautbindung wird für die eigenen Studio-Posen aktualisiert. Die Originalclips bleiben mit ihrem ursprünglichen Skelett abspielbar.

**Kontrollpunkt löschen** entfernt einen freien Punkt und seine Verformung vollständig. Bei einem vorhandenen Skelettpunkt entfernt es dessen bedienbaren Griff; der zugrunde liegende Knochen und seine Gewichte im Quellmodell bleiben bestehen. Beliebige Quellknochen hinzufügen/löschen, neu gewichten und automatisch zu vollständigen Gelenkketten zusammenbauen ist noch nicht implementiert.

Posen und eigene Moves bleiben bei Punktänderungen erhalten. Neue Punkte werden in vorhandenen Posen in Grundstellung ergänzt; gelöschte Punkte werden aus ihnen entfernt. Nach einer Drehpunkt- oder Einflussänderung vorhandene Bewegungen ansehen und gegebenenfalls korrigieren. Es gibt noch keine automatische Reparatur ihrer Bedeutung. Eine von Moves verwendete Pose kann erst nach Löschen dieser Moves gelöscht werden. Änderungen an einer vorhandenen Pose und ihrer Zeit wirken auf alle Moves, die sie verwenden; die Reihenfolge eines bereits gespeicherten Moves bleibt erhalten.

**Zurück/Wiederholen** hält bis zu 40 Bearbeitungsschritte bereit, einschließlich vollständiger Ziehgesten. **Neu** setzt das aktuelle Modell auf seine ursprünglichen Skelettgriffe zurück und entfernt eigene Posen/Moves; auch dieser Schritt lässt sich rückgängig machen.

## Dateien, Agenten und Grenzen

- Beim Avatarwechsel, Projektwechsel und Schließen der Seite wird auf ungespeicherte Änderungen hingewiesen. Es gibt keine automatische dauerhafte Speicherung; die Projektdatei herunterladen.
- Während der Studio-Bearbeitung werden Zustands-/Move-Befehle aus MQTT, MCP und der Browser-API mit einer verständlichen Fehlermeldung abgewiesen. Es gibt keine nachträglich abgespielte Warteschlange. Zurück im Player sind eigene Moves normal steuerbar.
- Maximal 256 Kontrollpunkte, 100 Posen und 100 eigene Moves pro Projekt; maximal 80 MB beim Projektimport. Eingebettete Modelldaten unterliegen zusätzlich dem GLB-Limit von 50 MB. Aufwendige Modelle und viele gleichzeitig verformende Punkte können langsam sein.
- Die Datei ist ein versioniertes Studio-Projekt, kein GLB-Export und kein automatischer Eintrag im gemeinsamen Model Zoo auf GitHub. Die eigenen Moves werden mit dem geladenen Projekt im Player angeboten.
- Keine automatische 3D-/Skelettgenerierung, Gewichts-Malwerkzeuge, IK, globale Transformationsspur für knochenlose Modelle oder eigenständiger GLB-Export.
- Automatisierte Geometrie-, Daten- und DOM-Tests sind bestanden. Die visuelle Maus-/WebGL-Abnahme muss weiterhin in einem Browser erfolgen; Chromium kann in der aktuellen Ausführungsumgebung nicht starten.


## Automatische Erkennung und einzelne Verbindungen

Im Modus **Gelenke bearbeiten** stehen **Joints automatisch erkennen** und **Joint-Verbindungen automatisch erkennen** bereit. Die Erkennung liest vorhandene Knochen und deren Eltern-Kind-Beziehungen aus dem 3D-Modell. Schon vorhandene Griffe werden nicht doppelt angelegt; eigene Punkte, Namen und Größen bleiben erhalten. Gelöschte Skelettgriffe lassen sich erneut erkennen. Verbindungen werden nur zwischen vorhandenen Skelettgriffen ergänzt.

Für selbst gesetzte Punkte: ersten Punkt auswählen, **Verbinden / lösen**, zweiten Punkt anklicken. Eine bestehende Verbindung wird dabei gelöst. Die Liste **Verbindungen** zeigt alle Verbindungen; **Verbindung entfernen** löscht genau diese eine Verbindung, unabhängig von ihrer Herkunft. Punkte und andere Verbindungen bleiben bestehen. Erkennung, Löschen und direktes Ziehen unterstützen Zurück/Wiederholen.

Die Buttons sind noch keine KI-Anatomieerkennung: Für Modelle ohne Skelett und für freie Gesichtspunkte bleibt anatomisches KI-Rigging offen. Verbindungen freier Punkte bilden Bearbeitungsgruppen; sie erzeugen keine neuen Knochen oder automatische Hautgewichte.

## Optionen

**Optionen** in der linken Leiste enthält Deutsch/English und **Drehrichtung der mittleren Maustaste invertieren**. Beide Einstellungen werden lokal im Browser gespeichert und sofort angewendet. Studio-Bedienelemente wechseln die Sprache, benutzervergebene Namen bleiben erhalten. Der archivierte Original-Bildplayer bleibt unverändert auf Deutsch; Modellbeschreibungen und einzelne technische Fehlermeldungen sind noch nicht vollständig lokalisiert.
