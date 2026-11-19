# Decision Map Format — Spezifikation

**Version:** 0.2 (Entwurf)
**Stand:** 19.11.2026

Dieses Dokument beschreibt das **Decision Map Format** normativ, das
Austauschformat des Rule Editors. Es richtet sich an Implementierungen, die
Decision Maps lesen, schreiben oder prüfen, ohne den Editor selbst zu verwenden.

**Begriffe:** Das Artefakt heißt **Decision Map**, die Modellklasse
**Entscheidungsgraph** (englisch *decision graph*), das Werkzeug **Rule
Editor**. Das Format kennt keinen eigenen Dateinamenszusatz; Decision Maps
werden als `.json` ausgetauscht.

---

## 1. Zweck und Geltungsbereich

### 1.1 Was das Format beschreibt

Eine **Decision Map** beschreibt eine Entscheidung: welchen Weg ein Fall durch eine
Menge von Bedingungen nimmt und in welcher benannten Rechts- oder
Geschäftsfolge er endet.

Das Format ist ein **Entscheidungsgraph**, kein Subsumtionsbaum. Der Unterschied
ist konstitutiv:

- Ein Subsumtionsbaum beantwortet *eine* Frage mit *einem* Wahrheitswert: Ist
  der Tatbestand erfüllt?
- Ein Entscheidungsgraph beantwortet die Frage, *welche von mehreren* benannten
  Folgen eintritt.

Daraus folgen die beiden Eigenschaften, die das Format von regelbasierten
Logikformaten unterscheiden: **beschriftete Kanten** mit maschinenlesbaren
Werten und **mehrere gleichrangige Endpunkte** mit eigener fachlicher
Beschreibung.

### 1.2 Was das Format nicht beschreibt

Das Format ist **nicht primär für Rechtsnormen** gemacht. Normbezug ist ein
Anwendungsfall, kein Zweck. Das Format trägt daher keinen Normtext, kein
Gesetzgebungsverfahren und keinen Normlebenszyklus. Es *verweist* auf Normen
(Abschnitt 8), es *enthält* sie nicht.

Ebenfalls nicht im Geltungsbereich: Darstellung und Layout (gehören in das
interne Editorformat, nicht in den Austausch), Ausführungsergebnisse
einzelner Fälle, Zugriffsrechte, Versionierung von Decision Maps.

### 1.3 Leitziel

**Regeln sollen bestmöglich maschinenlesbar sein.** Wo zwischen Lesbarkeit für
Menschen und Auswertbarkeit durch Maschinen zu wählen ist, entscheidet dieses
Ziel. Konkret bedeutet das in dieser Reihenfolge:

1. Jeder Wert, über den verzweigt wird, ist maschinenlesbar (`value`, nicht nur
   `label`).
2. Jeder Wertebereich, über den verzweigt wird, ist geschlossen und erklärt.
3. Jede Berechnung in einem Endpunkt ist ein auswertbarer Ausdruck, keine Prosa.
4. Jeder Verweis nach außen ist auflösbar.

Punkte 2 bis 4 sind zum Stand dieser Version nur teilweise erfüllt; Abschnitt 11
nennt die geplanten Erweiterungen.

### 1.4 Zwei Repräsentationen

| | Dateiformat | Austauschformat |
|---|---|---|
| Wurzel | `version`, `meta`, `nodes`, `edges` | `name`, `description`, `category`, `entryNodeId`, `inputData`, `nodes`, `testCases` |
| Kanten | eigenes Array | im Feld `outputs` des Quellknotens |
| Positionen | enthalten | nicht enthalten |
| Zweck | Speichern und Weiterbearbeiten | Weitergabe an Agenten und Fremdsysteme |

Diese Spezifikation beschreibt normativ das **Austauschformat**. Das
Dateiformat ist eine Implementierungsangelegenheit des Editors. Eine
konforme Implementierung muss das Austauschformat lesen können; ob sie das
Dateiformat unterstützt, ist ihr überlassen.

### 1.5 Schlüsselwörter

**MUSS** / **DARF NICHT** bezeichnen zwingende Anforderungen, **SOLLTE**
Empfehlungen, **KANN** Wahlfreiheiten.

---

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| Decision Map | Das gesamte Dokument: eine Entscheidung mit allen Knoten und Kanten. |
| Knoten | Ein Schritt der Entscheidung. Sieben Typen, siehe Abschnitt 4. |
| Kante | Eine gerichtete Verbindung von einem Knoten zu einem anderen, als Eintrag in `outputs`. |
| Einstiegsknoten | Der Knoten, an dem die Auswertung beginnt. |
| Endpunkt | Ein Knoten, der kein Nachfolgeelement hat und eine benannte Folge beschreibt. |
| Pfad | Eine Folge von Knoten vom Einstiegsknoten zu einem Endpunkt. |
| Input | Ein Datenfeld samt Herkunftsangabe, das eine Bedingung versorgt. |
| displayId | Die sichtbare, dokumentweit eindeutige Knotennummer. Dient als Referenzziel. |

---

## 3. Dokumentstruktur

```json
{
  "name": "string",
  "description": "string",
  "category": "validation | permission | state | business-logic | error-handling | null",
  "entryNodeId": 1,
  "validationWarnings": null,
  "inputData": [],
  "nodes": [],
  "testCases": []
}
```

| ID | Regel | Stufe |
|---|---|---|
| FMT-01 | Das Wurzelobjekt MUSS die Felder `name` und `nodes` enthalten. | Fehler |
| FMT-02 | `name` MUSS eine nicht leere Zeichenkette sein. | Fehler |
| FMT-03 | `category` MUSS einer der fünf genannten Werte oder `null` sein. | Fehler |
| FMT-04 | `entryNodeId` MUSS auf die `id` eines Knotens in `nodes` verweisen oder `null` sein. | Fehler |
| FMT-05 | `entryNodeId` DARF NICHT auf einen Knoten in `inputData` verweisen. | Fehler |
| FMT-06 | `inputData` MUSS ausschließlich Knoten der Typen `input` und `input-ref` enthalten. | Fehler |
| FMT-07 | `nodes` DARF NICHT Knoten der Typen `input` oder `input-ref` enthalten. | Fehler |
| FMT-08 | Jede `id` MUSS über `inputData` und `nodes` hinweg eindeutig sein. | Fehler |
| FMT-09 | `validationWarnings` ist abgeleitete Information. Eine lesende Implementierung SOLLTE das Feld nicht als Wahrheit behandeln, sondern selbst prüfen. | Hinweis |
| FMT-10 | Unbekannte Wurzelfelder SOLLTEN beim Lesen erhalten bleiben und beim Schreiben unverändert zurückgegeben werden. | Hinweis |

Zu FMT-10: Das Format ist absichtlich nicht geschlossen. Erweiterungen durch
Dritte sind vorgesehen; sie SOLLTEN einen Präfix tragen, der sie als solche
erkennbar macht.

---

## 4. Knoten

```json
{
  "id": 4,
  "type": "condition",
  "label": "Welche Art von Mangel liegt vor?",
  "technicalKey": "mangelart",
  "expectedType": "enum",
  "notes": null,
  "knowledgeSources": [],
  "outputs": []
}
```

### 4.1 Knotentypen

| Typ | Rolle | Ausgänge |
|---|---|---|
| `decision` | Einstiegsknoten; formuliert die Frage, die die Decision Map beantwortet. | genau einer |
| `condition` | Verzweigung anhand eines Wertes. | einer oder mehrere |
| `action` | Erzeugt einen Wert oder verändert den Zustand; verzweigt nicht. | genau einer |
| `consequence` | Endpunkt mit benannter Folge. | keine |
| `consequence-ref` | Verweis auf einen bestehenden Endpunkt. | keine |
| `input` | Datenfeld mit Herkunftsangabe. | genau einer |
| `input-ref` | Verweis auf ein bestehendes Datenfeld. | genau einer |

`entry` wird als veraltetes Synonym für `decision` akzeptiert.

### 4.2 Regeln

| ID | Regel | Stufe |
|---|---|---|
| NODE-01 | `id` MUSS eine positive ganze Zahl sein. | Fehler |
| NODE-02 | `type` MUSS einer der sieben Typen (oder `entry`) sein. | Fehler |
| NODE-03 | Jeder Knoten außer `consequence-ref` und `input-ref` MUSS ein nicht leeres `label` haben. | Warnung |
| NODE-04 | Ein Knoten der nicht `consequence` oder `consequence-ref` ist MUSS mindestens einen Ausgang haben. | Fehler |
| NODE-05 | Ein `consequence`- oder `consequence-ref`-Knoten DARF NICHT Ausgänge haben. | Fehler |
| NODE-06 | Jeder Knoten außer dem Einstiegsknoten MUSS mindestens eine eingehende Kante haben. | Fehler |
| NODE-07 | Ein `condition`-Knoten SOLLTE einen `technicalKey` haben. | Warnung |
| NODE-08 | `action`-Knoten MÜSSEN genau einen Ausgang haben. Sie verzweigen nicht. | Fehler |
| NODE-09 | Ein `action`-Knoten SOLLTE `technicalKey` und `expectedType` tragen, damit der erzeugte Wert benannt und typisiert ist. | Warnung |
| NODE-10 | Der Graph DARF NICHT Zyklen enthalten, es sei denn, die beteiligten Kanten sind als Rücksprung gekennzeichnet. | Fehler |

Zu NODE-08: Der `action`-Knoten ist die Antwort des Formats auf Rechtsfolgen,
die keine Wahrheitswerte sind — eine Quote, ein Betrag, eine Frist. Er trennt
die *Bestimmung* eines Wertes von der *Verzweigung* anhand eines Wertes.

### 4.3 Referenzknoten

| ID | Regel | Stufe |
|---|---|---|
| REF-01 | `consequence-ref` MUSS ein Feld `refId` haben. | Fehler |
| REF-02 | `refId` eines `consequence-ref` MUSS auf einen Knoten des Typs `consequence` verweisen. | Fehler |
| REF-03 | `input-ref` MUSS ein Feld `refId` haben, das auf einen Knoten des Typs `input` verweist. | Fehler |
| REF-04 | Ein Referenzknoten DARF NICHT auf einen anderen Referenzknoten verweisen. | Fehler |
| REF-05 | Ein Referenzknoten KANN `label` auslassen; eine lesende Implementierung SOLLTE dann das `label` des Zielknotens verwenden. | Hinweis |

---

## 5. Kanten

```json
"outputs": [
  { "label": "Ja", "value": "true", "targetNodeId": 5 },
  { "label": "Nein", "value": "false", "targetNodeId": 6 }
]
```

| ID | Regel | Stufe |
|---|---|---|
| EDGE-01 | `targetNodeId` MUSS auf eine existierende `id` verweisen. | Fehler |
| EDGE-02 | Hat ein Knoten mehr als einen Ausgang, MUSS jeder Ausgang ein nicht leeres `label` haben. | Warnung |
| EDGE-03 | Hat ein Knoten mehr als einen Ausgang, SOLLTE jeder Ausgang ein `value` haben. Ohne `value` ist die Verzweigung nicht maschinenlesbar. | Warnung |
| EDGE-04 | `value` MUSS innerhalb der Ausgänge eines Knotens eindeutig sein. | Fehler |
| EDGE-05 | Ist `expectedType` des Quellknotens `boolean`, MÜSSEN die Ausgänge sowohl einen positiven als auch einen negativen Zweig abdecken. | Warnung |
| EDGE-06 | Ein Knoten mit genau einem Ausgang KANN `label` und `value` auslassen. | — |
| EDGE-07 | Zwei Ausgänge eines Knotens DÜRFEN auf dasselbe Ziel verweisen. | — |

Zu EDGE-05: Als positiv gelten `ja`, `yes`, `wahr`, `true`; als negativ `nein`,
`no`, `falsch`, `false`, jeweils ohne Beachtung der Groß- und Kleinschreibung.
Diese Prüfung ist der Grund, warum `expectedType` nicht nur Dokumentation ist.

---

## 6. Endpunkte

```json
{
  "id": 14,
  "type": "consequence",
  "label": "Angemessen herabgesetzte Miete",
  "consequence": {
    "business": "Der Mieter schuldet für diese Zeit nur eine herabgesetzte Miete.",
    "technical": "mietforderung = grundmiete * (1 - minderungsquoteProzent / 100)",
    "reference": "§ 536 Abs. 1 S. 2 BGB"
  }
}
```

| ID | Regel | Stufe |
|---|---|---|
| CONS-01 | Ein `consequence`-Knoten MUSS ein Objekt `consequence` haben. | Warnung |
| CONS-02 | `consequence.business` MUSS eine nicht leere Zeichenkette sein. | Warnung |
| CONS-03 | `consequence.technical` SOLLTE beschreiben, was technisch geschieht. | Hinweis |
| CONS-04 | `consequence.reference` SOLLTE auf die Stelle verweisen, die die Folge anordnet. | Hinweis |
| CONS-05 | Jede Decision Map MUSS mindestens einen `consequence`-Knoten enthalten. | Fehler |
| CONS-06 | Zwei `consequence`-Knoten mit identischem `business` SOLLTEN zu einem Knoten und einem `consequence-ref` zusammengefasst werden. | Hinweis |
| CONS-07 | Jeder Pfad vom Einstiegsknoten MUSS in einem `consequence`- oder `consequence-ref`-Knoten enden. | Fehler |

Zu CONS-07: Das ist die zentrale Auswertbarkeitsgarantie des Formats. Eine
Decision Map, in der ein Pfad ins Leere läuft, ist nicht auswertbar, und zwar
unabhängig davon, ob sie schemakonform ist.

---

## 7. Inputs und Datenherkunft

```json
{
  "id": 25,
  "type": "input",
  "label": "Auswirkung des Mangels auf die Tauglichkeit",
  "technicalKey": "tauglichkeitswirkung",
  "expectedType": "enum",
  "outputs": [{ "targetNodeId": 11 }],
  "inputSource": {
    "provider": "manuell",
    "providerSubtype": "juristische Bewertung",
    "verfuegbarkeit": "laufzeit",
    "kannScheitern": true,
    "referenziertEntscheidung": null
  }
}
```

| Feld | Werte | Bedeutung |
|---|---|---|
| `provider` | `system`, `manuell`, `komposition` | Wer liefert den Wert: ein System, ein Mensch, oder eine andere Entscheidung. |
| `providerSubtype` | frei | Genauere Herkunft, z. B. `stammdaten`, `juristische Bewertung`. |
| `verfuegbarkeit` | `vorhanden`, `laufzeit` | Liegt der Wert bereits vor oder wird er erst zur Laufzeit beschafft. |
| `kannScheitern` | boolean | Kann die Beschaffung fehlschlagen. |
| `referenziertEntscheidung` | frei | Bei `provider: komposition`: welche Entscheidung den Wert liefert. |

| ID | Regel | Stufe |
|---|---|---|
| IN-01 | Ein `input`-Knoten MUSS einen `technicalKey` haben. | Fehler |
| IN-02 | Ein `input`-Knoten MUSS genau einen Ausgang haben. | Fehler |
| IN-03 | Der Ausgang eines `input`-Knotens MUSS auf einen `condition`- oder `action`-Knoten verweisen. | Fehler |
| IN-04 | Ein `input`-Knoten SOLLTE ein `inputSource`-Objekt haben. | Warnung |
| IN-05 | `provider` MUSS einer der drei Werte sein. | Fehler |
| IN-06 | Ist `provider` gleich `komposition`, MUSS `referenziertEntscheidung` gesetzt sein. | Fehler |
| IN-07 | Ist `kannScheitern` gleich `true`, SOLLTE die Decision Map einen Pfad enthalten, der das Scheitern behandelt. | Hinweis |
| IN-08 | `technicalKey` SOLLTE dokumentweit eindeutig sein. | Warnung |
| IN-09 | Der `technicalKey` eines `condition`-Knotens SOLLTE dem `technicalKey` eines Inputs entsprechen, der auf ihn verweist. | Warnung |

Zu IN-07: Das Feld `kannScheitern` ist nur dann mehr als Dokumentation, wenn
der Fehlerfall einen Weg im Graphen hat. Ein Format, das die Möglichkeit des
Scheiterns verzeichnet, ohne sie auszuwerten, gewinnt nichts.

---

## 8. Wissensquellen und Normbezug

```json
"knowledgeSources": [
  {
    "id": "ks536",
    "art": "gesetz",
    "verbindlichkeit": "verbindlich",
    "referenz": "§ 536 Abs. 1a BGB",
    "uri": "https://testphase.rechtsinformationen.bund.de/v1/legislation/eli/bund/bgbl-1/2004/s788/2025-12-08/2/deu",
    "eid": "art-z1_abs-z2",
    "fassung": "2013-05-01",
    "abgerufen": "2026-11-19",
    "eigner": "Gesetzgeber",
    "beschreibung": "Ausschluss der Minderung bei energetischer Modernisierung"
  }
]
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `art` | ja | `gesetz`, `norm_standard`, `interne_richtlinie`, `vertrag`, `fachwissen` |
| `verbindlichkeit` | ja | `verbindlich`, `empfohlen`, `optional` |
| `referenz` | ja | Menschenlesbares Zitat. |
| `uri` | nein | Auflösbarer Verweis auf die Quelle. |
| `eid` | nein | Kennung des Elements innerhalb der Quelle. |
| `fassung` | nein | Welche Fassung gemeint ist, als ISO-8601-Datum. |
| `abgerufen` | nein | Wann `uri` zuletzt erfolgreich aufgelöst wurde. |
| `eigner` | nein | Zuständige Stelle. |
| `beschreibung` | nein | Kurzbeschreibung. |

| ID | Regel | Stufe |
|---|---|---|
| KS-01 | `art` MUSS einer der fünf Werte sein. | Fehler |
| KS-02 | `verbindlichkeit` MUSS einer der drei Werte sein. | Fehler |
| KS-03 | `referenz` MUSS eine nicht leere Zeichenkette sein. | Fehler |
| KS-04 | Ist `art` gleich `gesetz` oder `norm_standard`, SOLLTE `uri` gesetzt sein. | Warnung |
| KS-05 | `uri` MUSS eine absolute URI sein. | Fehler |
| KS-06 | Ist `art` gleich `gesetz`, SOLLTE `uri` ein ELI nach Abschnitt 8.1 sein, wo ein solcher existiert. | Hinweis |
| KS-07 | `fassung` MUSS, wenn gesetzt, ein ISO-8601-Datum sein. | Fehler |
| KS-08 | Ist `art` gleich `gesetz`, SOLLTE `fassung` gesetzt sein. | Warnung |
| KS-09 | `eid` DARF NICHT ohne `uri` gesetzt sein. | Fehler |
| KS-10 | `abgerufen` MUSS, wenn gesetzt, ein ISO-8601-Datum sein. | Fehler |

### 8.1 ELI als bevorzugte Form

**ELI** (European Legislation Identifier, Ratsschlussfolgerungen 2012/C 325/02)
ist ein Bauplan für auflösbare, versionierte URIs auf Rechtsnormen. Das
deutsche Bundesrecht wird über das Rechtsinformationssystem des
Bundesministeriums der Justiz nach folgendem Muster adressiert:

```
eli/{jurisdiktion}/{verkuendungsblatt}/{jahr}/{nummer}/{stand}/{version}/{sprache}
```

Beispiel einer tatsächlich auflösbaren Fassung:

```
eli/bund/bgbl-1/2004/s788/2025-12-08/2/deu
```

Einzelne Paragraphen und Absätze sind über die Kennung des Elements im
LegalDocML.de-Dokument adressierbar, zum Beispiel `art-z1` für einen
Paragraphen und `art-z1_abs-z1` für seinen ersten Absatz. Diese Kennung
gehört in das Feld `eid`.

### 8.2 Warum `uri` und nicht `eli`

Das Feld heißt absichtlich `uri` und nicht `eli`. Grund: Die ELI-Abdeckung des
deutschen Bundesrechts ist zum Stand dieser Version unvollständig. Die
Kerngesetze — darunter das BGB — sind im Rechtsinformationssystem noch nicht
erfasst. Für sie bleibt vorläufig nur ein Verweis auf eine andere amtliche
Veröffentlichung, etwa

```
https://www.gesetze-im-internet.de/bgb/__536.html
```

Ein Feld, das ausschließlich ELI zuließe, wäre für die wichtigsten Normen
heute unbenutzbar. Mit `uri` funktioniert der Verweis sofort und wird
besser, sobald die Abdeckung wächst — ohne Formatänderung. KS-06 formuliert
die Präferenz, ohne sie zur Pflicht zu machen.

### 8.3 Keine Normtexte im Dokument

Das Format trägt **keinen** Normtext und **keine** Prüfsumme über einen
Normtext. Eine Decision Map verweist auf eine Quelle; sie reproduziert sie nicht.
Begründung: Abschnitt 1.2. Wer Nachvollziehbarkeit über die Zeit braucht,
braucht ein Archiv der verwiesenen Fassungen — das ist eine Aufgabe der
umgebenden Infrastruktur, nicht des Austauschformats.

---

## 9. Testfälle

```json
"testCases": [
  {
    "id": "tc536a",
    "name": "Heizungsausfall im Winter",
    "inputs": { "mangelart": "sachmangel", "tauglichkeitswirkung": "gemindert" },
    "expectedConsequenceId": 14,
    "expectedResult": "Angemessen herabgesetzte Miete",
    "notes": "Standardfall."
  }
]
```

| ID | Regel | Stufe |
|---|---|---|
| TC-01 | `expectedConsequenceId` MUSS auf einen `consequence`-Knoten verweisen. | Fehler |
| TC-02 | Jeder Schlüssel in `inputs` MUSS dem `technicalKey` eines `input`- oder `condition`-Knotens entsprechen. | Warnung |
| TC-03 | Jeder Wert in `inputs` MUSS als Zeichenkette angegeben werden. | Fehler |
| TC-04 | `name` SOLLTE nicht leer sein. | Warnung |
| TC-05 | Jeder `consequence`-Knoten SOLLTE von mindestens einem Testfall erreicht werden. | Hinweis |
| TC-06 | Werden die `inputs` eines Testfalls auf den Graphen angewendet, MUSS der erreichte Endpunkt `expectedConsequenceId` entsprechen. | Fehler |

Zu TC-06: Diese Regel macht Testfälle prüfbar statt dekorativ. Sie setzt
voraus, dass alle Verzweigungen auf dem Pfad `value`-Angaben tragen (EDGE-03).

---

## 10. Konformität

### 10.1 Prüfebenen

| Ebene | Umfang |
|---|---|
| `struktur` | Feldtypen, Wertebereiche, Referenzziele. Prüfbar ohne Graphdurchlauf. |
| `graph` | Erreichbarkeit, Endpunktgarantie, Zyklen. Erfordert Graphdurchlauf. |
| `inhalt` | Vollständigkeit von Beschreibungen, Testfallabdeckung, Normbezug. |

Eine Implementierung ist **strukturkonform**, wenn sie alle Fehlerregeln der
Ebene `struktur` erkennt; **graphkonform**, wenn zusätzlich alle Fehlerregeln
der Ebene `graph`.

### 10.2 Stand der Umsetzung

Die Prüfung ist auf zwei Stellen verteilt:

- `src/utils/validateDecisionMap.ts` prüft die Regeln, die am Graphen hängen.
  Der Editor ruft sie bei jeder Änderung auf; die Befunde erscheinen am Knoten
  und in der Seitenleiste.
- `src/utils/validateExportDocument.ts` prüft die Regelgruppe FMT. Diese
  Regeln lassen sich nur am Austauschdokument prüfen, weil im internen Modell
  `inputData` und `nodes` ein Array sind und `entryNodeId` aus dem Graphen
  folgt. Der Aufruf erfolgt beim Import.

Jeder Befund trägt die Regel-ID aus diesem Dokument, auch im Export
(`validationWarnings[].ruleId`). Dokumentweite Befunde ohne Knotenbezug tragen
`nodeId: 0`.

| Gruppe | Umgesetzt | Offen |
|---|---|---|
| FMT | 01–09 | 10 (wird gemeldet, aber unbekannte Felder bleiben beim Import nicht erhalten) |
| NODE | 03–10 | 01, 02 (Feldtypen am Dokument) |
| REF | 01–04; 05 im Konverter | — |
| EDGE | 01–05 | — (06, 07 sind Erlaubnisse) |
| CONS | 02, 05, 06, 07; 01 über 02 mitgeprüft | 03, 04 (bewusst keine Hinweise, zu viel Rauschen) |
| IN | 01–09 | — |
| KS | 01–03 | 04–10 (hängen an den Feldern aus Abschnitt 11) |
| TC | 02–05 | 01 (gehört ans Dokument), 06 (braucht Auswertung) |

Damit ist der Editor **strukturkonform** für die Regeln, die am Graphen prüfbar
sind, und **graphkonform**: NODE-10 (Zyklenfreiheit) und CONS-07
(Endpunktgarantie) werden geprüft.

Nicht konform im Sinne von Abschnitt 1.3 ist das Format weiterhin an einer
Stelle: **TC-06** verlangt, dass eine Implementierung den Graphen mit gegebenen
Eingaben durchläuft. Solange das fehlt, sind Testfälle dokumentiert, aber nicht
nachgerechnet.

Geprüft wird die Prüfung selbst mit `npm run check-rules`: 33 Fälle — Decision
Maps mit je einem gezielten Verstoß, eine fehlerfreie Map als Gegenprobe und ein
als Rücksprung gekennzeichneter Zyklus, der keinen Befund auslösen darf.

### 10.3 Abgrenzung zur DMN-Prüfung

Der DMN-Export führt eine eigene Prüfung durch, die Exportierbarkeit nach DMN
1.3 feststellt. Ihre Befunde sind **nicht** Teil dieser Spezifikation: Eine
Decision Map kann konform und gleichwohl nicht nach DMN exportierbar sein, etwa
weil sie `action`-Knoten enthält, für die DMN keine Entsprechung kennt.

---

## 11. Geplante Erweiterungen

Die folgenden Punkte sind beschlossen, aber in dieser Version noch nicht Teil
des Formats. Sie stehen hier, damit Implementierungen sie einplanen können.

### 11.1 Geschlossene Wertebereiche (`allowedValues`)

`input`-Knoten mit `expectedType: "enum"` sollen den vollständigen
Wertebereich mitführen:

```json
"allowedValues": [
  { "value": "sachmangel", "label": "Sachmangel" },
  { "value": "rechtsmangel", "label": "Rechtsmangel" },
  { "value": "kein_mangel", "label": "Kein Mangel" }
]
```

Damit wird EDGE-05 von `boolean` auf `enum` erweiterbar: Eine Bedingung, die
nicht alle zulässigen Werte abdeckt, ist ein Befund. Ohne dieses Feld fällt
ein hinzukommender Wert still durchs Raster — der häufigste stille Fehler
dieses Formats.

### 11.2 Auswertbare Ausdrücke (FEEL)

`consequence.technical` enthält Prosa. Geplant ist ein zusätzliches Feld mit
einem Ausdruck in **FEEL** (Friendly Enough Expression Language, Teil von
DMN 1.3):

```json
"consequence": {
  "business": "Der Mieter schuldet eine herabgesetzte Miete.",
  "technical": "Miete anteilig um die Quote senken.",
  "expression": "grundmiete * (1 - minderungsquoteProzent / 100)"
}
```

FEEL und nicht eine andere Ausdruckssprache, weil der DMN-Export bereits
FEEL erzeugt und FEEL von gängigen Entscheidungsmaschinen unmittelbar
ausgeführt wird. Offen und vor der Umsetzung zu entscheiden: welcher
Sprachumfang zugelassen ist, ob Ausdrücke validiert oder nur transportiert
werden, und wie das Verhältnis zu den im DMN-Export aus Kantenwerten
erzeugten Ausdrücken aussieht.

### 11.3 Testfallnachrechnung

TC-06 setzt voraus, dass eine Implementierung den Graphen mit gegebenen
Eingaben durchlaufen kann. Das ist zugleich die Grundlage dafür, Decision Maps
überhaupt auszuführen, und damit die Voraussetzung für das Leitziel aus
Abschnitt 1.3.

---

## 12. Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.2 | 19.11.2026 | Abschnitt 10.2 auf den tatsächlichen Umsetzungsstand gebracht. Befunde tragen jetzt die Regel-ID, auch im Export. Keine Änderung an den Regeln selbst. |
| 0.1 | 19.11.2026 | Erstfassung. Regeln aus dem bestehenden Verhalten des Editors abgeleitet und ergänzt; Abschnitt 8 (Normbezug) und Abschnitt 11 (geplante Erweiterungen) neu. |
