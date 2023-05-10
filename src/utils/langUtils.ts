import {
  Dialect,
  Lang,
  LanguageInfo,
  Region,
} from '@eten-lab/ui-kit/dist/LangSelector/LangSelector';
import { PropertyKeyConst } from '../constants/graph.constant';
import Tags from 'language-tags';

enum TagTypes {
  LANGUAGE = 'language',
  REGION = 'region',
  DIALECT = 'variant',
}
enum TagSpecialDescriptions {
  PRIVATE_USE = 'Private use',
}

export const makeFindPropsByLang = (
  langInfo: LanguageInfo,
): { key: string; value: string }[] => {
  const res: Array<{ key: string; value: string }> = [
    {
      key: PropertyKeyConst.LANGUAGE_TAG,
      value: langInfo.lang.tag,
    },
  ];
  if (langInfo.dialect?.tag) {
    res.push({
      key: PropertyKeyConst.DIALECT_TAG,
      value: langInfo.dialect.tag,
    });
  }
  if (langInfo.region?.tag) {
    res.push({
      key: PropertyKeyConst.REGION_TAG,
      value: langInfo.region.tag,
    });
  }
  return res;
};

export const randomLangTags = (amount: number): Array<string> => {
  const allTags = Tags.search(/.*/);
  const langs: Array<Lang> = [];
  const dialects: Array<Dialect> = [
    { tag: null, descriptions: ['- not defined-'] },
  ];
  const regions: Array<Region> = [
    { tag: null, descriptions: ['- not defined-'] },
  ];

  for (const currTag of allTags) {
    if (
      currTag.deprecated() ||
      currTag.descriptions().includes(TagSpecialDescriptions.PRIVATE_USE)
    ) {
      continue;
    }

    if (currTag.type() === TagTypes.LANGUAGE) {
      langs.push({
        tag: currTag.format(),
        descriptions: currTag.descriptions(),
      });
    }
    if (currTag.type() === TagTypes.REGION) {
      regions.push({
        tag: currTag.format(),
        descriptions: currTag.descriptions(),
      });
    }
    if (currTag.type() === TagTypes.DIALECT) {
      dialects.push({
        tag: currTag.format(),
        descriptions: currTag.descriptions(),
      });
    }
  }
  const langTagsList: Array<string> = [];
  for (let index = 0; index < amount; index++) {
    const li = Math.floor(Math.random() * langs.length);
    const ri = Math.floor(Math.random() * regions.length);
    const di = Math.floor(Math.random() * dialects.length);

    const tag = `${langs[li].tag}-${regions[ri].tag}-${dialects[di].tag}`;
    const isValid = Tags(tag).valid();
    if (!isValid) {
      throw new Error(
        `language seeding error: generated tag ${tag} is not valid`,
      );
    }

    langTagsList.push(tag);
  }

  return langTagsList;
};

export const tag2langInfo = (tagGiven: string): LanguageInfo | undefined => {
  const complexTag = Tags(tagGiven);

  const lang = complexTag.find(TagTypes.LANGUAGE);
  const region = complexTag.find(TagTypes.REGION);
  const dialect = complexTag.find(TagTypes.DIALECT);
  const langInfo: LanguageInfo = {
    lang: { tag: lang?.format() || '', descriptions: lang?.descriptions() },
  };
  if (region) {
    langInfo.region = {
      tag: region.format(),
      descriptions: region.descriptions(),
    };
  }
  if (dialect) {
    langInfo.dialect = {
      tag: dialect.format(),
      descriptions: dialect.descriptions(),
    };
  }
  return langInfo;
};

export const langInfo2tag = ({
  lang,
  region,
  dialect,
}: LanguageInfo): string => {
  let langTag = lang.tag;
  region?.tag && (langTag += '-' + region?.tag);
  dialect?.tag && (langTag += '-' + dialect?.tag);
  return Tags(langTag).format();
};
