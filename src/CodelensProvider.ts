import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";

/**
 * CodelensProvider
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
type obj = Record<string, unknown>;
export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private funcName: RegExp = new RegExp(/window.getCodeText/i);
  private codeTextLabelRegex: RegExp = new RegExp(/\'\w+\.\w+.\w+\'/g);
  private codes: Array<{ label: string; labelKey: string }> = [];
  //
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;
  //
  constructor() {
    this._onDidChangeCodeLenses.fire();
    let workspaceFolders: ReadonlyArray<vscode.WorkspaceFolder> | undefined =
      vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      const root = workspaceFolders[0] as vscode.WorkspaceFolder;
      const filePath = path.join(root.uri.fsPath, "src/util/codeText.json");
      const jsonFile = fs.readFileSync(filePath, "utf8");
      const jsonData: {
        data: Array<{ label: string; labelKey: string }>;
        modified: boolean;
      } = JSON.parse(jsonFile);
      this.codes = jsonData.data;
    }
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (
      vscode.workspace
        .getConfiguration("code-text-lens")
        .get("enableCodeLens", true)
    ) {
      this.codeLenses = [];
      const text = document.getText();
      let matches;
      while ((matches = this.codeTextLabelRegex.exec(text)) !== null) {
        const currnetLine = document.positionAt(matches.index).line;
        const line = document.lineAt(currnetLine);
        const lineAbove = document.lineAt(currnetLine - 1);
        if (!line || !lineAbove) {
          continue;
        }
        if (
          !this.funcName.test(line.text) &&
          !this.funcName.test(lineAbove.text)
        ) {
          continue;
        }
        const indexOf = line.text.indexOf(matches[0]);
        const position = new vscode.Position(line.lineNumber, indexOf);
        const range = document.getWordRangeAtPosition(
          position,
          new RegExp(this.codeTextLabelRegex)
        );
        if (!range) {
          continue;
        }
        const trimmed = matches[0].replace(/\'/g, "");
        const label = this.codes.find((code) => code.labelKey === trimmed);
        if (!label) {
          continue;
        }
        const command = new vscode.CodeLens(range, {
          title: `${label.label}`,
          tooltip: "asdf",
          command: "code-text-lens.codelensAction",
          arguments: [label.label],
        });
        this.codeLenses.push(command);
      }
      return this.codeLenses;
    }
    return [];
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ) {
    if (
      vscode.workspace
        .getConfiguration("code-text-lens")
        .get("enableCodeLens", true)
    ) {
      return codeLens;
    }
    return null;
  }
}
