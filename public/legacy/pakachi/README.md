# Pakachi — eigenständiger Player, Prototyp 1

ZIP vollständig entpacken und `index.html` im Browser öffnen. Bilder und JavaScript liegen lokal. Ohne eingeschalteten MQTT-Empfang benötigt die Wiedergabe weder Server noch Netzwerkzugriff.

## Bedienung

„Normaler Chat“ führt in die Tierform; „Arbeiten“ spielt die Verwandlung einmal vorwärts und hält die humanoide Form. Im Feld „Zustand“ lassen sich außerdem Sprechen, Denken, Warten, Prüfen, Fehler und Schlafen auswählen. Gleichbleibende Form bedeutet keine erneute Verwandlung. Ein entgegengesetzter Status während einer Verwandlung kehrt deren Richtung an der aktuellen Stelle um.

Der optionale MQTT-Empfang ist bei jedem Öffnen aus. Broker-WebSocket-Adresse, Topic und optionale Zugangsdaten eintragen und den Schalter einschalten. Ein Agent oder Harness publiziert dann nur den aktuellen Zustand, beispielsweise `{"state":"working"}` auf `pakachi/status`. Details, Formzuordnung, NanoMQ-Konfiguration und Beispiele in [MQTT-Anbindung.md](MQTT-Anbindung.md).

## Integration

`pakachi-controller.js` steuert Zustände und Übergänge unabhängig vom Browser. `pakachi-mqtt.js` empfängt Statusnachrichten über MQTT3.1.1/WebSocket. `pakachi-ui.js` verbindet Steuerung, Oberfläche und Bildwiedergabe. Keine JavaScript-Bibliotheken müssen nachgeladen werden.

```js
window.Pakachi.setStatus('thinking');
window.Pakachi.setStatus({state:'working'});
window.Pakachi.setStatus('idle');
window.Pakachi.getState();
```

Die Zuordnung im Standard ist Tierform für idle/talking/sleeping/error; Humanoid für thinking/working/waiting/review. Die Host-Anwendung entscheidet über den aktuellen Gesamtstatus. Pakachi erkennt den Gesprächskontext nicht selbst.

## Bildstand und nächste Schritte

72 Transformationsframes im Entwurf, Export768×832, transparente APNG24FPS/3s. Quelldetail teilweise etwa500–600Pixel, auf Exportauflösung skaliert. Haltungssprünge, warm-metallische Materialien und verlorene Fellstruktur müssen noch korrigiert werden. Die Rückverwandlung nutzt vorläufig dieselben Bilder rückwärts. Endformen halten derzeit als Standbilder; zustandsspezifische lebendige Schleifen fehlen noch.

Die72Frames gehören ausschließlich zur Verwandlung, ohne Tablet/Stift. Danach separate zusätzliche Bilder für schwarz-grünes Tablet aufnehmen/halten und darauf kritzeln; daran dauerhaft humanoide Arbeitsschleife anschließen. Später weitere Zustandsanimationen, Tierform-Ruheschleife und Tablet weglegen.

Zwei Ausgaben bleiben geplant: reduziertes ChatGPT-Pet innerhalb der App-Zustände und diese eigenständige Version mit eigener Zustands-/Übergangssteuerung. Aktives ChatGPT-Pet unverändert.

Spätere Zielplattform: Chimera auf Whisplay, Rendering einfacher Formen/Attribute in getrennten NumPy/Pillow-Ebenen aus der hochwertigen Designvorlage. Dazu jetzt noch keine Recherche oder Umsetzung.

## Validierung

Formwechsel und MQTT-Protokoll wurden automatisiert geprüft; Tests und genaue Grenzen in MQTT-Anbindung.md. Transporttest gegen lokale WebSocket-Testgegenstelle, nicht gegen einen echten NanoMQ-Server.
