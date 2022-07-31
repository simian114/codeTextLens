import {
  ExtensionContext,
  languages,
  commands,
  Disposable,
  workspace,
} from "vscode";
import * as vscode from "vscode";
import { CodelensProvider } from "./CodelensProvider";
import CodeTextHandler from "./CodeTextHandler";

let disposables: Disposable[] = [];

export function activate(context: ExtensionContext) {
  const codelensProvider = new CodelensProvider();
  const codeTextHandler = new CodeTextHandler();

  const temp = workspace
    .getConfiguration("CodeTextLens")
    ?.languages?.split(",");
  temp.forEach((language: string) => {
    languages.registerCodeLensProvider(language.trim(), codelensProvider);
  });

  commands.registerCommand("code-lens.enableCodeLens", () => {
    workspace.getConfiguration("CodeTextLens").update("enabled", true, true);
  });

  commands.registerCommand("code-lens.disableCodeLens", () => {
    workspace.getConfiguration("CodeTextLens").update("enabled", false, true);
  });

  commands.registerCommand("code-lens.codelensAction", (args: any) => {
    codelensProvider.goToCodeText(args);
  });
  commands.registerCommand("code-lens.toggleCodeLens", (args: any) => {
    const conf = workspace.getConfiguration("CodeTextLens").get("enabled");
    workspace.getConfiguration("CodeTextLens").update("enabled", !conf, true);
  });
  commands.registerCommand("code-lens.check-codeText-function", (args: any) => {
    const conf = workspace
      .getConfiguration("CodeTextLens")
      .get("checkCodeTextFunction");
    workspace
      .getConfiguration("CodeTextLens")
      .update("checkCodeTextFunction", !conf, true);
  });
  commands.registerCommand("code-lens.only-jsx", (args: any) => {
    const conf = workspace.getConfiguration("CodeTextLens").get("onlYJSX");
    workspace.getConfiguration("CodeTextLens").update("onlYJSX", !conf, true);
  });
  commands.registerCommand("strapi-handler", (args: any) => {
    codeTextHandler.handle();
  });
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (disposables) {
    disposables.forEach((item) => item.dispose());
  }
  disposables = [];
}
