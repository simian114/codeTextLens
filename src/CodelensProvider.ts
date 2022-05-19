import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import { CODE_TEXT_PATHS, PROJECT } from "./constants";

/**
 * CodelensProvider
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
type obj = Record<string, unknown>;
type CodeText = Array<{ label: string; labelKey: string }>;

export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private funcName: RegExp = new RegExp(/window.getCodeText/i);
  private codeTextLabelRegex: RegExp = new RegExp(/\'\w+\.\w+.\w+\'/g);
  private _filePaths: { [PROJECT.gelato]: string; [PROJECT.waffle]: string } = {
    [PROJECT.gelato]: CODE_TEXT_PATHS[PROJECT.gelato],
    [PROJECT.waffle]: CODE_TEXT_PATHS[PROJECT.waffle],
  };
  private _codes: { gelato: CodeText; waffle: CodeText } = {
    gelato: [],
    waffle: [],
  };
  private _codesAsString: { gelato: string; waffle: string } = {
    gelato: "",
    waffle: "",
  };
  //
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this._onDidChangeCodeLenses.fire();
    this.readCodeTextFilesAndSet();
    this.watchJSONFileChange();
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public readCodeTextFilesAndSet() {
    let workspaceFolders: ReadonlyArray<vscode.WorkspaceFolder> | undefined =
      vscode.workspace.workspaceFolders;
    workspaceFolders?.forEach((workspaceFolder: vscode.WorkspaceFolder) => {
      const { name } = workspaceFolder;
      if (name !== PROJECT.gelato && name !== PROJECT.waffle) {
        return;
      }
      const filePath = path.join(
        workspaceFolder.uri.fsPath,
        this._filePaths[name]
      );
      const jsonFile = fs.readFileSync(filePath, "utf8");
      const jsonData: {
        data: Array<{ label: string; labelKey: string }>;
        modified: boolean;
      } = JSON.parse(jsonFile);
      this._codes[name] = jsonData.data;
      this._codesAsString[name] = jsonFile;
    });
  }

  // NOTE: getter;
  get codes() {
    return this._codes;
  }
  get codesAsString() {
    return this._codesAsString;
  }
  // NOTE: setter
  set codes(codes) {
    this._codes = codes;
  }
  set codesAsString(codesAsString) {
    this._codesAsString = codesAsString;
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (
      vscode.workspace.getConfiguration("CodeTextLens").get("enabled", true)
    ) {
      this.codeLenses = [];
      const root = vscode.window?.activeTextEditor?.document?.uri;
      if (!root) {
        return [];
      }
      const currentWorkFolder = vscode.workspace.getWorkspaceFolder(root);
      if (!currentWorkFolder) {
        return [];
      }
      if (
        currentWorkFolder.name !== "gelato" &&
        currentWorkFolder.name !== "waffle"
      ) {
        return [];
      }
      const codes = this._codes[currentWorkFolder.name];
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
        const label = codes.find((code) => code.labelKey === trimmed);
        if (!label) {
          continue;
        }
        const command = new vscode.CodeLens(range, {
          title: `${label.label}`,
          tooltip: "하하호호",
          command: "code-lens.codelensAction",
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
      vscode.workspace.getConfiguration("CodeTextLens").get("enabled", true)
    ) {
      return codeLens;
    }
    return null;
  }

  public watchJSONFileChange() {
    const watcher =
      vscode.workspace.createFileSystemWatcher("**/codeText.json");
    watcher.onDidChange((e) => {
      this.readCodeTextFilesAndSet();
      const currentDocument = vscode.window?.activeTextEditor?.document;
      if (!currentDocument) {
        return;
      }
    });
  }
}
