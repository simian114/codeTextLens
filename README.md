# README

스터너를 위한 CodeText LENS

## How to

`command palette` 에서 `enable Codelens` 실행

## Features

1. Lens 기능

![스크린샷 2022-05-14 오후 10 18 24](https://user-images.githubusercontent.com/49119625/168427459-65ea80ae-7d6f-4b83-9209-a3a7d4458eb2.png)

2. 바로가기

![openFile](https://user-images.githubusercontent.com/49119625/168428113-ea779a66-0d1b-408f-9958-8df8b2b831d3.gif)

> Tip: 사진의 단축키로 빠르게 이동가능

![스크린샷 2022-05-14 오후 10 36 05](https://user-images.githubusercontent.com/49119625/168428131-7193f535-fa70-4f16-9dd3-7d2d87b88e87.png)

## Release Notes

### 0.0.0

- 0.0.4
  - 와플, 젤라또 코드렌증
- 0.0.5
  - codeText 파일 싱크
- 0.0.6
  - enable, disable 버그 수정
- 0.0.7
  - toggle 기능 추가
  - codeText 파싱에 사용할 regex 설정 파일에서 직접 수정 가능
- 0.0.8
  - strapi 추가
- 0.0.9
  - strapi 추가 에러 수정 및 클립보드에 복사
- 0.1.1
  - strapi v3 -> v4 대응
  - `src/\*\*/codeText.json` 의 파일 변화를 감지해서 `codeText.json` 데이터를 서버로부터 새로 불러옴
    - 또는 `command palette -> codeText: Reload CodeText.json` 로 직접 불러올 수도 있음.
  - `project root/codeLens.json` 에 데이터 보관
    - gitignore 에 추가해야함.
