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
import { getCodeTextPath, getProjectName } from "./util";

let disposables: Disposable[] = [];

export function activate(context: ExtensionContext) {
  const codelensProvider = new CodelensProvider();
  const codes = codelensProvider.codesAsString;

  languages.registerCodeLensProvider("*", codelensProvider);

  commands.registerCommand("code-lens.enableCodeLens", () => {
    workspace.getConfiguration("CodeTextLens").update("enabled", true, true);
  });

  commands.registerCommand("code-lens.disableCodeLens", () => {
    workspace.getConfiguration("CodeTextLens").update("enabled", false, true);
  });

  commands.registerCommand("code-lens.codelensAction", (args: any) => {
    const codeTextPath = getCodeTextPath();
    // TODO: 아래 로직도 provider 의 멤버함수로 만들것
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
