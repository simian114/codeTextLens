import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { stringify } from "querystring";

const getCurrentWorkspace = (): vscode.WorkspaceFolder | undefined => {
  const root = vscode.window?.activeTextEditor?.document?.uri;
  if (!root) {
    return undefined;
  }
  return vscode.workspace.getWorkspaceFolder(root);
};

const readCodeText = () => {
  const filePath = getCodeTextPath();
  const data = fs.readFileSync(filePath, "utf-8");
  return data;
};

const getFilePath = (name: string): string => {
  if (name === "gelato") {
    return (
      vscode.workspace.getConfiguration("CodeTextLens").get("gelato") ||
      "src/util/codeText.json"
    );
  } else if (name === "waffle") {
    return (
      vscode.workspace.getConfiguration("CodeTextLens").get("waffle") ||
      "src/utils/codeText.json"
    );
  }
  return "";
};

const getProjectName = (): "" | "gelato" | "waffle" => {
  const root = vscode.window?.activeTextEditor?.document?.uri;
  if (!root) {
    return "";
  }
  const currentWorkFolder = vscode.workspace.getWorkspaceFolder(root);
  if (
    !currentWorkFolder ||
    (currentWorkFolder.name !== "gelato" && currentWorkFolder.name !== "waffle")
  ) {
    return "";
  }
  return currentWorkFolder.name;
};

const getCodeTextPath = (): string => {
  const project = getProjectName();
  const currentWorkFolder = getCurrentWorkspace();
  if (!project || !currentWorkFolder) {
    return "";
  }
  const filePath = path.join(
    currentWorkFolder.uri.fsPath,
    getFilePath(project)
  );

  return filePath;
};

export {
  getFilePath,
  getProjectName,
  getCodeTextPath,
  getCurrentWorkspace,
  readCodeText,
};
