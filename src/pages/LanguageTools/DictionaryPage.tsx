import { MuiMaterial } from '@eten-lab/ui-kit';
import { Button, FiPlus } from '@eten-lab/ui-kit';
import { CrowdBibleUI } from '@eten-lab/ui-kit';
import { IonContent } from '@ionic/react';
import { useEffect, useState } from 'react';
const { FiltersAndSearch, TitleWithIcon, WordTable } = CrowdBibleUI;
const { Box } = MuiMaterial;

type Content = {
  content: string;
  upVote: number;
  downVote: number;
};

type Item = {
  title: Content;
  contents: Content[];
};

const MOCK_ETHNOLOGUE_OPTIONS = ['Ethnologue1', 'Ethnologue2'];
const MOCK_DICTIONARY: Array<Item> = [
  {
    title: {
      content: 'title content',
      downVote: 1,
      upVote: 2,
    },
    contents: [
      {
        content: 'some content1',
        upVote: 10,
        downVote: 11,
      },
      {
        content: 'some content122',
        upVote: 10,
        downVote: 11,
      },
    ],
  },
  {
    title: {
      content: 'title content2',
      downVote: 21,
      upVote: 22,
    },
    contents: [
      {
        content: 'some content4',
        upVote: 30,
        downVote: 31,
      },
    ],
  },
];

const PADDING = 20;

export function DictionaryPage() {
  const [keyTerms, setKeyTerms] = useState([] as Array<Item>);
  useEffect(() => {
    setKeyTerms(MOCK_DICTIONARY);
  }, []);

  return (
    <IonContent>
      <Box
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'start'}
        alignItems={'start'}
        padding={`${PADDING}px`}
      >
        <Box
          width={1}
          flexDirection={'row'}
          display={'flex'}
          justifyContent={'space-between'}
        >
          <Box flex={3}>
            <TitleWithIcon
              onClose={() => {}}
              onBack={() => {}}
              withBackIcon={false}
              withCloseIcon={false}
              label="Dictionary"
            ></TitleWithIcon>
          </Box>
          <Box flex={1} width={1} minWidth={'140px'}>
            <Button
              variant="contained"
              startIcon={<FiPlus />}
              fullWidth
              onClick={() => alert('click!')}
            >
              New Word
            </Button>
          </Box>
        </Box>

        <FiltersAndSearch
          ethnologueOptions={MOCK_ETHNOLOGUE_OPTIONS}
          setEthnologue={() => console.log('setEthnologue!')}
          setLanguage={(l: string) => console.log('setLanguage! ' + l)}
          setSearch={(s: string) => console.log('setSearch' + s)}
        />

        <Box display={'flex'} flexDirection="column" width={1}>
          <WordTable
            items={keyTerms}
            label_1="Word"
            label_2="Definition"
          ></WordTable>
        </Box>
      </Box>
    </IonContent>
  );
}
