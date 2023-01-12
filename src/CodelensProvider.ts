import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  CODE_TEXT_LABEL_KEY_REGEX,
  CODE_TEXT_PATHS,
  CODE_URL,
  PROJECT,
} from './constants';
import {
  getCodeTextPath,
  getCurrentWorkspace,
  getProjectName,
  isValidWorkFolder,
} from './util';

/**
 * CodelensProvider
 */
type CodeText = { label: string; labelKey: string };
type CodeTextArray = Array<CodeText>;

export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private _funcName: RegExp = new RegExp(/window.getCodeText/i);
  private _checkGetCodeTextFunction: boolean =
    !!vscode.workspace.getConfiguration('CodeTextLens')?.checkCodeTextFunction;
  private _codeTextLabelRegex: RegExp = new RegExp(CODE_TEXT_LABEL_KEY_REGEX);

  private _codes: { gelato: CodeTextArray; waffle: CodeTextArray } = {
    gelato: [],
    waffle: [],
  };
  private _codesAsString: { gelato: string; waffle: string } = {
    gelato: '',
    waffle: '',
  };

  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this._onDidChangeCodeLenses.fire();
    this.readCodeTextFilesAndSet();
    this.watchJSONFileChange();
    const conf = vscode.workspace.getConfiguration('CodeTextLens');
    const regex = conf.get('regex') as string;
    if (regex) {
      const temp = new RegExp(regex, 'g');
      this._codeTextLabelRegex = temp;
    }
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
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
    const conf = vscode.workspace.getConfiguration('CodeTextLens');
    const regex = conf.get('regex') as string;
    if (!regex) {
      return;
    }
    this._codeTextLabelRegex = new RegExp(regex, 'g');
  }

  public async getCodeTextFromServer() {
    const projectName = getProjectName();
    const workspaceFolder = getCurrentWorkspace();
    if (!projectName || !workspaceFolder) {
      return;
    }
    const res = await axios.get(CODE_URL[projectName]);

    const codeTextArray = res?.data?.data?.map((item: any) => ({
      label: item?.attributes?.label,
      labelKey: item?.attributes?.labelKey,
    }));

    const filePath = path.join(workspaceFolder.uri.fsPath, CODE_TEXT_PATHS);
    const codeTextAsString: string = JSON.stringify(codeTextArray, null, '\t');

    fs.writeFileSync(filePath, codeTextAsString, 'utf-8');

    this._codes[projectName] = codeTextArray;
    this._codesAsString[projectName] = codeTextAsString;
  }

  public async readCodeTextFilesAndSet() {
    let workspaceFolders: ReadonlyArray<vscode.WorkspaceFolder> | undefined =
      vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      return;
    }

    for await (const workspaceFolder of workspaceFolders) {
      const { name } = workspaceFolder;
      if (name !== PROJECT.gelato && name !== PROJECT.waffle) {
        return;
      }
      const filePath = path.join(workspaceFolder.uri.fsPath, CODE_TEXT_PATHS);
      const codeTextAsString = fs.readFileSync(filePath, 'utf8');

      const codeTextArray: CodeTextArray = JSON.parse(codeTextAsString);

      if (!Array.isArray(codeTextArray)) {
        await this.getCodeTextFromServer();
        continue;
      }

      this._codes[name] = codeTextArray;
      this._codesAsString[name] = codeTextAsString;
    }
  }

  // NOTE: 코드 렌즈 선택했을 때 이동
  public async goToCodeText(args: any) {
    if (!isValidWorkFolder()) {
      return;
    }

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

  // NOTE: 실제 로직 실행 부분
  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    const projectName = getProjectName();
    if (
      !vscode.workspace.getConfiguration('CodeTextLens').get('enabled', true) ||
      !isValidWorkFolder() ||
      !projectName
    ) {
      return [];
    }

    this.codeLenses = [];

    const codes = this._codes[projectName];
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
      const trimmed = matches[0].replace(/^['|"]|['|"]$/g, '');
      const label = codes.find((code) => code.labelKey === trimmed);
      if (!label) {
        continue;
      }
      const command = new vscode.CodeLens(range, {
        title: `${label.label}`,
        tooltip: '',
        command: 'code-lens.codelensAction',
        arguments: [label.label],
      });
      this.codeLenses.push(command);
    }
    return this.codeLenses;
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ) {
    if (
      vscode.workspace.getConfiguration('CodeTextLens').get('enabled', true)
    ) {
      return codeLens;
    }
    return null;
  }

  public watchJSONFileChange() {
    const currentWorkFolder = getCurrentWorkspace();
    if (!currentWorkFolder) {
      return '';
    }

    const watcher = vscode.workspace.createFileSystemWatcher(
      path.join(currentWorkFolder.uri.fsPath, 'src/**/codeText.json')
    );

    watcher.onDidChange(async (e) => {
      await this.getCodeTextFromServer();
    });
  }
}
