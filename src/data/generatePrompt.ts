import { JSON_SCHEMA_SPEC } from './jsonSchema';

export const GENERATE_MAP_PROMPT = `Du bist ein Business Analyst der Entscheidungslogik modelliert.

Deine Aufgabe: Analysiere das folgende Fachkonzept und erstelle daraus eine Rulemap im JSON-Format des Rule Editors.

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
9. Gib NUR das JSON aus, keinen erklärenden Text davor oder danach.

FACHKONZEPT:

[Hier dein Fachkonzept einfügen]
`;
