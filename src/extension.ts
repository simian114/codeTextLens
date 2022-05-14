import {
  ExtensionContext,
  languages,
  commands,
  Disposable,
  workspace,
  window,
  Position,
  Selection,
  Range,
} from "vscode";
import { CodelensProvider } from "./CodelensProvider";
import * as path from "path";
import * as fs from "fs";

let disposables: Disposable[] = [];

function getProjectRoot() {
  const root = window?.activeTextEditor?.document?.uri;
  if (!root) {
    return "";
  }
  return workspace.getWorkspaceFolder(root)?.uri.fsPath || "";
}

export function activate(context: ExtensionContext) {
  const codelensProvider = new CodelensProvider();
  const root = getProjectRoot();
  const filePath = path.join(root, "src/util/codeText.json");
  const jsonFile = fs.readFileSync(filePath, "utf8");
  languages.registerCodeLensProvider("*", codelensProvider);
  commands.registerCommand("code-text-lens.enableCodeLens", () => {
    workspace
      .getConfiguration("code-text-lens")
      .update("enableCodeLens", true, true);
  });

  commands.registerCommand("code-text-lens.disableCodeLens", () => {
    workspace
      .getConfiguration("code-text-lens")
      .update("enableCodeLens", false, true);
  });

  commands.registerCommand("code-text-lens.codelensAction", (args: any) => {
    workspace.openTextDocument(filePath).then((doc) => {
      const indexOf = jsonFile.indexOf(args);
      const line = doc.lineAt(doc.positionAt(indexOf).line);
      const position = new Position(line.lineNumber, line.lineNumber);
      window.showTextDocument(doc).then((editor) => {
        editor.selections = [new Selection(position, position)];
        const range = new Range(position, position);
        editor.revealRange(range);
      });
    });
  });
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (disposables) {
    disposables.forEach((item) => item.dispose());
  }
  disposables = [];
}
