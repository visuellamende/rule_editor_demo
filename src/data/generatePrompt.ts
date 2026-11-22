import { JSON_SCHEMA_SPEC } from './jsonSchema';

export const GENERATE_MAP_PROMPT = `Du bist ein Business Analyst der Entscheidungslogik modelliert.

Deine Aufgabe: Analysiere das folgende Fachkonzept und erstelle daraus eine Decision Map im JSON-Format des Rule Editors.

${JSON_SCHEMA_SPEC}

REGELN FÜR DIE MODELLIERUNG:

1. Beginne mit einem Decision-Knoten der die zentrale Frage formuliert.
2. Zerlege die Logik in einzelne Bedingungen (Condition-Knoten). Jede Bedingung prüft genau einen Wert.
3. Jeder Pfad muss in einem Consequence-Knoten enden. Beschreibe die fachliche Konsequenz.
4. Wenn dieselbe Konsequenz über mehrere Pfade erreichbar ist, erstelle EINEN vollständigen Consequence-Knoten. Alle weiteren Vorkommen werden als consequence-ref Knoten (mit label, displayId und refNodeId) im nodes-Array angelegt — keine kopierten consequence-Objekte.
5. Erstelle für jeden Datenwert der in Bedingungen geprüft wird einen Input-Knoten. Verbinde ihn mit den Conditions die ihn nutzen.
6. Wenn ein Input bei mehreren Conditions gebraucht wird, erstelle EINEN Input-Knoten. Alle weiteren Vorkommen als input-ref Knoten (mit label, displayId und refNodeId) im nodes-Array.
7. Alle Positionen auf { "x": 0, "y": 0 } setzen — das Auto-Layout berechnet die Positionen beim Import.
8. displayIds fortlaufend vergeben, beginnend bei 1.
9. Gib jeder Kante ausser der einzigen Ausgangskante eines Knotens ein label UND ein value. Das value ist der maschinenlesbare Vergleichswert ("true", "false", "GUEST"); ohne es ist die Verzweigung nicht auswertbar.
10. Verzweigt eine Bedingung über einen Aufzählungstyp, setze expectedType auf "enum" und führe in allowedValues ALLE zulässigen Werte auf. Für jeden davon muss es genau einen Ausgang geben. Erfinde keine Werte und lasse keine weg: Was du hier nicht nennst, fällt später still durchs Raster.
11. Muss ein Wert berechnet werden, bevor weitergeprüft wird (eine Quote, ein Betrag, eine Frist), nimm dafür einen Action-Knoten mit technicalKey, expectedType und einem expression. Kommt der Wert aus einem anderen System (API-Aufruf, Konverter, Speichern), gib der Action statt expression ein externalCall mit system, falls bekannt operation, und kannScheitern. Actions verzweigen nicht und haben genau einen Ausgang.
12. Rechnet ein Endpunkt etwas aus, schreibe die Rechnung als consequence.expression. Die Prosa dazu gehört in consequence.technical, nicht statt dessen.
13. Ausdrücke sind FEEL: Arithmetik, Vergleiche, and/or/not, if-then-else, Bereiche wie x in [a..b], und die Funktionen abs, ceiling, floor, round, min, max, sum, count, contains, starts with, string length, upper, lower. Keine Datums- oder Zeitarithmetik. Die Namen darin sind technicalKeys aus dem Modell.
14. Beruht eine Regel auf einer Norm oder einem Standard, lege eine knowledgeSource an. referenz ist das Zitat; uri, fassung und eid nur, wenn du sie SICHER weisst — erfinde keine Verweise.
15. Der Graph darf keine Zyklen enthalten.
16. Gib NUR das JSON aus, keinen erklärenden Text davor oder danach.

FACHKONZEPT:

[Hier dein Fachkonzept einfügen]
`;
