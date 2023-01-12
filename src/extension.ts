import {
  commands,
  Disposable,
  ExtensionContext,
  languages,
  workspace,
} from 'vscode';
import { CodelensProvider } from './CodelensProvider';

let disposables: Disposable[] = [];

export async function activate(context: ExtensionContext) {
  // TODO: file handler
  const codelensProvider = new CodelensProvider();
  // NOTE: codeTextHandler 는 일단 무시

  const temp = workspace
    .getConfiguration('CodeTextLens')
    ?.languages?.split(',');
  temp.forEach((language: string) => {
    languages.registerCodeLensProvider(language.trim(), codelensProvider);
  });

  commands.registerCommand('code-lens.enableCodeLens', () => {
    workspace.getConfiguration('CodeTextLens').update('enabled', true, true);
  });

  commands.registerCommand('code-lens.disableCodeLens', () => {
    workspace.getConfiguration('CodeTextLens').update('enabled', false, true);
  });

  commands.registerCommand('code-lens.reloadCodeText', () => {
    codelensProvider.getCodeTextFromServer();
  });

  commands.registerCommand('code-lens.codelensAction', (args: any) => {
    codelensProvider.goToCodeText(args);
  });
  commands.registerCommand('code-lens.toggleCodeLens', (args: any) => {
    const conf = workspace.getConfiguration('CodeTextLens').get('enabled');
    workspace.getConfiguration('CodeTextLens').update('enabled', !conf, true);
  });
  commands.registerCommand('code-lens.check-codeText-function', (args: any) => {
    const conf = workspace
      .getConfiguration('CodeTextLens')
      .get('checkCodeTextFunction');
    workspace
      .getConfiguration('CodeTextLens')
      .update('checkCodeTextFunction', !conf, true);
  });
  commands.registerCommand('code-lens.only-jsx', (args: any) => {
    const conf = workspace.getConfiguration('CodeTextLens').get('onlYJSX');
    workspace.getConfiguration('CodeTextLens').update('onlYJSX', !conf, true);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (disposables) {
    disposables.forEach((item) => item.dispose());
  }
  disposables = [];
}
