import type { TranslationKey } from '../i18n';

export interface PromptTemplate {
  id: string;
  labelKey: TranslationKey;         // i18n-Key für den Button-Text
  descriptionKey: TranslationKey;   // i18n-Key für die Beschreibung
  icon: string;                     // SVG-Path oder Emoji
  template: string;                 // Der Aufgabentext (englisch, sprachunabhängig für den Agenten)
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'implementation',
    labelKey: 'template.implementation',
    descriptionKey: 'template.implementation.desc',
    icon: 'code',
    template: `AUFGABE: Implementierung

Generiere eine Funktion, die die Entscheidungslogik aus dem folgenden Modell implementiert.

Anforderungen:
- Traversiere die Decision Map vom Einstiegsknoten aus.
- Nutze die technicalKeys als Variablennamen und expectedTypes als Datentypen.
- Nutze die output.values für Vergleiche (nicht die Labels).
- Wenn ein Knoten allowedValues hat: implementiere die Verzweigung erschöpfend über genau diese Werte und behandle einen unbekannten Wert als Fehler, nicht als stillen Durchfall.
- Knoten vom type "action" erzeugen einen Wert und verzweigen nicht. Setze ihr expression als Berechnung um und lege das Ergebnis unter ihrem technicalKey ab; spätere Ausdrücke greifen darauf zu.
- Wenn eine consequence ein expression hat: implementiere diese Rechnung. consequence.technical ist die Beschreibung dazu, nicht die Spezifikation.
- Die Ausdrücke sind FEEL. Übersetze sie in die Zielsprache, erfinde sie nicht um.
- Implementiere referenzierte Consequences (type: "consequence-ref") als gemeinsame Funktion (nur einmal implementiert, an allen Stellen referenziert).
- Wenn inputSource.kannScheitern = true: implementiere Fehlerbehandlung.
- Wenn inputSource.provider = "manuell": dokumentiere dass der Wert extern geliefert wird.
- Respektiere die Verbindlichkeit der Knowledge Sources. Wenn eine Quelle eine uri hat, setze sie als Kommentar an die betroffene Stelle — mitsamt fassung, falls angegeben.
- Melde Validierungsbefunde als TODO-Kommentare im Code, jeweils mit ihrer ruleId.
- Fehlt ein expression an einer action: markiere die Stelle als TODO. Rechne den Wert NICHT selbst aus.`,
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
