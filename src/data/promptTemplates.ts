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
- Traversiere den Entscheidungsbaum vom Entry-Knoten aus.
- Nutze die technicalKeys als Variablennamen und expectedTypes als Datentypen.
- Nutze die output.values für Vergleiche (nicht die Labels).
- Implementiere identische Consequences (gleicher consequenceRef) als gemeinsame Funktion.
- Wenn inputSource.kannScheitern = true: implementiere Fehlerbehandlung.
- Wenn inputSource.provider = "manuell": dokumentiere dass der Wert extern geliefert wird.
- Respektiere die Verbindlichkeit der Knowledge Sources.
- Melde Validierungswarnungen als TODO-Kommentare im Code.`,
  },
  {
    id: 'tests',
    labelKey: 'template.tests',
    descriptionKey: 'template.tests.desc',
    icon: 'check',
    template: `AUFGABE: Testfälle generieren

Generiere für JEDEN Pfad im Entscheidungsbaum einen Unit-Test.

Anforderungen:
- Jeder Pfad vom Entry-Knoten bis zur Consequence ist ein Testfall.
- Der Testname beschreibt den Pfad (z.B. "test_user_not_in_org_access_denied").
- Nutze die output.values als Eingabedaten.
- Das erwartete Ergebnis kommt aus consequence.business.
- Bei identischen Consequences (consequenceRef): teste jeden Pfad separat.
- Wenn Validierungswarnungen existieren: generiere einen fehlschlagenden Test pro Warnung mit Kommentar.`,
  },
  {
    id: 'audit',
    labelKey: 'template.audit',
    descriptionKey: 'template.audit.desc',
    icon: 'shield',
    template: `AUFGABE: Code-Audit

Prüfe den folgenden Code gegen das Entscheidungsmodell. Das Modell ist die einzige Wahrheit.

Für JEDEN Pfad im Entscheidungsbaum:
1. Existiert im Code eine Stelle, die diese Bedingungskette prüft?
2. Führt diese Stelle zum erwarteten Ergebnis?
3. Wenn KEINE passende Stelle: melde "Nicht gefunden". Spekuliere NICHT.

Format pro Regel:
### Regel [Nr]: [Pfad]
- **Erwartung:** [Ergebnis aus consequence.business]
- **Status:** ✅ Implementiert / ❌ Nicht gefunden
- **Fundstelle:** [Datei:Zeile, Methode] oder "Keine Fundstelle"

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
- Wenn Knowledge Sources vorhanden: nenne die fachliche Grundlage.
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

Prüfe:
1. Sind alle möglichen Eingabekombinationen abgedeckt? (z.B. bei enum-Typen: gibt es für jeden Wert einen Ausgang?)
2. Gibt es widersprüchliche Pfade, die bei denselben Eingaben zu verschiedenen Ergebnissen führen?
3. Gibt es Bedingungen ohne technischen Key oder Datentyp?
4. Gibt es Consequences ohne fachliche Beschreibung?
5. Gibt es Validierungswarnungen im Modell?

Format:
- Für jede gefundene Lücke: beschreibe das Problem und schlage eine Lösung vor.
- Am Ende: Gesamtbewertung (Vollständig / Lücken vorhanden / Kritische Lücken).`,
  },
];
