# Rule Editor

Ein visueller Editor für Entscheidungslogik. Entscheidungsbäume grafisch abbilden und als maschinenlesbares JSON für KI-Agenten oder als Markdown für Dokumentation exportieren.

## Was kann man damit machen?

**Entscheidungsbäume bauen** — Über das "+"-Icon im Canvas oder am Knoten werden neue Knoten erstellt. Man wählt einen Knotentyp, formuliert die fachliche Frage oder Bedingung, und verbindet die Knoten zu einem Entscheidungsbaum. Der Baum ordnet sich per Auto-Layout automatisch an und kann jederzeit manuell angepasst werden. Ein Klick auf eine freie Stelle im Canvas öffnet das Menü zur Knotenerstellung.

**Fünf Knotentypen nutzen** — Jeder Knotentyp hat eine eigene Farbe und Funktion:
- **Decision** (blau) — Eine fachliche Frage mit mehreren möglichen Ausgängen, z.B. "Wird dem Nutzer Zugriff gewährt?"
- **Condition** (gelb) — Prüft einen konkreten Wert oder Zustand, z.B. "Ist der Nutzer Teil der Organisation?"
- **Action** (lila) — Beschreibt eine Aktion, die ausgeführt wird, bevor der nächste Entscheidungsschritt folgt, z.B. "Benachrichtigung an Admin senden."
- **Consequence** (grün) — Der Endpunkt eines Pfades. Beschreibt was passiert: fachliche Konsequenz, optionaler technischer Hinweis (z.B. HTTP 403) und eine Referenz zur betroffenen Code-Stelle.
- **Input Data** (cyan) — Beschreibt einen Datenwert, der in die Entscheidung einfließt. Wird oberhalb des Baums positioniert und vertikal mit den Bedingungen verbunden, die den Wert nutzen. Enthält Informationen über die Datenquelle (System, manuell, Ergebnis einer anderen Entscheidung), die Verfügbarkeit (vorhanden oder zur Laufzeit zu beschaffen) und ob der Abruf scheitern kann.

**Konsequenzen und Inputs referenzieren** — Wenn mehrere Pfade im Baum zum selben Ergebnis führen (z.B. drei verschiedene Wege zu "Zugriff verweigert"), muss die Konsequenz nur einmal als vollständiger Knoten angelegt werden. Alle weiteren Vorkommen werden als kompakte Referenz-Knoten dargestellt, die auf das Original verweisen. Das gleiche Prinzip gilt für Input-Data-Knoten: ein Datenwert wie "Nutzerrolle" wird einmal definiert und kann über Referenzen mit mehreren Bedingungen verknüpft werden.

**Regelautorität hinterlegen** — Jeder Knoten kann mit einer oder mehreren fachlichen Quellen versehen werden, die begründen warum eine Regel existiert. Dazu gehören Gesetze, Normen, interne Richtlinien, Verträge oder Fachwissen. Jede Quelle hat eine Verbindlichkeitsstufe: verbindlich (darf nicht geändert werden), empfohlen (Alternativen zulässig) oder optional (darf hinterfragt werden). Im Export kann ein KI-Agent damit entscheiden, wie strikt er eine Regel behandeln muss.

**Validierung** — Der Editor prüft den Entscheidungsbaum automatisch auf strukturelle Probleme. Fehlende Ausgänge bei Boolean-Bedingungen, unerreichbare Knoten, Sackgassen und leere Endpunkte werden erkannt und als Warn-Icons an den betroffenen Knoten angezeigt. Im rechten Panel sieht man eine Zusammenfassung aller Warnungen. Die Validierungsergebnisse werden im JSON-Export mitgegeben, damit ein KI-Agent weiß wo Lücken im Modell sind, statt sie stillschweigend durch Raten zu füllen.

**Verbindungen beschriften** — Jeder Ausgang eines Knotens kann mit einem Label versehen werden ("Ja", "Nein", "Timeout", "Gast", "Mitglied"). Bei Knoten mit mehreren Ausgängen zeigt ein "?"-Platzhalter an, wo noch ein Label fehlt. Kontextabhängige Vorschläge (z.B. "Ja/Nein" bei Decision-Knoten) beschleunigen die Eingabe. Optional kann jedem Label ein technischer Wert zugewiesen werden (z.B. Label "Gast" → Wert "GUEST").

**JSON-Export** — Der Entscheidungsbaum wird als strukturiertes JSON exportiert, das maschinenlesbar ist. Jeder Knoten enthält seine fachliche Beschreibung, optional einen technischen Key und Datentyp. Input-Data-Knoten werden als eigene Sektion exportiert mit Angaben zur Datenquelle und den verbundenen Bedingungen. Verbindungen enthalten neben dem Label einen technischen Wert. Der Startknoten wird als "entry" markiert. Identische Konsequenzen werden über eine gemeinsame Referenz-ID verknüpft. Felder die nicht ausgefüllt sind, werden weggelassen statt als null exportiert — das hält den Export schlank für fachliche Nutzer und vollständig für technische.

**Prompt-Templates** — Im rechten Panel stehen fünf vorgefertigte Prompt-Templates zur Verfügung: Implementierung, Testfälle, Code-Audit, Dokumentation und Vollständigkeitsprüfung. Ein Klick kopiert einen vollständigen Prompt in die Zwischenablage: eine Schema-Erklärung, das JSON-Modell der aktuellen Map und die Aufgabenstellung. Der Prompt kann direkt in Claude, ChatGPT oder einen lokalen Agenten wie Ollama eingefügt werden.

**Markdown-Export** — Der Baum wird als lesbarer, eingerückter Pfad-Durchlauf exportiert. Man sieht auf einen Blick, welche Entscheidung zu welcher Konsequenz führt. Am Ende steht eine Zusammenfassung aller Endpunkte. Das Format eignet sich für Tickets, Prompts oder technische Dokumentation.

**SVG- und PNG-Export** — Der Canvas wird als Vektor- oder Rastergrafik exportiert, genau so wie er im Editor aussieht. Die Dateien lassen sich in Präsentationen, Confluence-Seiten oder Design-Tools einbetten.

**Anpassen** — Die App bietet vier Farb-Themes (Light, Dark, Retro, Miami) und zwei Sprachen (Deutsch, Englisch). Alle Aktionen können per Undo/Redo (Cmd+Z / Cmd+Shift+Z) rückgängig gemacht werden. Änderungen werden automatisch gespeichert.

## Demo

Diese Web-Version speichert Daten im Browser (localStorage). Die vollständige Desktop-Version (macOS) bietet zusätzlich Dateisystem-Integration, Workspace-Verwaltung und native Dialoge.