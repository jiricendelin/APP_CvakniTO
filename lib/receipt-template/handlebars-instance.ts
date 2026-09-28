import "server-only";
import Handlebars from "handlebars/dist/handlebars.js";
import { registerReceiptTemplateHelpers } from "./register-helpers";

let helpersRegistered = false;

export function getReceiptHandlebars(): typeof Handlebars {
  if (!helpersRegistered) {
    registerReceiptTemplateHelpers(Handlebars);
    helpersRegistered = true;
  }
  return Handlebars;
}
