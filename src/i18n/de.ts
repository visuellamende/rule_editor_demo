export const de = {
  // App
  'app.name': 'Rule Editor',

  // Header
  'header.settings': 'Einstellungen',

  // Empty State
  'emptyState.hint': 'Klick, um den ersten Knoten zu erstellen',
  'emptyState.button.ariaLabel': 'Ersten Knoten erstellen',

  // Node Types
  'nodeType.decision': 'Decision',
  'nodeType.condition': 'Condition',
  'nodeType.action': 'Action',
  'nodeType.consequence': 'Consequence',
  'nodeType.consequenceRef': 'Referenz',

  // Node Type Descriptions
  'nodeType.decision.description': 'Eine fachliche Frage mit mehreren Ausgängen',
  'nodeType.condition.description': 'Prüft einen Wert oder Zustand',
  'nodeType.action.description': 'Führt eine Aktion aus',
  'nodeType.consequence.description': 'Endpunkt — was passiert am Ende des Pfades',
  'nodeType.consequenceRef.description': 'Verweist auf eine bestehende Konsequenz',

  // Default Node Labels
  'nodeLabel.decision': 'Neue Entscheidung',
  'nodeLabel.condition': 'Neue Bedingung',
  'nodeLabel.action': 'Neue Aktion',
  'nodeLabel.consequence': 'Neue Konsequenz',

  // Node Actions
  'node.addButton.ariaLabel': 'Knoten hinzufügen',
  'node.addButton.title': 'Knoten hinzufügen',

  // Sidebar — Map Info
  'sidebar.title': 'Projekt',
  'sidebar.mapInfo': 'Rulemap',
  'sidebar.mapName': 'Name',
  'sidebar.mapName.placeholder': 'Name der Rulemap...',
  'sidebar.mapDescription': 'Beschreibung',
  'sidebar.mapDescription.placeholder': 'Worum geht es in dieser Rulemap?',
  'sidebar.mapCategory': 'Kategorie',
  'sidebar.mapCategory.none': 'Keine Kategorie',
  'sidebar.mapCreated': 'Erstellt',

  // Kategorien (von Knoten-Ebene hierher verschoben)
  'category.validation': 'Validierung',
  'category.permission': 'Berechtigung',
  'category.state': 'State Transition',
  'category.business-logic': 'Geschäftslogik',
  'category.error-handling': 'Fehlerbehandlung',

  // Panel Placeholder
  'panel.title': 'Attribute',
  'panel.hint': 'Knoten auswählen, um Attribute zu bearbeiten.',
  'panel.generalTitle': 'Allgemein',
  'panel.nodeTitle': 'Knoten',
  'panel.refTitle': 'Referenz',
  'panel.refTarget': 'Referenziert',
  'panel.refGoto': 'Original anzeigen',

  // Attribut-Panel
  'panel.label': 'Bezeichnung',
  'panel.label.placeholder': 'Fachliche Frage oder Beschreibung eingeben...',
  'panel.notes': 'Notizen',
  'panel.notes.placeholder': 'Ergänzende Informationen...',
  'panel.consequence': 'Konsequenz',
  'panel.consequence.business': 'Fachlich',
  'panel.consequence.business.placeholder': 'Was passiert aus Nutzersicht?',
  'panel.consequence.technical': 'Technisch (optional)',
  'panel.consequence.technical.placeholder': 'Implementierungsdetails...',
  'panel.consequence.reference': 'Referenz (optional)',
  'panel.consequence.reference.placeholder': 'Service, Endpoint, Komponente...',
  'panel.nodeType': 'Knotentyp',
  'panel.technicalKey': 'Technischer Key (optional)',
  'panel.technicalKey.placeholder': 'z.B. isUserInOrganization',
  'panel.expectedType': 'Erwarteter Typ (optional)',
  'panel.expectedType.placeholder': 'z.B. boolean, string, enum',
  'panel.inputSource': 'Datenquelle',
  'panel.inputSource.provider': 'Provider',
  'panel.inputSource.provider.none': 'Nicht angegeben',
  'panel.inputSource.provider.system': 'System (DB, API, Konfiguration)',
  'panel.inputSource.provider.manuell': 'Manuell (Benutzereingabe)',
  'panel.inputSource.provider.komposition': 'Ergebnis einer anderen Entscheidung',
  'panel.inputSource.subtype': 'Subtyp',
  'panel.inputSource.subtype.placeholder': 'z.B. stammdaten, externe_api, kassierer_eingabe',
  'panel.inputSource.verfuegbarkeit': 'Verfügbarkeit',
  'panel.inputSource.verfuegbarkeit.none': 'Nicht angegeben',
  'panel.inputSource.verfuegbarkeit.vorhanden': 'Vorhanden (liegt vor dem Lauf vor)',
  'panel.inputSource.verfuegbarkeit.laufzeit': 'Laufzeit (muss beschafft werden)',
  'panel.inputSource.kannScheitern': 'Kann scheitern',
  'panel.inputSource.referenziertEntscheidung': 'Referenzierte Entscheidung',
  'panel.inputSource.referenziertEntscheidung.placeholder': 'z.B. isCustomerVerified',

  // Canvas Header
  'canvas.untitled': 'Unbenannte Map',
  'canvas.autoLayout': 'Automatisch anordnen',

  // Edge / Verbindungen
  'edge.label': 'Verbindung',
  'edge.label.placeholder': 'z.B. Ja, Nein, Timeout...',
  'edge.value': 'Technischer Wert (optional)',
  'edge.value.placeholder': 'z.B. GUEST, true, > 100',
  'edge.hint': 'Verbindung auswählen, um das Label zu bearbeiten.',
  'edge.suggestion.yes': 'Ja',
  'edge.suggestion.no': 'Nein',
  'edge.suggestion.true': 'Wahr',
  'edge.suggestion.false': 'Falsch',
  'edge.suggestion.allowed': 'Erlaubt',
  'edge.suggestion.denied': 'Verweigert',
  'edge.suggestion.success': 'Erfolg',
  'edge.suggestion.error': 'Fehler',
  'edge.suggestion.timeout': 'Timeout',
  'edge.suggestion.then': 'Dann',


  // Settings
  'settings.title': 'Einstellungen',
  'settings.theme': 'Theme',
  'settings.language': 'Sprache',
  'settings.workspace': 'Workspace-Ordner',
  'settings.changeWorkspace': 'Ändern',
  'settings.help': 'Hilfe & Dokumentation',

  // Welcome Screen
  'welcome.subtitle': 'Wähle einen Ordner, in dem deine Rulemaps gespeichert werden.',
  'welcome.pickFolder': 'Ordner auswählen',
  'welcome.hint': 'Du kannst den Ordner später in den Einstellungen ändern.',

  // Sidebar actions
  'sidebar.newMap': 'Neue Rulemap',
  'sidebar.newFolder': 'Neuer Ordner',
  'sidebar.delete': 'Löschen',
  'sidebar.deleteConfirm': 'Möchtest du „{name}“ wirklich löschen?',
  'sidebar.rename': 'Umbenennen',
  'import.button': 'JSON importieren',
  'import.invalidFormat': 'Ungültiges Rulemap-Format. Die Datei muss meta, nodes und edges enthalten.',
  'import.error': 'Import fehlgeschlagen. Bitte prüfe das Dateiformat.',

  // Canvas — Keine Map geöffnet
  'canvas.noMap': 'Keine Rulemap geöffnet',
  'canvas.noMapHint': 'Erstelle oder öffne eine Rulemap in der Seitenleiste.',

  // Panel — Keine Map geöffnet
  'panel.noMap': 'Keine Rulemap geöffnet.',

  // Export
  'export.title': 'Export',
  'export.jsonFile': 'JSON speichern',
  'export.jsonCopy': 'JSON kopieren',
  'export.markdownFile': 'Markdown speichern',
  'export.markdownCopy': 'Markdown kopieren',
  'export.svgFile': 'SVG speichern',
  'export.pngFile': 'PNG speichern',

  // Help
  'help.whatIs': 'Was ist der Rule Editor?',
  'help.whatIsText': 'Ein visueller Editor für Entscheidungslogik. Du baust Entscheidungsbäume aus fachlichen Fragen und Bedingungen. Das Ergebnis lässt sich als JSON (maschinenlesbar für KI-Agenten) oder Markdown (für Dokumentation) exportieren.',
  'help.howTo': 'Wie starte ich?',
  'help.howToText': 'Klicke auf das "+" im Canvas und wähle einen Knotentyp. Formuliere deine Frage oder Bedingung. Über das "+" am Knoten baust du den Baum weiter aus. Verbindungen werden automatisch beschriftet.',
  'help.nodeTypes': 'Knotentypen',
  'help.nodeDecision': 'Eine fachliche Frage mit mehreren Ausgängen.',
  'help.nodeCondition': 'Prüft einen Wert oder Zustand.',
  'help.nodeAction': 'Führt eine Aktion aus.',
  'help.nodeConsequence': 'Endpunkt — beschreibt was am Ende des Pfades passiert.',
  'help.export': 'Export',
  'help.exportText': 'Exportiere deine Map als JSON (für KI-Agenten) oder Markdown (für Dokumentation). Du findest die Buttons im rechten Panel unter "Allgemein".',
  'help.shortcuts': 'Tastenkürzel',
  'help.undo': 'Rückgängig',
  'help.redo': 'Wiederherstellen',
  'help.doubleClick': 'Doppelklick auf Knoten/Verbindung',
  'help.inlineEdit': 'Text direkt bearbeiten',
  'help.delete': 'Ausgewähltes Element löschen',
} as const;

export type TranslationKey = keyof typeof de;
