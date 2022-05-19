import {
  ExtensionContext,
  languages,
  commands,
  Disposable,
  workspace,
} from "vscode";
import { CodelensProvider } from "./CodelensProvider";

let disposables: Disposable[] = [];

export function activate(context: ExtensionContext) {
  const codelensProvider = new CodelensProvider();

  languages.registerCodeLensProvider("*", codelensProvider);

  commands.registerCommand("code-lens.enableCodeLens", () => {
    workspace.getConfiguration("CodeTextLens").update("enabled", true, true);
  });

  commands.registerCommand("code-lens.disableCodeLens", () => {
    workspace.getConfiguration("CodeTextLens").update("enabled", false, true);
  });

  commands.registerCommand("code-lens.codelensAction", (args: any) => {
    codelensProvider.goToCodeText(args);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (disposables) {
    disposables.forEach((item) => item.dispose());
  }
  disposables = [];
}
