import type { TranslationKey } from './de';

export const en: Record<TranslationKey, string> = {
  // App
  'app.name': 'Rule Editor',

  // Header
  'header.settings': 'Settings',

  // Empty State
  'emptyState.hint': 'Click to create the first node',
  'emptyState.button.ariaLabel': 'Create first node',

  // Node Types
  'nodeType.decision': 'Decision',
  'nodeType.condition': 'Condition',
  'nodeType.action': 'Action',
  'nodeType.consequence': 'Consequence',
  'nodeType.consequenceRef': 'Reference',

  // Node Type Descriptions
  'nodeType.decision.description': 'A business question with multiple outcomes',
  'nodeType.condition.description': 'Checks a value or state',
  'nodeType.action.description': 'Executes an action',
  'nodeType.consequence.description': 'Endpoint — what happens at the end of the path',
  'nodeType.consequenceRef.description': 'References an existing consequence',

  // Default Node Labels
  'nodeLabel.decision': 'New decision',
  'nodeLabel.condition': 'New condition',
  'nodeLabel.action': 'New action',
  'nodeLabel.consequence': 'New consequence',

  // Node Actions
  'node.addButton.ariaLabel': 'Add node',
  'node.addButton.title': 'Add node',

  // Sidebar — Map Info
  'sidebar.title': 'Project',
  'sidebar.mapInfo': 'Rulemap',
  'sidebar.mapName': 'Name',
  'sidebar.mapName.placeholder': 'Name of the rulemap...',
  'sidebar.mapDescription': 'Description',
  'sidebar.mapDescription.placeholder': 'What is this rulemap about?',
  'sidebar.mapCategory': 'Category',
  'sidebar.mapCategory.none': 'No category',
  'sidebar.mapCreated': 'Created',

  // Categories
  'category.validation': 'Validation',
  'category.permission': 'Permission',
  'category.state': 'State Transition',
  'category.business-logic': 'Business Logic',
  'category.error-handling': 'Error Handling',

  // Panel Placeholder
  'panel.title': 'Attributes',
  'panel.hint': 'Select a node to edit attributes.',
  'panel.generalTitle': 'General',
  'panel.nodeTitle': 'Node',
  'panel.refTitle': 'Reference',
  'panel.refTarget': 'References',
  'panel.refGoto': 'Show original',

  // Attribute Panel
  'panel.label': 'Label',
  'panel.label.placeholder': 'Enter a business question or description...',
  'panel.notes': 'Notes',
  'panel.notes.placeholder': 'Additional context...',
  'panel.consequence': 'Consequence',
  'panel.consequence.business': 'Business',
  'panel.consequence.business.placeholder': 'What happens from the user\'s perspective?',
  'panel.consequence.technical': 'Technical (optional)',
  'panel.consequence.technical.placeholder': 'Implementation details...',
  'panel.consequence.reference': 'Reference (optional)',
  'panel.consequence.reference.placeholder': 'Service, endpoint, component...',
  'panel.nodeType': 'Node type',
  'panel.technicalKey': 'Technical Key (optional)',
  'panel.technicalKey.placeholder': 'e.g. isUserInOrganization',
  'panel.expectedType': 'Expected Type (optional)',
  'panel.expectedType.placeholder': 'e.g. boolean, string, enum',
  'panel.inputSource': 'Data Source',
  'panel.inputSource.provider': 'Provider',
  'panel.inputSource.provider.none': 'Not specified',
  'panel.inputSource.provider.system': 'System (DB, API, Configuration)',
  'panel.inputSource.provider.manuell': 'Manual (User Input)',
  'panel.inputSource.provider.komposition': 'Result of another decision',
  'panel.inputSource.subtype': 'Subtype',
  'panel.inputSource.subtype.placeholder': 'e.g. master_data, external_api, cashier_input',
  'panel.inputSource.verfuegbarkeit': 'Availability',
  'panel.inputSource.verfuegbarkeit.none': 'Not specified',
  'panel.inputSource.verfuegbarkeit.vorhanden': 'Available (present before execution)',
  'panel.inputSource.verfuegbarkeit.laufzeit': 'Runtime (must be obtained)',
  'panel.inputSource.kannScheitern': 'Can fail',
  'panel.inputSource.referenziertEntscheidung': 'Referenced Decision',
  'panel.inputSource.referenziertEntscheidung.placeholder': 'e.g. isCustomerVerified',
  'panel.knowledgeSources': 'Rule Authority',
  'ks.art': 'Source Type',
  'ks.art.gesetz': 'Law / Regulation',
  'ks.art.gesetz.short': '§',
  'ks.art.norm_standard': 'Norm / Standard',
  'ks.art.norm_standard.short': 'Norm',
  'ks.art.interne_richtlinie': 'Internal Policy',
  'ks.art.interne_richtlinie.short': 'Policy',
  'ks.art.vertrag': 'Contract',
  'ks.art.vertrag.short': 'Contract',
  'ks.art.fachwissen': 'Domain Expertise',
  'ks.art.fachwissen.short': 'Expert',
  'ks.verbindlichkeit': 'Binding Level',
  'ks.verbindlichkeit.verbindlich': 'Mandatory (Agent must not change)',
  'ks.verbindlichkeit.verbindlich.short': 'Mandatory',
  'ks.verbindlichkeit.empfohlen': 'Recommended (Alternatives allowed)',
  'ks.verbindlichkeit.empfohlen.short': 'Recommended',
  'ks.verbindlichkeit.optional': 'Optional (May be questioned)',
  'ks.verbindlichkeit.optional.short': 'Optional',
  'ks.referenz': 'Reference',
  'ks.referenz.placeholder': 'e.g. §28a JuSchG, ISO 27001:2022 A.8.2',
  'ks.referenz.empty': 'No reference',
  'ks.eigner': 'Owner / Responsible',
  'ks.eigner.placeholder': 'e.g. Legal/Compliance, Product/Pricing',
  'ks.beschreibung': 'Description',
  'ks.beschreibung.placeholder': 'Brief description of the source',
  'ks.add': 'Add source',
  'ks.done': 'Done',
  'ks.remove': 'Remove',

  // Canvas Header
  'canvas.untitled': 'Untitled map',
  'canvas.autoLayout': 'Auto-arrange',

  // Edge / Connections
  'edge.label': 'Connection',
  'edge.label.placeholder': 'e.g. Yes, No, Timeout...',
  'edge.value': 'Technical Value (optional)',
  'edge.value.placeholder': 'e.g. GUEST, true, > 100',
  'edge.hint': 'Select a connection to edit its label.',
  'edge.suggestion.yes': 'Yes',
  'edge.suggestion.no': 'No',
  'edge.suggestion.true': 'True',
  'edge.suggestion.false': 'False',
  'edge.suggestion.allowed': 'Allowed',
  'edge.suggestion.denied': 'Denied',
  'edge.suggestion.success': 'Success',
  'edge.suggestion.error': 'Error',
  'edge.suggestion.timeout': 'Timeout',
  'edge.suggestion.then': 'Then',


  // Settings
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.language': 'Language',
  'settings.workspace': 'Workspace folder',
  'settings.changeWorkspace': 'Change',
  'settings.help': 'Help & Documentation',

  // Welcome Screen
  'welcome.subtitle': 'Choose a folder where your rulemaps will be stored.',
  'welcome.pickFolder': 'Choose folder',
  'welcome.hint': 'You can change the folder later in settings.',

  // Sidebar actions
  'sidebar.newMap': 'New rulemap',
  'sidebar.newFolder': 'New folder',
  'sidebar.delete': 'Delete',
  'sidebar.deleteConfirm': 'Are you sure you want to delete "{name}"?',
  'sidebar.rename': 'Rename',
  'import.button': 'Import JSON',
  'import.invalidFormat': 'Invalid rulemap format. The file must contain meta, nodes and edges.',
  'import.error': 'Import failed. Please check the file format.',

  // Canvas — No Map open
  'canvas.noMap': 'No rulemap open',
  'canvas.noMapHint': 'Create or open a rulemap from the sidebar.',

  // Panel — No Map open
  'panel.noMap': 'No rulemap open.',

  // Export
  'export.title': 'Export',
  'export.jsonFile': 'Save JSON',
  'export.jsonCopy': 'Copy JSON',
  'export.markdownFile': 'Save Markdown',
  'export.markdownCopy': 'Copy Markdown',
  'export.svgFile': 'Save SVG',
  'export.pngFile': 'Save PNG',

  // Help
  'help.whatIs': 'What is the Rule Editor?',
  'help.whatIsText': 'A visual editor for decision logic. You build decision trees from business questions and conditions. The result can be exported as JSON (machine-readable for AI agents) or Markdown (for documentation).',
  'help.howTo': 'How do I start?',
  'help.howToText': 'Click the "+" on the canvas and choose a node type. Formulate your question or condition. Use the "+" on a node to extend the tree. Connections are labeled automatically.',
  'help.nodeTypes': 'Node Types',
  'help.nodeDecision': 'A business question with multiple outcomes.',
  'help.nodeCondition': 'Checks a value or state.',
  'help.nodeAction': 'Executes an action.',
  'help.nodeConsequence': 'Endpoint — describes what happens at the end of the path.',
  'help.export': 'Export',
  'help.exportText': "Export your map as JSON (for AI agents) or Markdown (for documentation). You'll find the buttons in the right panel under \"General\".",
  'help.shortcuts': 'Keyboard Shortcuts',
  'help.undo': 'Undo',
  'help.redo': 'Redo',
  'help.doubleClick': 'Double-click on node/connection',
  'help.inlineEdit': 'Edit text inline',
  'help.delete': 'Delete selected element',
};
