# Rule Editor

Ein visueller Editor für Entscheidungslogik. Entscheidungsbäume grafisch abbilden und als maschinenlesbares JSON für KI-Agenten oder als Markdown für Dokumentation exportieren.

## Was kann man damit machen?

**Entscheidungsbäume bauen** — Über das "+"-Icon im Canvas oder am Knoten werden neue Knoten erstellt. Man wählt einen Knotentyp, formuliert die fachliche Frage oder Bedingung, und verbindet die Knoten zu einem Entscheidungsbaum. Der Baum ordnet sich per Auto-Layout automatisch an und kann jederzeit manuell angepasst werden.

**Vier Knotentypen nutzen** — Jeder Knotentyp hat eine eigene Farbe und Funktion:
- **Decision** (blau) — Eine fachliche Frage mit mehreren möglichen Ausgängen, z.B. "Wird dem Nutzer Zugriff gewährt?"
- **Condition** (gelb) — Prüft einen konkreten Wert oder Zustand, z.B. "Ist der Nutzer Teil der Organisation?" Optional mit technischem Key und erwartetem Datentyp für die Code-Generierung.
- **Action** (lila) — Beschreibt eine Aktion, die ausgeführt wird, bevor der nächste Entscheidungsschritt folgt, z.B. "Benachrichtigung an Admin senden."
- **Consequence** (grün) — Der Endpunkt eines Pfades. Beschreibt was passiert: fachliche Konsequenz, optionaler technischer Hinweis (z.B. HTTP 403) und eine Referenz zur betroffenen Code-Stelle.

**Konsequenzen referenzieren** — Wenn mehrere Pfade im Baum zum selben Ergebnis führen (z.B. drei verschiedene Wege zu "Zugriff verweigert"), muss die Konsequenz nur einmal als vollständiger Knoten angelegt werden. Alle weiteren Vorkommen werden als kompakte Referenz-Knoten dargestellt, die auf das Original verweisen. Das hält den Baum übersichtlich und stellt sicher, dass identische Konsequenzen im Export als zusammengehörig erkannt werden.

**Verbindungen beschriften** — Jeder Ausgang eines Knotens kann mit einem Label versehen werden ("Ja", "Nein", "Timeout", "Gast", "Mitglied"). Bei Knoten mit mehreren Ausgängen zeigt ein "?"-Platzhalter an, wo noch ein Label fehlt. Kontextabhängige Vorschläge (z.B. "Ja/Nein" bei Decision-Knoten) beschleunigen die Eingabe. Optional kann jedem Label ein technischer Wert zugewiesen werden (z.B. Label "Gast" → Wert "GUEST").

**JSON-Export** — Der Entscheidungsbaum wird als strukturiertes JSON exportiert, das maschinenlesbar ist. Jeder Knoten enthält seine fachliche Beschreibung, optional einen technischen Key und Datentyp. Verbindungen enthalten neben dem Label einen technischen Wert. Der Startknoten wird als "entry" markiert. Identische Konsequenzen werden über eine gemeinsame Referenz-ID verknüpft. KI-Agenten können dieses JSON direkt als Implementierungsspezifikation nutzen.

**Markdown-Export** — Der Baum wird als lesbarer, eingerückter Pfad-Durchlauf exportiert. Man sieht auf einen Blick, welche Entscheidung zu welcher Konsequenz führt. Am Ende steht eine Zusammenfassung aller Endpunkte. Das Format eignet sich für Tickets, Prompts oder technische Dokumentation.

**SVG-Export** — Der Canvas wird als Vektorgrafik exportiert, genau so wie er im Editor aussieht. Die SVG-Datei lässt sich in Präsentationen, Confluence-Seiten oder Design-Tools einbetten.

**Anpassen** — Die App bietet vier Farb-Themes (Light, Dark, Retro, Miami) und zwei Sprachen (Deutsch, Englisch). Alle Aktionen können per Undo/Redo (Cmd+Z / Cmd+Shift+Z) rückgängig gemacht werden. Änderungen werden automatisch gespeichert.

## Demo

Diese Web-Version speichert Daten im Browser (localStorage). Die vollständige Desktop-Version (macOS) bietet zusätzlich Dateisystem-Integration, Workspace-Verwaltung und native Dialoge.
