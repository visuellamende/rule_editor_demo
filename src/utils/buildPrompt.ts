import { SYSTEM_PROMPT } from '../data/systemPrompt';
import type { PromptTemplate } from '../data/promptTemplates';

export function buildPrompt(
  template: PromptTemplate,
  jsonExport: string,
): string {
  return `${SYSTEM_PROMPT}

---

ENTSCHEIDUNGSMODELL:

${jsonExport}

---

${template.template}`;
}
