import { SYSTEM_PROMPT } from '../data/systemPrompt';
import type { PromptTemplate } from '../data/promptTemplates';

/** Ersetzt {NAME}-Platzhalter durch die Werte; unbekannte Platzhalter bleiben stehen. */
function fillVariables(text: string, values: Record<string, string>): string {
  return text.replace(/\{([A-ZÄÖÜ_]+)\}/g, (match, name: string) => values[name] ?? match);
}

export function buildPrompt(
  template: PromptTemplate,
  jsonExport: string,
  variables: Record<string, string> = {},
): string {
  const values = { ...(template.variables ?? {}), ...variables };
  const summary = template.summary ? `${fillVariables(template.summary, values)}

---

` : '';

  return `${summary}${SYSTEM_PROMPT}

---

ENTSCHEIDUNGSMODELL:

${jsonExport}

---

${fillVariables(template.template, values)}`;
}
