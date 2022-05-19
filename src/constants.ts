const PROJECT = {
  gelato: "gelato",
  waffle: "waffle",
} as const;

const CODE_TEXT_PATHS = {
  [PROJECT.gelato]: "src/util/codeText.json",
  [PROJECT.waffle]: "src/utils/codeText.json",
};

const CODE_TEXT_LABEL_KEY_REGEX = /\'\w+\.\w+.\w+\'/g;

export { PROJECT, CODE_TEXT_PATHS, CODE_TEXT_LABEL_KEY_REGEX };
