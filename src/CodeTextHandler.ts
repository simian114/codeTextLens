import * as vscode from "vscode";
import * as fs from "fs";
import { getCodeTextPath, getCurrentWorkspace, readCodeText } from "./util";
import { faker } from "@faker-js/faker";
import clipboard from "clipboardy";

const items: vscode.QuickPickItem[] = [
  {
    label: "keygen",
    description: "새로운 CodeText 생성",
    detail: "$(files) Test1 Detail with icon",
  },
  {
    label: "sync",
    description: "dev 서버 동기화", // NOTE: 파일 인터넷으로 올리는게 아니라 직접 넣을 수 있게 만들기
    detail: "아직 구현안됨..",
  },
  {
    label: "make import file",
    description: "서버에 올릴 import 파일 생성", // NOTE: 자동으로 올리는게 되면 사실상 이게 필요없을듯?
    detail: "아직 구현안됨..",
  },
  {
    label: "key dup check",
    description: "dup check",
    detail: "아직 구현안됨..",
  },
];

class CodeTextHandler {
  constructor() {}

  public handle() {
    vscode.window.showQuickPick(items).then((selected) => {
      if (!selected) {
        vscode.window.showErrorMessage("동작을 선택하지 않았습니다!");
        return;
      }

      const options: { [key: string]: () => void } = {
        keygen: this.create,
      };
      if (!options[selected.label]) {
        vscode.window.showErrorMessage("아직 구현되지 않았습니다.");
        return;
      }
      options[selected.label]();
    });
  }

  // TODO: dup check
  private async create() {
    const label = await vscode.window.showInputBox({
      title: "CodeText Label",
      placeHolder: "추가할 label 을 입력해주세요.",
      prompt: "ESC 를 입력하면 취소됩니다.",
    });
    if (label === undefined) {
      vscode.window.showInformationMessage("취소하셨습니다.");
      return;
    }
    let labelKeyPrefix = await vscode.window.showInputBox({
      title: "CodeText Label Key",
      placeHolder:
        "key 를 입력해주세요. 입력이 없으면 최신의 label key 를 사용합니다.",
      prompt: "ESC 를 입력하면 취소됩니다.",
    });
    if (labelKeyPrefix === undefined) {
      vscode.window.showInformationMessage("취소하셨습니다.");
      return;
    }
    const d = readCodeText();
    const json = JSON.parse(d) as {
      data: Array<{ label: string; labelKey: string }>;
      modified: boolean;
    };
    if (!labelKeyPrefix.length) {
      labelKeyPrefix = json.data[json.data.length - 1].labelKey
        .split(".")
        .slice(0, 2)
        .join(".");
    }
    if (!json) {
      return;
    }
    let uniqueKey = faker.name
      .findName()
      .toLocaleLowerCase()
      .replaceAll(" ", "")
      .replaceAll(".", "");

    while (true) {
      const existed = json.data.find((d) => d.labelKey === uniqueKey);
      if (!existed) {
        break;
      }
      uniqueKey = faker.name
        .findName()
        .toLocaleLowerCase()
        .replaceAll(" ", "")
        .replaceAll(".", "");
    }
    const labelKey = [labelKeyPrefix, uniqueKey].join(".");
    json.data.push({
      label: label || "",
      labelKey,
    });
    json.modified = true;

    const path = getCodeTextPath();
    fs.writeFile(path, JSON.stringify(json, null, 4), (err) => {
      if (err) {
        console.error(err);
        vscode.window.showErrorMessage("label 추가에 실패했습니다.");
        return;
      }
      // clipboard.writeSync(labelKey);
      clipboard.writeSync(`window.getCodeText("${labelKey}")`);
      vscode.window.showInformationMessage("새로운 label이 추가되었습니다.");
    });
  }
  // ... TODO
  private read({ label, labelKey }: { label: string; labelKey: string }) {
    //
  }
  private update({ label, labelKey }: { label: string; labelKey: string }) {
    //
  }
  private delete({ labelKey }: { labelKey: string }) {
    //
  }
  private sync() {
    //
  }
  private makeImportFile() {
    //
  }
  private upload() {
    //
  }
}

export default CodeTextHandler;
