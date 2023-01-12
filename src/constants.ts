const PROJECT = {
  gelato: 'gelato',
  waffle: 'waffle',
} as const;

const CODE_TEXT_PATHS = 'codeLens.json';

const CODE_URL = {
  [PROJECT.gelato]:
    'https://dev-strapi.stunning.kr/api/loud-code-labels?pagination[limit]=9999&fields[0]=labelKey&fields[1]=label',
  [PROJECT.waffle]:
    'https://dev-strapi.stunning.kr/api/notefolio-code-labels?pagination[limit]=9999&fields[0]=labelKey&fields[1]=label',
};

const CODE_TEXT_LABEL_KEY_REGEX = /\'\w+\.\w+.\w+\'/g;

export { PROJECT, CODE_TEXT_PATHS, CODE_TEXT_LABEL_KEY_REGEX, CODE_URL };
