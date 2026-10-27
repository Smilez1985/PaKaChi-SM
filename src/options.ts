import {mountProviderPanel} from './provider-panel.ts';
export interface Options {language:'de'|'en';invertMiddleRotation:boolean}
export function readOptions(storage?:Pick<Storage,'getItem'>):Options {
  try{const value=JSON.parse((storage??localStorage).getItem('pakachi-options-v1')??'{}');return {language:value.language==='en'?'en':'de',invertMiddleRotation:value.invertMiddleRotation===true};}catch{return {language:'de',invertMiddleRotation:false};}
}
export const options=readOptions();
const translations:Record<string,string>={
  "Oberflächen-Einfluss übertragen auf":"Transfer skin influence to",
  "Anteil":"Amount",
  "Nur im Umkreis des Quellgelenks":"Only within the source joint radius",
  "Radius":"Radius",
  "Einfluss übertragen":"Transfer influence",
  "Zielknochen auswählen …":"Select target bone …",
  "Oberflächen-Einfluss übertragen. Posen und Bewegungen prüfen.":"Skin influence transferred. Review poses and motions.",
  "Überträgt Einfluss des gewählten Knochens. Im Umkreis nimmt die Stärke zum Rand weich ab; außerhalb bleibt die Hautzuordnung unverändert. Grüne Außenringe zeigen die Grenze, orange Innenringe die halbe Stärke. Die Vorschau zeigt den räumlichen Bereich, nicht die tatsächlich gewichteten Vertices. Bezug ist die ursprüngliche Grundpose. Ohne Umkreis gilt die Übertragung überall. Grundpose bleibt erhalten; Posen und Bewegungen prüfen. Pro Oberflächenpunkt bleiben höchstens vier Einflüsse.":"Transfers influence from the selected bone. Within the region, strength fades smoothly towards the edge; skin weights outside stay unchanged. Green outer rings show the boundary; orange inner rings show half strength. This is a spatial guide, not a display of vertices with skin weights. Coordinates refer to the original rest pose. Without a region, the transfer is global. Rest geometry stays unchanged; review poses and motions. Each vertex retains at most four influences.",
  'Ungültiges Bewegungspaket. Maximal 8 Bewegungen und insgesamt 200 Posenverweise.':'Invalid motion batch. At most 8 motions and 200 pose references in total.',
  'Gemeinsame Move-Sammlung':'Shared move collection','Sammlung laden':'Load collection','Aus Sammlung importieren':'Import from collection',
  'Die Sammlung gehört zur Anwendung. Import nur bei passendem Modell und Rig.':'The collection belongs to this application. Import requires a matching model and rig.',
  'Move-Sammlung geladen.':'Move collection loaded.','Die Move-Sammlung ist leer.':'The move collection is empty.',
  'Move-Sammlung nicht erreichbar.':'Move collection unavailable.','Move-Sammlung: Datei zu groß.':'Move collection: file too large.','Move-ID passt nicht zum Katalog.':'Move ID does not match the catalog.',
  'IK-Beugegrenze':'IK flexion limit','Minimale Beugung':'Minimum flexion','Maximale Beugung':'Maximum flexion',
  'Ungültige IK-Beugegrenze.':'Invalid IK flexion limit.',
  'IK-Beugegrenze geändert. Gespeicherte Bewegung prüfen.':'IK flexion limit changed. Review the saved motion.',
  '0° ist gestreckt. Gilt beim Ziehen des Endpunkts einer Zweiglied-Kette. Direkte Drehung und gespeicherte Moves bleiben unverändert.':'0° is straight. Applies when dragging the endpoint of a two-segment chain. Direct rotation and saved moves remain unchanged.',
  'Beugegrenzen der Pose prüfen':'Check pose flexion limits',
  'Prüfung der gespeicherten Einzelpose. Zwischenbilder und Kollisionen sind nicht geprüft.':'Checks the saved pose only. In-between frames and collisions are not checked.',
  'Keine auswertbaren Zweiglied-Ketten mit Beugegrenzen.':'No evaluable two-segment chains with flexion limits.',
  'Innerhalb der Grenze':'Within limit','Grenze verletzt':'Limit exceeded','Nicht messbar':'Cannot measure',
  'Keine passende verbundene Zweiglied-Kette':'No matching connected two-segment chain',
  'Beugegrenzen der Bewegung prüfen':'Check motion flexion limits','Prüfung abbrechen':'Cancel check',
  'Stichprobe: 16 Schritte je Übergang. Kein lückenloser Nachweis; Kollisionen sind nicht geprüft.':'Sampling: 16 steps per transition. Not a continuous proof; collisions are not checked.',
  'Keine Verletzung in den Stichproben':'No violation in sampled frames','Prüfung abgebrochen.':'Check cancelled.',
  'Studio-Stand hat sich geändert. Prüfung erneut starten.':'Studio changed. Restart the check.',
  'Geprüfte Stichproben':'Samples checked',
  'Auffälliges Bild ansehen':'Inspect flagged frame','Prüfbild als neue Pose übernehmen':'Capture inspected frame as new pose',
  'Prüfbild als neue Pose übernommen. Bewegung bleibt unverändert.':'Inspected frame captured as a new pose. Motion remains unchanged.',
  'Zuerst ein Prüfbild öffnen.':'Open an inspected frame first.','Ungültiger Prüfzeitpunkt.':'Invalid inspection time.',
  'Posenfolge dieser Bewegung':'Pose sequence of this motion','Schritt nach vorne':'Move step earlier','Schritt nach hinten':'Move step later','Schritt entfernen':'Remove step',
  'Ausgewählte Pose einfügen':'Insert selected pose','Schritt durch ausgewählte Pose ersetzen':'Replace step with selected pose',
  'Die Pose oben auswählen. Wiederholungen sind einzelne Schritte; Posen bleiben im Projekt erhalten.':'Select the pose above. Repeated poses are separate steps; poses remain in the project.',
  'Eine Bewegung benötigt 2 bis 100 vorhandene Posen.':'A motion needs 2 to 100 existing poses.',
  'Studio ist beschäftigt oder der Stand hat sich geändert.':'Studio is busy or its state has changed.',
  'Move exportieren':'Export move','Move importieren':'Import move',
  'Move-Dateien benötigen dasselbe Modell und dieselbe Gelenkstruktur. Kein automatisches Retargeting.':'Move files require the same model and joint structure. No automatic retargeting.',
  'Bewegung und Posen importiert. Vorschau prüfen; Zurück macht den Import rückgängig.':'Move and poses imported. Review the preview; Undo reverts the import.',
  'Studio-Stand hat sich geändert. Move erneut importieren.':'Studio changed. Import the move again.',
  'Studio ist beschäftigt oder geschlossen.':'Studio is busy or closed.',
  'Bewegung passt nicht zu Modell und Gelenkstruktur.':'Move does not match the model and joint structure.',
  'Move-Datei ist größer als 8 MiB.':'Move file exceeds 8 MiB.',
  'Eigene Bewegung auswählen.':'Select a custom move.',
  'Move-Datei enthält unbenutzte Posen.':'Move file contains unused poses.',

  'Gelenke · Maussteuerung':'Joints · Mouse controls','Höchstens 2048 Verbindungen.':'At most 2048 connections.',
  'Gesamte Figur':'Whole figure','Gesamte Figur verschieben':'Move whole figure','Gesamte Figur verschieben. Diese Position wird in jeder Pose gespeichert.':'Move the whole figure. This position is saved in every pose.',
  'Posen · Gesamtbewegung':'Poses · Whole-figure motion',
  'Pose prüfen':'Review pose','Pose als geprüft markieren':'Mark pose as reviewed','⚠ Posen prüfen':'⚠ Review poses',
  'Pose anzeigen und bei Bedarf korrigieren. „Ersetzen“ speichert die Korrektur.':'Show the pose and adjust it if needed. “Replace” saves the correction.',
  'Diese Bewegung enthält Posen mit Prüfhinweisen. Vorschau ansehen und die markierten Posen prüfen.':'This move contains poses flagged for review. Preview it and check the marked poses.',
  'Skelett-Grundstellung oder Drehpunkt geändert.':'Skeleton rest pose or pivot changed.',
  'Grundposition eines Oberflächenpunkts geändert.':'Surface control rest position changed.',
  'Einflussbereich eines bewegten Oberflächenpunkts geändert.':'Influence radius of an animated surface control changed.',
  'Ein in dieser Pose bewegter Kontrollpunkt wurde entfernt.':'A control animated in this pose was removed.',
  'Posen · Bewegungsprüfung':'Poses · Motion review',
  'Gesamte Figur bewegen':'Move whole figure','Gesamte Figur verschieben oder drehen. Beides wird in jeder Pose gespeichert.':'Translate or rotate the whole figure. Both are saved in every pose.',
  'Posen · Gesamtdrehung':'Poses · Whole-figure rotation',
  'KI darf dieses Studio bearbeiten':'Allow AI to edit this studio','Nur für diese Sitzung. Änderungen sind rückgängig machbar.':'This session only. Changes can be undone.','Studio-Änderung durch KI übernommen.':'AI studio edit applied.',
  'MCP · Studio-Bearbeitung':'MCP · Studio editing',
  'KI-Anbieter · Vorbereitung':'AI providers · preparation',
  'Optionen':'Options','Sprache':'Language','Schließen':'Close','Drehrichtung der mittleren Maustaste invertieren':'Invert middle mouse rotation',
  'Maustaste 3 = Mausrad drücken und halten.':'Mouse button 3 = press and hold the scroll wheel.',
  'Joints automatisch erkennen':'Detect joints automatically','Joint-Verbindungen automatisch erkennen':'Detect joint connections automatically',
  'Erkennung verwendet vorhandene Skelettdaten. Für Modelle ohne Skelett ist KI-Rigging noch nicht verfügbar.':'Detection uses the existing skeleton. AI rigging for models without a skeleton is not available yet.',
  'Verbindungen':'Connections','Verbindung entfernen':'Remove connection','Keine Verbindungen.':'No connections.',
  'Keine zusätzlichen Gelenke erkannt. Vorhandene Punkte bleiben erhalten.':'No additional joints detected. Existing points are preserved.',
  'Das Modell enthält kein Skelett. KI-Erkennung für ungeriggte Modelle ist noch nicht verfügbar.':'This model has no skeleton. AI detection for unrigged models is not available yet.',
  'Keine zusätzlichen Skelettverbindungen erkannt. Freie Punkte bitte gezielt verbinden.':'No additional skeleton connections detected. Connect free points explicitly.',
  'Erkannte Gelenke ergänzt.':'Detected joints added.','Erkannte Verbindungen ergänzt.':'Detected connections added.',
  'Punkt hier setzen':'Add point here','Mit ausgewähltem Punkt verbinden / lösen':'Connect to / disconnect from selected point',
  'Punkt löschen':'Delete point','Punkt verschieben':'Move point','Punkt drehen':'Rotate point',
  'Figur bewegen':'Pose figure','Gelenke bearbeiten':'Edit joints','Avatar-Studio':'Avatar Studio','Bearbeitungsmodus':'Editing mode',
  'Neu':'New','Speichern':'Save','Speichern *':'Save *','Laden':'Load','Projekt laden':'Load project','＋ GLB laden':'＋ Load GLB',
  '↶ Zurück':'↶ Undo','↷ Wiederholen':'↷ Redo','Gelenk / Gesichtspunkt':'Joint / facial control','Punkt auswählen …':'Select a point …',
  '＋ Punkt setzen':'＋ Add point','Verbinden / lösen':'Connect / disconnect','Name':'Name','Punktgröße':'Point size','Einflussbereich':'Influence radius',
  'Figurgröße':'Figure size','Gesamte Figur verschieben, drehen oder gleichmäßig skalieren. Alles wird in jeder Pose gespeichert.':'Translate, rotate or uniformly scale the whole figure. All are saved in every pose.',
  'Gelenkkette':'Joint chain','Punktgruppe':'Point group',
  'Ziehen bewegt verbundene Gelenkketten. Unter Drehen lässt sich die Ausrichtung direkt mit der Maus ändern.':'Dragging moves connected joint chains. In Rotate mode, drag directly to change orientation.',
  'Skelettpunkt: Ziehen beugt die verbundene Kette, ohne Knochen zu verlängern. Drehen ändert die Ausrichtung.':'Skeleton point: dragging bends the connected chain without stretching bones. Rotate changes orientation.',
  'Gelenkketten verbinden benachbarte Quellknochen. Freie Punkte lassen sich untereinander gruppieren.':'Joint chains connect adjacent source bones. Free points can be grouped with each other.',
  'Griffe':'Handles','Verschieben':'Translate','Drehen':'Rotate','Verbundene freie Punkte gemeinsam bewegen':'Move connected free points together',
  'Knochen wirklich löschen':'Delete actual bone',
  'Knochen entfernt. Kinder und Hautgewichte dem Elternknochen zugeordnet; Posen prüfen.':'Bone removed. Children and skin weights transferred to the parent; review poses.',
  'Knochen dazwischen einfügen':'Insert intermediate bone',
  'Pinsel nur auf sichtbare Oberfläche':'Brush visible surface only',
  'Hautgewichte farbig anzeigen':'Show skin weight colors',
  'Ausgewählter Knochen: Blau = 0 %, Grün = 50 %, Rot = 100 %. Dazwischen interpolierte Farben. Nur geriggte Oberflächen; ursprüngliche Materialien erscheinen nach dem Ausschalten wieder.':'Selected bone: blue = 0%, green = 50%, red = 100%. Colors interpolate between these values. Skinned surfaces only; disabling restores the original materials.',
  'Mit Pinsel übertragen':'Transfer with brush',
  'Mit linker Maustaste über die Haut malen. Ein Strich wird gemeinsam rückgängig gemacht.':'Paint on the skin with the left mouse button. Undo restores the entire stroke.',
  'Pinselstrich abgeschlossen. Posen und Bewegungen prüfen.':'Brush stroke completed. Review poses and moves.',
  'Pinselstrich abgebrochen.':'Brush stroke cancelled.',
  'Quelle und Ziel wählen, dann mit gedrückter linker Maustaste über die Haut ziehen. Ein Strich = ein Undo-Schritt. Radius gilt auch ohne Umkreis-Checkbox. Überlappende Aufträge verstärken den Einfluss. Höchstens 1024 gespeicherte Übertragungen; bei Überschreitung wird der ganze Strich zurückgenommen.':'Choose source and target, then drag across the skin with the left mouse button. One stroke = one undo step. Radius applies even without the local-region checkbox. Overlapping dabs increase influence. At most 1024 saved transfers; exceeding the limit rolls back the entire stroke.',
  '＋ Knochen setzen':'+ Place bone',
  'Neuer Knochen':'New bone',
  'Position für den neuen Kindknochen anklicken. Hautgewichte bleiben zunächst unverändert.':'Click the position for the new child bone. Skin weights remain unchanged initially.',
  'Knochen hinzugefügt. Hautgewichte bei Bedarf gezielt übertragen.':'Bone added. Transfer skin weights as needed.',
  'Zwischengelenk eingefügt. Hautgewichte angepasst; vorhandene Posen prüfen.':'Intermediate joint inserted. Skin weights adjusted; review existing poses.',
  'Kontrollpunkt löschen':'Delete control point','Grundpose':'Rest pose','Posen & Bewegung':'Poses & motion','Posenname':'Pose name','z. B. Hand oben':'e.g. Hand up',
  'Aktuelle Pose speichern':'Save current pose','Gespeicherte Posen':'Saved poses','Anzeigen':'Show','Ersetzen':'Replace','Löschen':'Delete',
  'Übergang zu dieser Pose (Sekunden)':'Transition to this pose (seconds)','↑ Früher':'↑ Earlier','↓ Später':'↓ Later',
  'Eine Bewegung nutzt alle Posen in dieser Reihenfolge. Bei Schleifen bestimmt die Zeit der ersten Pose den Rückweg.':'A move uses all poses in this order. For loops, the first pose’s time controls the return transition.',
  'Bewegungsname':'Move name','z. B. Lächeln':'e.g. Smile','Schlagwort':'Command name','z. B. laecheln':'e.g. smile','Als Schleife':'Loop',
  'Bewegung speichern':'Save move','Eigene Bewegungen':'Custom moves','Vorschau':'Preview','Stopp':'Stop',
  'Punkte setzen und verbinden. Bestehende Skelettpunkte verschieben ihren Drehpunkt.':'Place and connect points. Moving a skeleton point changes its pivot.',
  'Punkt direkt ziehen oder farbige Griffe verwenden. Skelettpunkte können auch gedreht werden.':'Drag a point directly or use its coloured handles. Skeleton points can also rotate.',
  'Skelettpunkt. Löschen entfernt den Griff, das Quellskelett bleibt erhalten.':'Skeleton point. Deleting it removes the handle and preserves the source skeleton.',
  'Freier Oberflächenpunkt. Verbindungen gruppieren Punkte, ohne eine Gelenkkette vorauszusetzen.':'Free surface point. Connections group points without requiring a skeleton chain.',
  'In die Figur klicken. Neben der Figur wird der Punkt auf der Ansichtsebene gesetzt.':'Click the figure. Outside the figure, the point is placed on the view plane.',
  'Zweiten Punkt anklicken. Eine vorhandene Verbindung wird gelöst.':'Click the second point. An existing connection will be removed.',
  'Punkt gesetzt. Größe und Einflussbereich sind getrennt einstellbar.':'Point added. Display size and influence radius are independent.',
  'Studio-Projekt mit Modell, Kontrollpunkten, Posen und Bewegungen heruntergeladen.':'Studio project downloaded with the model, control points, poses and moves.',
  'Höchstens 256 Kontrollpunkte pro Projekt.':'At most 256 control points per project.','Höchstens 100 Posen.':'At most 100 poses.','Höchstens 100 Bewegungen.':'At most 100 moves.',
  'Diese Pose wird noch von einer Bewegung verwendet. Zuerst die Bewegung löschen.':'This pose is still used by a move. Delete that move first.',
  'Name und eindeutiges Schlagwort angeben (a–z, 0–9, _ oder -).':'Enter a name and a unique command (a–z, 0–9, _ or -).','Dieses Schlagwort ist bereits vergeben.':'That command name is already in use.',
  'Projekt laden: „Projekt laden“ oben. Mausrad: Nahzoom · rechts ziehen: Ansicht verschieben.':'Load projects using “Load project” above. Scroll: zoom · right drag: pan.',
  'Mitte halten: frei drehen · rechts ziehen: verschieben · Mausrad: zoomen':'Hold middle: rotate freely · right drag: pan · scroll: zoom',
  'Links: Punkt ziehen · Rechtsklick: Punkt-/Verbindungsmenü':'Left: drag point · right click: point / connection menu',
  'Dein Editor, direkt im Player.':'Your editor, built into the player.','Skelett anzeigen':'Show skeleton','Zurück zum Player':'Back to player',
  'Zuerst einen 3D-Avatar auswählen. Für den Original-Bildplayer liegt noch kein 3D-Modell vor.':'Select a 3D avatar first. The original image player has no 3D model yet.',
  'Ansicht':'View','Frei drehen':'Free rotation','Vorne':'Front','Hinten':'Back','Links':'Left','Rechts':'Right','Oben':'Top','Unten':'Bottom','Ansicht zurücksetzen ↺':'Reset view ↺',
  'Ansicht 90 Grad nach links rollen':'Roll view left by 90 degrees','Ansicht 90 Grad nach rechts rollen':'Roll view right by 90 degrees',
  'DEIN AVATAR, IN BEWEGUNG':'YOUR AVATAR IN MOTION','Lokal auf deinem Gerät':'Local on your device','Dein Model Zoo':'Your Model Zoo','Dein Model Zoo.':'Your Model Zoo.',
  'Dein Avatar-Studio.':'Your Avatar Studio.','Eine Figur auswählen. Eine Bewegung starten. Leben einhauchen.':'Choose a figure. Start a move. Bring it to life.',
  'Ein gemeinsamer Ort für deine Figuren und ihre Bewegungen.':'One place for your figures and their moves.','Dein PaKaChi bleibt PaKaChi.':'Your PaKaChi remains PaKaChi.',
  'Beide Formen und alle 72 Transformationsbilder sind im Originalplayer erhalten. Mika und Nori sind ausschließlich technische Testavatare.':'Both forms and all 72 transformation frames are preserved in the original player. Mika and Nori are technical test avatars only.',
  'Model Zoo wird geladen …':'Loading Model Zoo …','Avatar-Vorschau':'Avatar preview','Avatar auswählen':'Select avatar','Bewegungen':'Moves','Was dieser Avatar schon kann.':'What this avatar can already do.',
  'Pause':'Pause','Ⅱ Pause':'Ⅱ Pause','▶ Weiter':'▶ Resume','Tempo':'Speed','Abspielposition':'Playback position','Schlagworte & Fähigkeiten':'Commands & capabilities',
  'Bereit':'Ready','Standbild':'Still image','Pausiert':'Paused','Schleife':'Loop','einmalig':'once','3D · TESTAVATAR':'3D · TEST AVATAR','3D · EIGENER IMPORT':'3D · IMPORTED MODEL','3D-Testavatar':'3D test avatar',
  'Dieses Modell enthält keine abspielbaren Bewegungen.':'This model contains no playable moves.',
  'GLB-Import bleibt lokal im Browser und gilt für diese Sitzung. Es werden keine Modelle hochgeladen.':'GLB imports remain local in this browser session. No models are uploaded.',
  'Zustandssteuerung · MQTT · MCP':'State control · MQTT · MCP','Agent verbinden · MQTT / MCP':'Connect agent · MQTT / MCP','Zustand':'State','Kein Avatar bereit':'No avatar ready',
  'MQTT-Empfang einschalten':'Enable MQTT reception','Python-MCP über diesen Broker erlauben':'Allow Python MCP through this broker','Broker-Adresse':'Broker address','Benutzername':'Username','Passwort':'Password',
  'Aus · keine Verbindung':'Off · no connection','MCP · bisherige Node-Brücke':'MCP · legacy Node bridge','MCP-Kopplung einschalten':'Enable MCP pairing','Lokale Brücke':'Local bridge','Kopplungsschlüssel':'Pairing key',
  'Beide Verbindungen starten ausgeschaltet. Änderungen an Verbindungsdaten durch Aus- und Einschalten übernehmen. Zugangsdaten werden nicht gespeichert.':'Both connections start disabled. Reconnect to apply changed settings. Credentials are not stored.',
  'Befehl übernommen.':'Command accepted.','Kein aktiver Zustand':'No active state','Studio ist geöffnet. Zum Steuern zurück zum Player wechseln.':'The studio is open. Return to the player for external control.',
  'Ungültige Argumente.':'Invalid arguments.','Avatar wird geladen. Bitte erneut versuchen.':'Avatar is loading. Please try again.','Bitte diesen Avatar zuerst im Player auswählen.':'Select this avatar in the player first.',
  'Kein Avatar bereit.':'No avatar ready.','Unbekannte Operation.':'Unknown operation.','Dieser Avatar unterstützt den Zustand nicht.':'This avatar does not support that state.','Dieser Avatar unterstützt den Move nicht.':'This avatar does not support that move.',
  'Ungespeicherte Studio-Änderungen verwerfen? Mit Abbrechen kannst du zuerst das Projekt speichern.':'Discard unsaved studio changes? Cancel to save the project first.',
};
export function translate(value:string):string {
  if(options.language==='de')return value;
  const trimmed=value.trim(),result=translations[trimmed];
  if(result!==undefined)return value.replace(trimmed,result);
  if(trimmed.startsWith('Entwicklungsstand '))return value.replace('Entwicklungsstand ','Version ');
  if(trimmed.startsWith('● · ')||trimmed.startsWith('Pausiert · '))return value.replace('Pausiert · ','Paused · ');
  return value;
}
interface Source {original:string;rendered:string}
const sources=new WeakMap<Node,Source>();
const attrs=new WeakMap<Element,Map<string,Source>>();
const roots=new Map<HTMLElement,MutationObserver>();
function ignored(node:Node){const el=node.nodeType===1?node as Element:node.parentElement;return !!el?.closest('script,style,code,[data-user-text],#avatar-name,#avatar-description,#studio-points option:not([data-figure-label]),#pose-list option,#studio-moves option,#avatar-cards button,#avatar-select option');}
function localize(node:Node){
  if(ignored(node))return;
  if(node.nodeType===3){const current=node.nodeValue??'';let source=sources.get(node);if(!source||current!==source.rendered)source={original:current,rendered:current};const rendered=translate(source.original);source.rendered=rendered;sources.set(node,source);if(current!==rendered)node.nodeValue=rendered;return;}
  if(node.nodeType===1){const el=node as Element;for(const key of ['title','aria-label','placeholder']){const current=el.getAttribute(key);if(current===null)continue;const map=attrs.get(el)??new Map<string,Source>();let source=map.get(key);if(!source||source.rendered!==current)source={original:current,rendered:current};source.rendered=translate(source.original);map.set(key,source);attrs.set(el,map);if(current!==source.rendered)el.setAttribute(key,source.rendered);}}
  node.childNodes.forEach(localize);
}
export function translateRoot(root:HTMLElement):()=>void {
  localize(root);const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='childList')record.addedNodes.forEach(localize);else localize(record.target);}});
  observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});roots.set(root,observer);
  return ()=>{observer.disconnect();roots.delete(root);};
}
export function updateOptions(value:Options):void {
  options.language=value.language;options.invertMiddleRotation=value.invertMiddleRotation;
  try{localStorage.setItem('pakachi-options-v1',JSON.stringify(options));}catch{/* The editor also works with storage disabled. */}
  if(typeof document!=='undefined'){document.documentElement.lang=options.language;for(const root of roots.keys())localize(root);window.dispatchEvent(new Event('pakachi-options'));}
}
export function mountOptions():void {
  const dialog=document.createElement('dialog');dialog.id='options-dialog';dialog.innerHTML='<h2>Optionen</h2><label>Sprache<select id="option-language"><option value="de">Deutsch</option><option value="en">English</option></select></label><label class="check"><input type="checkbox" id="option-invert"> Drehrichtung der mittleren Maustaste invertieren</label><p>Maustaste 3 = Mausrad drücken und halten.</p><button id="options-close" class="button primary">Schließen</button>';document.body.append(dialog);
  const language=dialog.querySelector<HTMLSelectElement>('#option-language')!,invert=dialog.querySelector<HTMLInputElement>('#option-invert')!;
  language.value=options.language;invert.checked=options.invertMiddleRotation;
  const apply=()=>updateOptions({language:language.value==='en'?'en':'de',invertMiddleRotation:invert.checked});language.onchange=apply;invert.onchange=apply;
  document.getElementById('options-open')!.onclick=()=>dialog.showModal();dialog.querySelector<HTMLButtonElement>('#options-close')!.onclick=()=>dialog.close();
  const providers=document.createElement('section');providers.className='provider-settings';dialog.insertBefore(providers,dialog.querySelector('#options-close'));
  mountProviderPanel(providers,()=>options.language,{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
  document.documentElement.lang=options.language;translateRoot(document.body);
}
