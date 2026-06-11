import type { RulemapFile } from '../types/rulemap';

export const exampleMap: RulemapFile = {
  version: '1.0.0',
  meta: {
    id: 'space-zugriff-default',
    name: 'Space Zugriff',
    description: 'Beispiel-Entscheidungsbaum für den Zugriff auf geschützte Gruppenbereiche.',
    category: 'permission',
    created: '2026-06-11T10:15:14.457Z',
    modified: '2026-06-11T10:15:35.847Z'
  },
  nodes: [
    {
      id: 'n1',
      type: 'ruleNode',
      position: { x: 50, y: 330 },
      data: {
        label: 'Wird dem Nutzer Zugriff auf den Space gewährt?',
        nodeType: 'decision',
        displayId: 1
      }
    },
    {
      id: 'n101',
      type: 'ruleNode',
      position: { x: 390, y: 330 },
      data: {
        label: 'Ist Nutzer Teil der Organisation?',
        nodeType: 'condition',
        displayId: 2
      }
    },
    {
      id: 'n102',
      type: 'ruleNode',
      position: { x: 730, y: 400 },
      data: {
        label: 'Zugriff verweigert',
        nodeType: 'consequence',
        displayId: 3
      }
    },
    {
      id: 'n103',
      type: 'ruleNode',
      position: { x: 730, y: 260 },
      data: {
        label: 'Hat der Space eine explizite Mitgliederliste?',
        nodeType: 'condition',
        displayId: 4
      }
    },
    {
      id: 'n105',
      type: 'ruleNode',
      position: { x: 1070, y: 120 },
      data: {
        label: 'Welche Rolle hat der Nutzer in der Organisation?',
        nodeType: 'condition',
        displayId: 6
      }
    },
    {
      id: 'n106',
      type: 'ruleNode',
      position: { x: 1070, y: 400 },
      data: {
        label: 'Ist die User-ID in der Space-Mitgliederliste?',
        nodeType: 'condition',
        displayId: 7
      }
    },
    {
      id: 'n107',
      type: 'ruleNode',
      position: { x: 1410, y: 190 },
      data: {
        label: 'Zugriff verweigert',
        nodeType: 'consequence',
        displayId: 8,
        consequence: {
          business: 'Zugriff verweigert'
        }
      }
    },
    {
      id: 'n108',
      type: 'ruleNode',
      position: { x: 1410, y: 50 },
      data: {
        label: 'Zugriff erlaubt',
        nodeType: 'consequence',
        displayId: 9,
        consequence: {
          business: 'Zugriff erlaubt'
        }
      }
    },
    {
      id: 'n109',
      type: 'ruleNode',
      position: { x: 1410, y: 470 },
      data: {
        label: 'Zugriff verweigert',
        nodeType: 'consequence',
        displayId: 10,
        consequence: {
          business: 'Zugriff verweigert'
        }
      }
    },
    {
      id: 'n110',
      type: 'ruleNode',
      position: { x: 1410, y: 330 },
      data: {
        label: 'Zugriff erlaubt',
        nodeType: 'consequence',
        displayId: 11,
        consequence: {
          business: 'Zugriff erlaubt'
        }
      }
    }
  ],
  edges: [
    {
      id: 'e101',
      source: 'n1',
      target: 'n101',
      type: 'labeled',
      label: ''
    },
    {
      id: 'e102',
      source: 'n101',
      target: 'n102',
      type: 'labeled',
      label: 'Nein',
      data: { label: 'Nein' }
    },
    {
      id: 'e103',
      source: 'n101',
      target: 'n103',
      type: 'labeled',
      label: 'Ja',
      data: { label: 'Ja' }
    },
    {
      id: 'e107',
      source: 'n105',
      target: 'n107',
      type: 'labeled',
      label: 'Gast',
      data: { label: 'Gast' }
    },
    {
      id: 'e108',
      source: 'n105',
      target: 'n108',
      type: 'labeled',
      label: 'Mitglied',
      data: { label: 'Mitglied' }
    },
    {
      id: 'e109',
      source: 'n106',
      target: 'n109',
      type: 'labeled',
      label: 'Nein',
      data: { label: 'Nein' }
    },
    {
      id: 'e110',
      source: 'n106',
      target: 'n110',
      type: 'labeled',
      label: 'Ja',
      data: { label: 'Ja' }
    },
    {
      type: 'labeled',
      source: 'n103',
      target: 'n106',
      label: 'Ja',
      id: 'xy-edge__n103-n106',
      data: { label: 'Ja' }
    },
    {
      type: 'labeled',
      source: 'n103',
      target: 'n105',
      label: 'Nein',
      id: 'xy-edge__n103-n105',
      data: { label: 'Nein' }
    }
  ]
};
