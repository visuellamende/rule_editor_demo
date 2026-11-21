import type { TranslationKey } from '../i18n';

export interface PromptTemplate {
  id: string;
  labelKey: TranslationKey;         // i18n-Key für den Button-Text
  descriptionKey: TranslationKey;   // i18n-Key für die Beschreibung
  icon: string;                     // SVG-Path oder Emoji
  template: string;                 // Der Aufgabentext (englisch, sprachunabhängig für den Agenten)
  summary?: string;                 // Kurzfassung des Auftrags, steht ganz oben im fertigen Prompt
  variables?: Record<string, string>; // Platzhalter {NAME} im Text und ihre Vorgabewerte
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'implementation',
    labelKey: 'template.implementation',
    descriptionKey: 'template.implementation.desc',
    icon: 'code',
    variables: { ZIELSPRACHE: 'TypeScript' },
    summary: `AUFTRAG IN KÜRZE: Setze das unten stehende Entscheidungsmodell als eine zustandslose, testbare Funktion in {ZIELSPRACHE} um, schreibe für jeden testCase einen Unit-Test und liste alle offenen Punkte auf. Das Modell ist die einzige Wahrheit; die Details stehen in der AUFGABE am Ende.`,
    template: `AUFGABE: Implementierung

Zielsprache: {ZIELSPRACHE}
(Soll es eine andere Sprache sein, ersetze sie hier. Schnittstelle und Regeln gelten sinngemäß, mit den Konventionen der Sprache.)

SCHNITTSTELLE (fest vorgegeben):
- Eine Funktion evaluate(input, deps) für die Entscheidung des Modells. Name nach dem Modellnamen, z. B. evaluatePromotions.
- input: ein Objekt, dessen Schlüssel die technicalKeys der Inputs und Bedingungen sind. Jeder Wert hat den Typ seines expectedType; bei "enum" ist der Typ die Vereinigung der allowedValues. Alle Felder sind optional (siehe Fehlende Eingaben).
- deps: Objekt mit injizierten Schnittstellen für Seiteneffekte (siehe Seiteneffekte). Hat das Modell keine, entfällt der Parameter.
- Rückgabe: { consequenceId, path, openPoints }
  - consequenceId: id des erreichten consequence-Knotens. Endet der Pfad in einem consequence-ref, ist es dessen refId.
  - path: ids aller betretenen Knoten in Reihenfolge, vom Einstiegsknoten bis zum Endpunkt einschließlich (bei einem consequence-ref dessen eigene id). Input-Knoten gehören nicht dazu.
  - openPoints: Befunde mit severity "warning" oder "error" aus validationWarnings, die einen Knoten auf diesem Pfad betreffen, als Text "ruleId #nodeId: Meldung". Leer, wenn keiner betroffen ist.

AUSWERTUNG:
- Traversiere vom Einstiegsknoten aus. Nutze die technicalKeys als Variablennamen und expectedTypes als Datentypen.
- Verzweige über output.value, nicht über die Labels. Wandle value vorher in den expectedType des Knotens um ("true"/"false" → Wahrheitswert, Zahlen → Zahl, enum und string bleiben Zeichenketten). Nutze dafür EINE Hilfsfunktion, die auch die Tests verwenden.
- Wenn ein Knoten allowedValues hat (eigene oder die des versorgenden Inputs): verzweige erschöpfend über genau diese Werte. Ein unbekannter Wert ist ein Fehler, kein stiller Durchfall.
- Trifft die Auswertung auf einen Wert, für den der Knoten keinen Ausgang hat (bekannte Lücke im Modell), wirf einen eigenen Fehlertyp (z. B. ModelGapError) mit Knoten-id, technicalKey, Wert und, falls vorhanden, der ruleId des Befunds. Erfinde keinen Ausgang.
- Knoten vom type "action" erzeugen einen Wert und verzweigen nicht. Ein expression setzt du als Berechnung um und legst das Ergebnis unter dem technicalKey ab; spätere Ausdrücke greifen darauf zu. Die Ausdrücke sind FEEL: übersetze sie, erfinde sie nicht um.
- Hat eine consequence ein expression, implementiere diese Rechnung. consequence.technical beschreibt sie nur.
- consequence-ref: Jeder Endpunkt wird EINMAL implementiert; alle Refs rufen diese eine Implementierung auf.

FEHLENDE EINGABEN:
- Ein Eingabewert wird erst gelesen, wenn die Auswertung einen Knoten erreicht, der ihn braucht. Fehlt er dann, wirf einen eigenen Fehlertyp (z. B. MissingInputError) mit dem technicalKey.
- Fehlt ein Wert, der auf dem Pfad nicht gelesen wird, ist das kein Fehler. Setze keine Ersatzwerte und brich nicht vorab ab, nur weil das input-Objekt unvollständig ist.

SEITENEFFEKTE:
- Eine action ohne expression, die einen externen Aufruf darstellt (API, Konverter, Speichern oder Verwerfen von Daten, Meldung an ein Fremdsystem — erkennbar an Label und notes), wird eine Methode im deps-Interface, benannt nach ihrem technicalKey. Sie bekommt die bis dahin bekannten Werte, die sie fachlich braucht, und ihr Rückgabewert liegt danach unter dem technicalKey. Kein TODO im Funktionsrumpf.
- Nur wenn der Wert einer action weder berechenbar noch ein externer Aufruf ist, setze an der Stelle ein TODO. Rechne ihn NICHT selbst aus.
- Inputs mit inputSource.kannScheitern = true: die Fehlerbehandlung folgt dem Fehlerpfad des Modells. Erfinde keine zusätzliche Wiederhol- oder Fallback-Logik.
- Inputs mit provider "manuell" oder verfuegbarkeit "laufzeit" liefert der Aufrufer im input-Objekt; dokumentiere das am Typ.

WIEDERHOLTER AUFRUF:
- Die Funktion wird pro Auswertung einmal aufgerufen und hält keinen Zustand zwischen Aufrufen. Schleifen im Ablauf (z. B. Neuberechnung) entstehen durch erneuten Aufruf. Externer Zustand kommt über input herein; Änderungen daran laufen über deps.

KOMMENTARE UND QUELLEN:
- Befunde aus validationWarnings mit severity "warning" oder "error" setzt du als TODO-Kommentar mit ihrer ruleId an den betroffenen Knoten. Befunde mit severity "hint" kommen NICHT in den Code; sie stehen gesammelt in Teil 3.
- Respektiere die Verbindlichkeit der Knowledge Sources: "verbindlich" exakt umsetzen und mit referenz kommentieren, "empfohlen" als änderbar kommentieren. Hat eine Quelle eine uri, setze sie in den Kommentar, mitsamt fassung, falls angegeben.

TESTS:
- Für JEDEN testCase genau einen Unit-Test mit dem Framework, das in {ZIELSPRACHE} üblich ist (bei TypeScript: Vitest). Der Testname enthält testCase.name.
- Die inputs des testCase werden mit derselben Umwandlungsfunktion in den expectedType gebracht. Fehlende Keys bleiben weg.
- Geprüft wird consequenceId === expectedConsequenceId. deps werden durch einfache Test-Doubles ersetzt.
- Ist ein zulässiger Wert (allowedValues) durch keinen testCase abgedeckt, ergänze einen Test und markiere ihn als ergänzt, nicht als testCase des PO. Für bekannte Lücken prüft der Test, dass ModelGapError geworfen wird.

AUSGABEFORMAT (genau drei Teile, in dieser Reihenfolge, kein weiterer Text):
1. Code: ein Codeblock in {ZIELSPRACHE} mit Typen, deps-Interface, Hilfsfunktion zur Typumwandlung, Fehlertypen und der Funktion.
2. Unit-Tests: ein Codeblock mit den Tests aus den testCases und den ergänzten Tests.
3. Offene Punkte: eine Liste mit (a) Befunden "warning"/"error" mit ruleId und Knoten, (b) den Hinweisen ("hint") gesammelt, (c) Annahmen, die du treffen musstest, (d) Fragen an den Fachbereich.`,
  },
  {
    id: 'tests',
    labelKey: 'template.tests',
    descriptionKey: 'template.tests.desc',
    icon: 'check',
    template: `AUFGABE: Testfälle generieren

Generiere für JEDEN Pfad durch die Decision Map einen Unit-Test.

WICHTIG: Das Modell enthält vom PO definierte Testfälle (testCases).
Diese sind die PRIMÄRE Quelle für Tests — sie beschreiben exakt welche
Eingaben zu welchem Ergebnis führen sollen. Implementiere sie 1:1 als
Unit-Tests.

Für Pfade OHNE definierte Testfälle: generiere einen Test aus der Struktur
der Map (wie bisher).

Anforderungen:
- PO-definierte testCases haben Vorrang.
- Jeder testCase wird ein eigener Unit-Test.
- Der Testname enthält den Namen des testCase.
- Eingabewerte kommen aus testCase.inputs.
- Das erwartete Ergebnis kommt aus testCase.expectedResult.
- expectedConsequenceId gibt an, welcher Consequence-Knoten das Ergebnis ist.
- Für automatisch generierte Tests: nutze die output.values aus den Edges.
- Die testCases sind bereits gegen die Map nachgerechnet (Regel TC-06). Steht kein Befund mit ruleId "TC-06" im Modell, führen die inputs wirklich zum angegebenen Endpunkt — der Test prüft also deinen Code, nicht das Modell.
- Wenn ein Knoten allowedValues hat: decke jeden zulässigen Wert mit mindestens einem Test ab.
- Wenn eine consequence ein expression hat: prüfe auch den berechneten Wert, nicht nur welcher Endpunkt erreicht wird.`,
  },
  {
    id: 'audit',
    labelKey: 'template.audit',
    descriptionKey: 'template.audit.desc',
    icon: 'shield',
    template: `AUFGABE: Code-Audit

Prüfe den folgenden Code gegen das Entscheidungsmodell. Das Modell ist die einzige Wahrheit.

Für JEDEN Pfad durch die Decision Map:
1. Existiert im Code eine Stelle, die diese Bedingungskette prüft?
2. Führt diese Stelle zum erwarteten Ergebnis?
3. Wenn KEINE passende Stelle: melde "Nicht gefunden". Spekuliere NICHT.

Format pro Regel:
### Regel [Nr]: [Pfad]
- **Erwartung:** [Ergebnis aus consequence.business, bei vorhandenem expression auch der berechnete Wert]
- **Status:** ✅ Implementiert / ❌ Nicht gefunden
- **Fundstelle:** [Datei:Zeile, Methode] oder "Keine Fundstelle"

Prüfe zusätzlich, sofern im Modell vorhanden:
- allowedValues: Deckt der Code jeden zulässigen Wert ab, und was tut er bei einem unbekannten?
- expression: Rechnet der Code dasselbe wie der Ausdruck?

Zusammenfassung am Ende: Geprüfte Regeln, Implementiert, Nicht gefunden.
Keine Empfehlungen oder Einordnungen.`,
  },
  {
    id: 'documentation',
    labelKey: 'template.documentation',
    descriptionKey: 'template.documentation.desc',
    icon: 'book',
    template: `AUFGABE: Dokumentation

Schreibe eine fachliche Dokumentation der Entscheidungslogik für nicht-technische Leser.

Anforderungen:
- Beschreibe jeden Entscheidungspfad in natürlicher Sprache.
- Nutze die Labels (nicht die technischen Keys) für die Beschreibung.
- Erkläre die Konsequenzen in verständlicher Sprache.
- Wenn Knowledge Sources vorhanden: nenne die fachliche Grundlage. Ist eine uri angegeben, verlinke sie; ist eine fassung angegeben, nenne sie, damit erkennbar bleibt, welcher Stand gemeint war.
- Wenn eine consequence ein expression hat: erkläre die Rechnung in Worten, statt die Formel abzuschreiben.
- Struktur: Einleitung → Entscheidungspfade → Zusammenfassung der Endpunkte.
- Sprache: Deutsch.`,
  },
  {
    id: 'completeness',
    labelKey: 'template.completeness',
    descriptionKey: 'template.completeness.desc',
    icon: 'search',
    template: `AUFGABE: Vollständigkeitsprüfung

Analysiere das Entscheidungsmodell auf Lücken und Inkonsistenzen.

Der Editor prüft das Modell bereits gegen die Formatspezifikation; seine Befunde
stehen in validationWarnings. Wiederhole sie nicht, sondern suche, was eine
formale Prüfung nicht sieht.

Prüfe:
1. Sind die Wertebereiche fachlich vollständig? allowedValues sagt, was das Modell für möglich hält — frage, ob das der Wirklichkeit entspricht (fehlt eine Rolle, ein Status, ein Sonderfall?). Fehlt allowedValues bei einem enum ganz, ist das die erste Lücke.
2. Gibt es widersprüchliche Pfade, die bei denselben Eingaben zu verschiedenen Ergebnissen führen?
3. Sind die Endpunkte fachlich unterscheidbar, oder beschreiben zwei dasselbe mit anderen Worten?
4. Gibt es Consequences ohne fachliche Beschreibung, oder solche, die eine Rechnung beschreiben, ohne sie als expression zu führen?
5. Führt jeder Input irgendwo zu einer Verzweigung, und kommt jede Verzweigung an die Werte, die sie braucht?
6. Sind Inputs mit kannScheitern = true mit einem Pfad für den Fehlerfall versehen?
7. Welche Befunde stehen in validationWarnings, und welche davon sind fachlich ernst? Nenne sie mit ihrer ruleId.

Format:
- Für jede gefundene Lücke: beschreibe das Problem und schlage eine Lösung vor.
- Am Ende: Gesamtbewertung (Vollständig / Lücken vorhanden / Kritische Lücken).`,
  },
];
