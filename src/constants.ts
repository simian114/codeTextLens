const PROJECT = {
  gelato: "gelato",
  waffle: "waffle",
} as const;

const CODE_TEXT_PATHS = {
  [PROJECT.gelato]: "src/util/codeText.json",
  [PROJECT.waffle]: "src/utils/codeText.json",
};

export { PROJECT, CODE_TEXT_PATHS };
