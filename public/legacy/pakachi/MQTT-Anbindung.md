# Pakachi: MQTT-Zustandssteuerung

## Start

ZIP vollständig entpacken, `index.html` öffnen. Unter „Agent verbinden“ WebSocket-Adresse und Status-Topic eintragen, optional Benutzername/Passwort. Erst der Schalter „MQTT-Empfang einschalten“ stellt eine Verbindung her. Bei jedem Öffnen ist der Schalter wieder aus. Einstellungen und Zugangsdaten werden nicht dauerhaft gespeichert. Ausschalten trennt die Verbindung und beendet Wiederholungsversuche; Pakachi hält seinen letzten Zustand.

NanoMQ stellt dafür einen MQTT-WebSocket-Listener bereit. Beispiel aus der aktuellen Dokumentation:

```hcl
listeners.ws {
  bind = "0.0.0.0:8083/mqtt"
}
```

Player-Adresse beispielsweise `ws://127.0.0.1:8083/mqtt`, Topic `pakachi/status`. Bei einem anderen Rechner die Broker-IP/Adresse einsetzen. HTTPS-Seiten brauchen in der Regel einen sicheren `wss://`-Endpunkt; der lokale Player kann als Datei geöffnet werden. Der Agent kann denselben Broker über dessen MQTT/TCP-Port benutzen; Player und Agent müssen nicht denselben Transport nutzen.

Quellen: [NanoMQ Listener](https://nanomq.io/docs/en/latest/config-description/listener.html), [MQTT 3.1.1 / WebSocket-Transport](https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html).

## Nachrichten

Auf dem Status-Topic wahlweise Klartext:

```text
working
```

oder JSON:

```json
{"state":"working"}
```

`{"status":"thinking"}` wird ebenfalls akzeptiert. Zustandsnamen sind kleingeschrieben. Unbekannte Zustände, fehlerhaftes JSON und zu große Nachrichten werden ignoriert; der letzte gültige Zustand bleibt erhalten.

| Zustand | Zielgestalt |
|---|---|
| idle | Tier |
| talking | Tier |
| sleeping | Tier |
| error | Tier |
| thinking | Humanoid |
| working | Humanoid |
| waiting | Humanoid |
| review | Humanoid |

Die Formzuordnung ist eine Vorgabe des Players, nicht Teil von MQTT. Sie kann über `forms` beim Erzeugen des `PakachiController` angepasst werden. Agent/Harness meldet nur den aktuellen Zustand.

## Verwandlungslogik

Tier → humanoider Zustand: vorhandene 72-Frame-Verwandlung einmal vorwärts, dann humanoid bleiben. Humanoid → Tierzustand: vorläufig dieselbe Sequenz rückwärts, dann Tier bleiben. Neue Zustände derselben Gestalt spielen keine neue Verwandlung. Eine Meldung während eines Übergangs verändert dessen Ziel; bei gegensätzlichem Ziel dreht der Player direkt an seiner aktuellen Position um. Neueste gültige Meldung gewinnt.

Wenn ein Harness mehrere Aufgaben parallel hat, sollte es seinen Gesamtzustand publizieren, statt jede Aufgabe unabhängig `idle` melden zu lassen. Retained-Nachrichten sind erlaubt und liefern einem neu verbundenen Player den letzten Zustand. Bei Bedarf kann das Harness eine retained `idle`-Nachricht als MQTT Last Will verwenden, um einen abgestürzten Agenten abzubilden. Diese Entscheidung trifft der Absender.

## Beispielsender

Mit installiertem Mosquitto-Client:

```sh
mosquitto_pub -h 127.0.0.1 -p 1883 -t pakachi/status -m working
mosquitto_pub -h 127.0.0.1 -p 1883 -t pakachi/status -m thinking
mosquitto_pub -h 127.0.0.1 -p 1883 -t pakachi/status -m idle
```

## Lokale API

```js
window.Pakachi.setStatus('thinking');
window.Pakachi.setStatus({state:'working'});
window.Pakachi.setWorking(true); // kompatibler Kurzaufruf
window.Pakachi.getState();
window.Pakachi.getMQTTState();
window.dispatchEvent(new CustomEvent('pakachi:context', {
  detail: {state:'idle'}
}));
```

`pakachi:state` wird bei Wechsel des Zustands oder der Übergangsphase ausgelöst. Manuelle Bedienung bleibt möglich; eine spätere MQTT-Nachricht übernimmt wieder.

## Aktueller Funktionsumfang

MQTT 3.1.1 über Browser-WebSocket, Clean Session, Keepalive, automatischer Wiederverbindungsversuch (1 bis 30 Sekunden), optional MQTT-Benutzername/Passwort, ein genaues Topic, QoS0-Abonnement, QoS1-Empfangsbestätigung. Keine externen JavaScript-CDNs oder Laufzeitpakete nötig. Dieses kleine Modul ist auf Statusnachrichten begrenzt; es ist keine allgemeine MQTT5-Bibliothek.

Statusrouter und Formwechsel funktionieren. **Die eigenen Animationen für talking/thinking/working usw. fehlen noch.** Der Player zeigt gegenwärtig die 72-Frame-Verwandlung und hält die passende Endform als Standbild. Tablet-Aufnahme, Tablet-Arbeitsschleife, lebendige Tier-Ruheschleife und weitere Zustandsanimationen bleiben separate Bildpakete. Die gespeicherte Verwandlung ist visuell noch ein Entwurf mit offenen Farb-/Material- und Haltungskorrekturen. Das ChatGPT-Pet wurde nicht geändert.

## Prüfung

`node tests/controller.cjs`: Formzuordnung, Halten, Richtungswechsel mitten im Übergang, ungültige Nachrichten, Paketfragmentierung, ausgeschalteter Standardzustand.

`node tests/lifecycle.cjs`: Wiederverbindung, Ausschalten beendet geplante Wiederholungen.

`python tests/websocket-broker.py` (benötigt Python-Paket `websockets`): echter lokaler WebSocket-Transport mit einer Protokoll-Testgegenstelle; CONNECT, Zugangsdaten, SUBSCRIBE, SUBACK, retained Publikation, QoS1-Bestätigung, Zustandssteuerung und DISCONNECT. **Nicht gegen einen echten NanoMQ-Server getestet.** Die Gegenstelle ist nur eine Testfixture, kein mitgelieferter Broker.
