export type MailTemplateContext = Record<string, string>;

export function renderMailTemplate(
  template: string,
  context: MailTemplateContext
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return context[key] ?? "";
  });
}
