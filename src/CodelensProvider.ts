import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import {
  CODE_TEXT_LABEL_KEY_REGEX,
  CODE_TEXT_PATHS,
  PROJECT,
} from "./constants";
import { getCodeTextPath, getProjectName } from "./util";

/**
 * CodelensProvider
 */
type CodeText = Array<{ label: string; labelKey: string }>;

export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private _funcName: RegExp = new RegExp(/window.getCodeText/i);
  private _checkGetCodeTextFunction: boolean =
    !!vscode.workspace.getConfiguration("CodeTextLens")?.checkCodeTextFunction;
  private _codeTextLabelRegex: RegExp = new RegExp(CODE_TEXT_LABEL_KEY_REGEX);
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
    const conf = vscode.workspace.getConfiguration("CodeTextLens");
    const regex = conf.get("regex") as string;
    if (regex) {
      const temp = new RegExp(regex, "g");
      this._codeTextLabelRegex = temp;
    }
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
  public goToCodeText(args: any) {
    const codeTextPath = getCodeTextPath();
    vscode.workspace.openTextDocument(codeTextPath).then((doc) => {
      const project = getProjectName();
      if (!project) {
        return;
      }
      const indexOf = this.codesAsString[project].indexOf(args);
      const line = doc.lineAt(doc.positionAt(indexOf).line);
      const position = new vscode.Position(line.lineNumber, line.lineNumber);
      vscode.window.showTextDocument(doc).then((editor) => {
        editor.selections = [new vscode.Selection(position, position)];
        const range = new vscode.Range(position, position);
        editor.revealRange(range);
      });
    });
  }

  // NOTE: getter;
  get codes() {
    return this._codes;
  }
  get codesAsString() {
    return this._codesAsString;
  }
  get codeTextLabelRegex() {
    return this._codeTextLabelRegex;
  }
  // NOTE: setter
  set codes(codes) {
    this._codes = codes;
  }
  set codesAsString(codesAsString) {
    this._codesAsString = codesAsString;
  }
  set codeTextLabelRegex(temp: RegExp) {
    const conf = vscode.workspace.getConfiguration("CodeTextLens");
    const regex = conf.get("regex") as string;
    if (!regex) {
      return;
    }
    this._codeTextLabelRegex = new RegExp(regex, "g");
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
      if (!root || root?.path.includes("codeText.json")) {
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
          this._checkGetCodeTextFunction &&
          !this._funcName.test(line.text) &&
          !this._funcName.test(lineAbove.text)
        ) {
          continue;
        }
        const indexOf = line.text.indexOf(matches[0]);
        const position = new vscode.Position(line.lineNumber, indexOf);
        const range = document.getWordRangeAtPosition(
          position,
          new RegExp(this._codeTextLabelRegex)
        );
        if (!range) {
          continue;
        }
        const trimmed = matches[0].replace(/^['|"]|['|"]$/g, "");
        const label = codes.find((code) => code.labelKey === trimmed);
        if (!label) {
          continue;
        }
        const command = new vscode.CodeLens(range, {
          title: `${label.label}`,
          tooltip: "",
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
