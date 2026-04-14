import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

const templateCache = new Map();

export const renderTemplate = (templateName, variables) => {
  if (!templateCache.has(templateName)) {
    const filePath = path.join(
      process.cwd(),
      "templates/emails",
      `${templateName}.hbs`
    );

    const file = fs.readFileSync(filePath, "utf8");
    const compiled = Handlebars.compile(file);

    templateCache.set(templateName, compiled);
  }

  const template = templateCache.get(templateName);

  return template(variables);
};