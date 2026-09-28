declare module "handlebars/dist/handlebars.js" {
  import type { Runtime, TemplateDelegate } from "handlebars";

  interface HandlebarsRuntime extends Runtime {
    compile: (
      input: string,
      options?: { strict?: boolean; noEscape?: boolean }
    ) => TemplateDelegate;
  }

  const Handlebars: HandlebarsRuntime;
  export default Handlebars;
}
