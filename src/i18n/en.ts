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

  // Node Type Descriptions
  'nodeType.decision.description': 'A business question with multiple outcomes',
  'nodeType.condition.description': 'Checks a value or state',
  'nodeType.action.description': 'Executes an action',
  'nodeType.consequence.description': 'Endpoint — what happens at the end of the path',

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

  // Canvas Header
  'canvas.untitled': 'Untitled map',
  'canvas.autoLayout': 'Auto-arrange',

  // Edge / Connections
  'edge.label': 'Connection',
  'edge.label.placeholder': 'e.g. Yes, No, Timeout...',
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
};
