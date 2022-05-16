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
import * as vscode from "vscode";
import { CodelensProvider } from "./CodelensProvider";
import * as path from "path";
import * as fs from "fs";
import { getCodeTextPath, getFilePath, getProjectName } from "./util";

let disposables: Disposable[] = [];

function getProjectRoot() {
  const root = window?.activeTextEditor?.document?.uri;
  //
  if (!root) {
    return "";
  }
  return workspace.getWorkspaceFolder(root)?.uri.fsPath || "";
}

export function activate(context: ExtensionContext) {
  const codelensProvider = new CodelensProvider();
  let workspaceFolders: ReadonlyArray<vscode.WorkspaceFolder> | undefined =
    vscode.workspace.workspaceFolders;
  const codes: { gelato: string; waffle: string } = {
    gelato: "",
    waffle: "",
  };
  workspaceFolders?.forEach((workspaceFolder) => {
    if (
      workspaceFolder.name !== "gelato" &&
      workspaceFolder.name !== "waffle"
    ) {
      return;
    }
    const name = workspaceFolder.name;
    const filePath = path.join(
      workspaceFolder.uri.fsPath,
      getFilePath(workspaceFolder.name)
    );
    const jsonFile = fs.readFileSync(filePath, "utf8");
    codes[name] = jsonFile;
  });
  const root = getProjectRoot();
  languages.registerCodeLensProvider("*", codelensProvider);
  commands.registerCommand("code-lens.enableCodeLens", () => {
    workspace
      .getConfiguration("CodeTextLens.enabled")
      .update("enableCodeLens", true, true);
  });

  commands.registerCommand("code-lens.disableCodeLens", () => {
    workspace
      .getConfiguration("code-lens")
      .update("enableCodeLens", false, true);
  });

  commands.registerCommand("code-lens.codelensAction", (args: any) => {
    const codeTextPath = getCodeTextPath();
    workspace.openTextDocument(codeTextPath).then((doc) => {
      const project = getProjectName();
      if (!project) {
        return;
      }
      const indexOf = codes[project].indexOf(args);
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
