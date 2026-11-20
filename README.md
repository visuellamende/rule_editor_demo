# Rule Editor

Ein visueller Editor für Entscheidungslogik. Eine **Decision Map** beschreibt, welchen Weg ein Fall durch eine Reihe von Bedingungen nimmt und in welcher benannten Folge er endet. Der Editor macht daraus ein Modell, das Menschen lesen und Maschinen prüfen, ausführen und weiterverarbeiten können — als JSON für KI-Agenten, als DMN 1.3 für Entscheidungsmaschinen oder als Markdown für die Dokumentation.

Das Format dahinter ist in [docs/format-spec.md](docs/format-spec.md) spezifiziert.

## Was kann man damit machen?

**Decision Maps bauen** — Über das "+"-Icon im Canvas oder am Knoten werden neue Knoten erstellt. Man wählt einen Knotentyp, formuliert die fachliche Frage oder Bedingung und verbindet die Knoten. Anders als ein Baum darf eine Decision Map zusammenlaufen: Mehrere Wege können zum selben Knoten führen. Per Auto-Layout ordnet sie sich automatisch an und kann jederzeit manuell angepasst werden.

**Fünf Knotentypen nutzen** — Jeder Knotentyp hat eine eigene Farbe und Funktion:
- **Decision** (blau) — Die Frage, die die Map beantwortet, z.B. "Wird dem Nutzer Zugriff gewährt?" Hier beginnt jede Auswertung.
- **Condition** (gelb) — Prüft einen Wert und verzweigt, z.B. "Welche Rolle hat der Nutzer?" mit je einem Ausgang für Gast und Mitglied.
- **Action** (lila) — Bestimmt einen Wert, bevor weitergeprüft wird, z.B. "Angemessene Minderungsquote bestimmen". Eine Action verzweigt nicht; sie hat genau einen Ausgang.
- **Consequence** (grün) — Der Endpunkt eines Pfades. Beschreibt die fachliche Folge, optional die technische Umsetzung (z.B. HTTP 403), die Rechnung und eine Referenz zur betroffenen Code-Stelle.
- **Input Data** (cyan) — Ein Datenwert, der in die Entscheidung einfließt. Steht oberhalb der Map und ist mit den Bedingungen verbunden, die ihn nutzen. Beschreibt, woher der Wert kommt (System, manuell, Ergebnis einer anderen Entscheidung), ob er schon vorliegt oder zur Laufzeit beschafft wird und ob der Abruf scheitern kann.

**Konsequenzen und Inputs referenzieren** — Führen mehrere Pfade zum selben Ergebnis (z.B. drei Wege zu "Zugriff verweigert"), wird die Konsequenz einmal vollständig angelegt; alle weiteren Vorkommen sind kompakte Referenzen auf das Original. Dasselbe gilt für Inputs: Ein Datenwert wie "Nutzerrolle" wird einmal definiert und über Referenzen mit mehreren Bedingungen verbunden.

**Verbindungen beschriften** — Jeder Ausgang trägt ein Label für Menschen ("Gast") und einen technischen Wert für Maschinen ("GUEST"). Über den technischen Wert wird verzweigt. Kennt der Knoten seinen Wertebereich, schlägt der Editor die noch offenen Werte als Erstes vor; sonst kontextabhängige Paare wie Ja/Nein.

**Wertebereiche festlegen** — Verzweigt eine Bedingung über eine Aufzählung, etwa Nutzerrollen, legt man die zulässigen Werte fest. Der Editor zeigt dann für jeden Wert, ob ein Ausgang ihn abdeckt. Kommt später ein Wert hinzu, fällt er nicht mehr still durchs Raster, sondern wird als Lücke gemeldet.

**Rechnen mit Ausdrücken** — Actions und Endpunkte können sagen, was sie rechnen, als Ausdruck in einer Teilsprache von FEEL, der Ausdruckssprache von DMN: z.B. `round(grundmiete * (1 - quote / 100), 2)`. Ausdrücke werden beim Tippen geprüft und bei der Auswertung gerechnet. Datums- und Zeitarithmetik kann die Teilsprache noch nicht.

**Regelautorität hinterlegen** — Jeder Knoten kann mit fachlichen Quellen versehen werden, die begründen, warum eine Regel existiert: Gesetze, Normen, interne Richtlinien, Verträge oder Fachwissen. Jede Quelle hat eine Verbindlichkeitsstufe — verbindlich, empfohlen oder optional —, an der ein KI-Agent erkennt, wie strikt er eine Regel behandeln muss. Gesetze und Normen lassen sich mit einem auflösbaren Verweis versehen (bevorzugt ein ELI), mit dem Element innerhalb der Quelle (etwa einem Absatz) und mit der Fassung, die gemeint ist.

**Testfälle hinterlegen** — An jedem Endpunkt lassen sich Beispiele festhalten: welche Eingaben zu diesem Ergebnis führen sollen. Der Editor rechnet jedes Beispiel durch die Map nach und zeigt sofort, ob es seinen Endpunkt erreicht — und wenn nicht, warum: welcher Wert fehlte oder an welchem Knoten kein Ausgang passte.

**Prüfung** — Der Editor prüft die Map bei jeder Änderung gegen die Regeln der Formatspezifikation: ob jeder Weg in einem Endpunkt endet, ob es Kreise gibt, ob Verzweigungen maschinenlesbare Werte tragen und ihren Wertebereich abdecken, ob Ausdrücke lesbar sind, ob Testfälle stimmen und anderes mehr. Befunde erscheinen am betroffenen Knoten und in der Seitenleiste, in drei Stufen: Fehler, Warnung, Hinweis. Jeder Befund trägt die ID seiner Regel, z.B. `CONS-07`, und lässt sich in der Spezifikation nachschlagen. Im JSON-Export gehen die Befunde mit, damit ein KI-Agent weiß, wo Lücken im Modell sind, statt sie durch Raten zu füllen.

**JSON-Export und -Import** — Die Map wird als flaches, maschinenlesbares JSON exportiert: Knoten mit ihren Ausgängen, Inputs mit ihrer Herkunft, Testfälle, Prüfbefunde und der Einstiegsknoten. Derselbe Upload-Knopf importiert sowohl dieses Format als auch das interne Dateiformat des Editors. Beim Import des Exportformats wird zusätzlich die Dokumentstruktur geprüft.

**DMN-Export** — Die Map wird als Entscheidungstabelle in DMN 1.3 exportiert, mit einer Zeile pro Pfad. Rechnet ein Endpunkt, steht sein Ausdruck in einer eigenen Ausgabespalte; Normverweise werden als Wissensquellen übernommen. Vor dem Export zeigt der Editor, was sich nicht verlustfrei nach DMN übertragen lässt.

**Für KI-Agenten** — Im rechten Panel stehen fünf Prompt-Vorlagen bereit: Implementierung, Testfälle, Code-Audit, Dokumentation und Vollständigkeitsprüfung. Ein Klick kopiert einen vollständigen Prompt in die Zwischenablage: die Erklärung des Formats, das JSON der aktuellen Map und die Aufgabe. Umgekehrt liefert "Für KI-Agenten" oben rechts einen Prompt, mit dem ein Agent aus einem Fachkonzept eine neue Map erzeugt, die man importieren und im Editor prüfen kann.

**Markdown-Export** — Die Map wird als lesbarer, eingerückter Pfad-Durchlauf exportiert, mit einer Zusammenfassung aller Endpunkte. Gut für Tickets, Prompts oder technische Dokumentation.

**SVG- und PNG-Export** — Der Canvas wird als Vektor- oder Rastergrafik exportiert, so wie er im Editor aussieht.

**Anpassen** — Vier Farb-Themes (Light, Dark, Retro, Miami), zwei Sprachen (Deutsch, Englisch), Undo/Redo (Cmd+Z / Cmd+Shift+Z) und automatisches Speichern.

## Entwicklung

```bash
npm install
npm run dev
```

| Befehl | Zweck |
|---|---|
| `npm run build` | Typprüfung und Produktions-Build |
| `npm run lint` | ESLint |
| `npm run check-rules` | Prüft die Regeln der Spezifikation an Decision Maps mit je einem gezielten Verstoß |
| `npm run check-feel` | Prüft die Ausdruckssprache: Rechnen, Fehlermeldungen, statische Analyse |
| `npm run check-roundtrip` | Prüft den Weg Export → Import auf Datenverlust: Knotentypen, Einstieg, Referenzen, Anzahl der Knoten und Kanten |

## Demo

Diese Web-Version speichert Daten im Browser (localStorage). Die vollständige Desktop-Version (macOS) bietet zusätzlich Dateisystem-Integration, Workspace-Verwaltung und native Dialoge.

## Lizenz

Copyright 2026 Erik Lolies.

**Quellcode:** [Apache License 2.0](LICENSE). Die Nutzung ist frei, auch
kommerziell. Wer die Software oder Teile davon weitergibt, muss die
Copyright-Hinweise und den Inhalt der Datei [NOTICE](NOTICE) mitliefern.

**Formatspezifikation** ([docs/format-spec.md](docs/format-spec.md)):
[Creative Commons Namensnennung 4.0 International (CC BY 4.0)](docs/LICENSE-CC-BY-4.0.txt).
Sie darf genutzt, übersetzt, verändert und weitergegeben werden, auch
kommerziell, solange der Urheber genannt, auf die Quelle verwiesen und
kenntlich gemacht wird, ob etwas geändert wurde. Zum Beispiel so:

> „Decision Map Format" von Erik Lolies,
> https://github.com/visuellamende/rule_editor_demo, lizenziert unter CC BY 4.0.

