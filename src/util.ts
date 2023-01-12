import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { CODE_TEXT_PATHS } from './constants';

const getCurrentWorkspace = (): vscode.WorkspaceFolder | undefined => {
  const root = vscode.window?.activeTextEditor?.document?.uri;
  if (!root) {
    return undefined;
  }
  return vscode.workspace.getWorkspaceFolder(root);
};

const isValidWorkFolder = () => {
  const root = vscode.window?.activeTextEditor?.document?.uri;
  if (!root || root?.path.includes(CODE_TEXT_PATHS)) {
    return false;
  }
  const currentWorkFolder = vscode.workspace.getWorkspaceFolder(root);
  if (!currentWorkFolder) {
    return false;
  }
  if (
    currentWorkFolder.name !== 'gelato' &&
    currentWorkFolder.name !== 'waffle'
  ) {
    return false;
  }
  return true;
};

const readCodeText = () => {
  const filePath = getCodeTextPath();
  const data = fs.readFileSync(filePath, 'utf-8');
  return data;
};

const getProjectName = (): '' | 'gelato' | 'waffle' => {
  const root = vscode.window?.activeTextEditor?.document?.uri;
  if (!root) {
    return '';
  }
  const currentWorkFolder = vscode.workspace.getWorkspaceFolder(root);
  if (
    !currentWorkFolder ||
    (currentWorkFolder.name !== 'gelato' && currentWorkFolder.name !== 'waffle')
  ) {
    return '';
  }
  return currentWorkFolder.name;
};

const getCodeTextPath = (): string => {
  const currentWorkFolder = getCurrentWorkspace();
  if (!currentWorkFolder) {
    return '';
  }
  return path.join(currentWorkFolder.uri.fsPath, CODE_TEXT_PATHS);
};

export {
  getProjectName,
  getCodeTextPath,
  getCurrentWorkspace,
  readCodeText,
  isValidWorkFolder,
};
