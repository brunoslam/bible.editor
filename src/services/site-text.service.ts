import { PropertyKeyConst } from '../constants/graph.constant';
import { ElectionTypeConst } from '@/constants/voting.constant';
import { TableNameConst } from '@/constants/table-name.constant';

import {
  Votable,
  SiteTextDto,
  SiteTextWithTranslationCntDto,
  SiteTextWithTranslationVotablesDto,
  SiteTextTranslationVotable,
  SiteTextTranslationDto,
} from '@/dtos/site-text.dto';

import { GraphFirstLayerService } from './graph-first-layer.service';
import { VotingService } from './voting.service';
import { DefinitionService } from './definition.service';

import { SiteText } from '@/models/site-text/site-text.entity';
import { SiteTextTranslation } from '@/models/site-text/site-text-translation.entity';

import { SiteTextRepository } from '@/repositories/site-text/site-text.repository';
import { SiteTextTranslationRepository } from '@/repositories/site-text/site-text-translation.repository';

export class SiteTextService {
  constructor(
    private readonly graphFirstLayerService: GraphFirstLayerService,
    private readonly votingService: VotingService,
    private readonly definitionService: DefinitionService,

    private readonly siteTextRepo: SiteTextRepository,
    private readonly siteTextTranslationRepo: SiteTextTranslationRepository,
  ) {}

  private async createOrFindSiteTextOnGraph(
    languageId: Nanoid,
    siteText: string,
    definitionText: string,
  ): Promise<{ wordId: Nanoid; definitionId: Nanoid }> {
    const langDto = await this.definitionService.getLanguageById(languageId);

    const { wordId, electionId } =
      await this.definitionService.createWordAndDefinitionsElection(
        siteText,
        languageId,
        langDto.electionWordsId!,
      );

    const { definitionId } = await this.definitionService.createDefinition(
      definitionText,
      wordId,
      electionId,
    );

    return {
      wordId,
      definitionId,
    };
  }

  async getSelectedSiteTextTranslation(
    siteTextId: Nanoid,
    langId: Nanoid,
  ): Promise<SiteTextTranslationDto | null> {
    const translationEntity =
      await this.siteTextTranslationRepo.getSelectedSiteTextTranslation(
        siteTextId,
        langId,
      );

    if (!translationEntity) {
      return null;
    }

    const translatedSiteText =
      (await this.graphFirstLayerService.getNodePropertyValue(
        translationEntity.word_ref,
        PropertyKeyConst.NAME,
      )) as string;
    const translatedDefinition =
      (await this.graphFirstLayerService.getNodePropertyValue(
        translationEntity.definition_ref,
        PropertyKeyConst.TEXT,
      )) as string;

    return {
      id: translationEntity.id,
      siteTextId,
      languageId: langId,
      translatedSiteText,
      translatedDefinition,
    };
  }

  private async getRecommendedSiteTextTranslation(
    siteTextId: Nanoid,
    langId: Nanoid,
  ): Promise<SiteTextTranslationDto | null> {
    const election = await this.votingService.getElectionByRef(
      ElectionTypeConst.SITE_TEXT_TRANSLATION,
      siteTextId,
      TableNameConst.SITE_TEXT,
    );

    if (!election) {
      throw new Error('Not exists election entity with given props');
    }

    const translations =
      await this.siteTextTranslationRepo.getSiteTextTranslationList(
        siteTextId,
        langId,
      );

    let highestVoted: {
      id: string | null;
      votes: number;
    } = {
      id: null,
      votes: 0,
    };

    for (const translation of translations) {
      const candidate = await this.votingService.getCandidateByRef(
        election.id,
        translation.id,
      );

      if (!candidate) {
        throw new Error('Not exists candidate entity with given props');
      }

      const voteStatus = await this.votingService.getVotesStats(candidate.id);

      if (voteStatus.upVotes >= highestVoted.votes) {
        highestVoted = {
          id: translation.id,
          votes: voteStatus.upVotes,
        };
      }
    }

    if (!highestVoted.id) {
      return null;
    }

    const siteTextTranslationEntity =
      await this.siteTextTranslationRepo.getSiteTextTranslationById(
        highestVoted.id,
      );

    if (!siteTextTranslationEntity) {
      return null;
    }

    const translatedSiteText =
      (await this.graphFirstLayerService.getNodePropertyValue(
        siteTextTranslationEntity.word_ref,
        PropertyKeyConst.NAME,
      )) as string;
    const translatedDefinition =
      (await this.graphFirstLayerService.getNodePropertyValue(
        siteTextTranslationEntity.definition_ref,
        PropertyKeyConst.TEXT,
      )) as string;

    return {
      id: siteTextTranslationEntity.id,
      siteTextId,
      languageId: langId,
      translatedSiteText,
      translatedDefinition,
    };
  }

  private async getSiteTextByIdAndLanguageId(
    id: Nanoid,
    targetLanguageId: Nanoid,
  ): Promise<SiteTextDto | null> {
    const siteText = await this.siteTextRepo.getSiteTextById(id);

    if (!siteText) {
      return null;
    }

    const selectedSiteText = await this.getSelectedSiteTextTranslation(
      siteText.id,
      targetLanguageId,
    );

    const recommendedSiteText = await this.getRecommendedSiteTextTranslation(
      siteText.id,
      targetLanguageId,
    );

    const word = await this.graphFirstLayerService.getNodePropertyValue(
      siteText.word_ref,
      PropertyKeyConst.NAME,
    );
    const definition = await this.graphFirstLayerService.getNodePropertyValue(
      siteText.definition_ref,
      PropertyKeyConst.TEXT,
    );

    return {
      id: siteText.id,
      languageId: siteText.original_language_id,
      siteText: word as string,
      definition: definition as string,
      recommendedSiteText,
      selectedSiteText,
    };
  }

  async createOrFindSiteText(
    appId: Nanoid,
    languageId: Nanoid,
    siteText: string,
    definitionText: string,
  ): Promise<SiteText> {
    const { wordId, definitionId } = await this.createOrFindSiteTextOnGraph(
      languageId,
      siteText,
      definitionText,
    );

    const siteTextEntity = await this.siteTextRepo.createOrFindSiteText(
      appId,
      languageId,
      wordId,
      definitionId,
    );

    await this.votingService.createElection(
      ElectionTypeConst.SITE_TEXT_TRANSLATION,
      siteTextEntity.id,
      TableNameConst.SITE_TEXT,
      TableNameConst.SITE_TEXT_TRANSLATION,
    );

    return siteTextEntity;
  }

  async createOrFindSiteTextTranslationCandidate(
    siteTextId: Nanoid,
    languageId: Nanoid,
    translatedSiteText: string,
    translatedDescription: string,
  ): Promise<SiteTextTranslation> {
    const siteText = this.siteTextRepo.getSiteTextById(siteTextId);

    if (siteText === null) {
      throw new Error('A SiteText with the specified ID does not exist!');
    }

    const { wordId, definitionId } = await this.createOrFindSiteTextOnGraph(
      languageId,
      translatedSiteText,
      translatedDescription,
    );

    const translationSiteTextEntity =
      await this.siteTextTranslationRepo.createOrFindSiteTextTranslation(
        siteTextId,
        languageId,
        wordId,
        definitionId,
      );

    const election = await this.votingService.getElectionByRef(
      ElectionTypeConst.SITE_TEXT_TRANSLATION,
      siteTextId,
      TableNameConst.SITE_TEXT,
    );

    if (election === null) {
      throw new Error('An Election with the specified Ref does not exist!');
    }

    await this.votingService.addCandidate(
      election.id,
      translationSiteTextEntity.id,
    );

    return translationSiteTextEntity;
  }

  async getSiteTextListByAppId(
    appId: Nanoid,
    sourceLanguageId: Nanoid,
    targetLanguageId: Nanoid,
  ): Promise<SiteTextWithTranslationCntDto[]> {
    const siteTexts = await this.siteTextRepo.getSiteTextListByAppId(appId);

    const siteTextDtos: SiteTextWithTranslationCntDto[] = [];

    for (const siteText of siteTexts) {
      const translations =
        await this.siteTextTranslationRepo.getSiteTextTranslationList(
          siteText.id,
          targetLanguageId,
        );

      const siteTextDto = await this.getSiteTextByIdAndLanguageId(
        siteText.id,
        sourceLanguageId,
      );

      if (!siteTextDto) {
        continue;
      }

      siteTextDtos.push({
        ...siteTextDto,
        translationCnt: translations.length,
      });
    }

    return siteTextDtos;
  }

  async getSiteTextWithTranslationCandidates(
    siteTextId: Nanoid,
    sourceLanguageId: Nanoid,
    targetLanguageId: Nanoid,
  ): Promise<SiteTextWithTranslationVotablesDto> {
    const siteTextDto = await this.getSiteTextByIdAndLanguageId(
      siteTextId,
      sourceLanguageId,
    );

    if (!siteTextDto) {
      throw new Error('Not exists site text with given Id');
    }

    const translations =
      await this.siteTextTranslationRepo.getSiteTextTranslationList(
        siteTextDto.id,
        targetLanguageId,
      );

    const translationsDto: SiteTextTranslationVotable[] = [];

    const election = await this.votingService.getElectionByRef(
      ElectionTypeConst.SITE_TEXT_TRANSLATION,
      siteTextId,
      TableNameConst.SITE_TEXT,
    );

    if (!election) {
      throw new Error('Not exists election entity with given props');
    }

    for (const translation of translations) {
      const translationVotable = await this.getSiteTextTranslationVotableById(
        translation.id,
        election.id,
      );

      if (!translationVotable) {
        throw new Error('Not Exists Site Text Translation Votable');
      }

      translationsDto.push(translationVotable);
    }

    return {
      ...siteTextDto,
      translations: translationsDto,
      electionId: election.id,
    };
  }

  async getSiteTextTranslationVotableById(
    id: Nanoid,
    electionId?: Nanoid,
  ): Promise<SiteTextTranslationVotable | null> {
    const siteTextTranslationEntity =
      await this.siteTextTranslationRepo.getSiteTextTranslationById(id);

    if (!siteTextTranslationEntity) {
      return null;
    }

    const translatedSiteText =
      (await this.graphFirstLayerService.getNodePropertyValue(
        siteTextTranslationEntity.word_ref,
        PropertyKeyConst.NAME,
      )) as string;
    const translatedDefinition =
      (await this.graphFirstLayerService.getNodePropertyValue(
        siteTextTranslationEntity.definition_ref,
        PropertyKeyConst.TEXT,
      )) as string;

    let curElectionId = electionId;

    if (!curElectionId) {
      const election = await this.votingService.getElectionByRef(
        ElectionTypeConst.SITE_TEXT_TRANSLATION,
        siteTextTranslationEntity.site_text_id,
        TableNameConst.SITE_TEXT,
      );

      if (!election) {
        throw new Error('Not exists election entity with given props');
      }

      curElectionId = election.id;
    }

    const candidate = await this.votingService.getCandidateByRef(
      curElectionId,
      id,
    );

    if (!candidate) {
      throw new Error('Not exists candidate entity with given props');
    }

    const voteStatus = await this.votingService.getVotesStats(candidate.id);

    return {
      id,
      siteTextId: siteTextTranslationEntity.site_text_id,
      languageId: siteTextTranslationEntity.language_id,
      translatedSiteText,
      translatedDefinition,
      ...(voteStatus as Votable),
    };
  }

  async changeSiteTextDefinitionRef(
    siteTextId: Nanoid,
    langId: Nanoid,
    definitionRef: Nanoid,
  ): Promise<void> {
    const siteText = await this.siteTextRepo.getSiteTextById(siteTextId);

    if (siteText === null) {
      return;
    }

    if (siteText.original_language_id === langId) {
      await this.siteTextRepo.changeSiteTextDefinition(
        siteTextId,
        definitionRef,
      );
      return;
    }

    const selectedSiteTextTranslation =
      await this.siteTextTranslationRepo.getSelectedSiteTextTranslation(
        siteTextId,
        langId,
      );

    if (!selectedSiteTextTranslation) {
      return;
    }

    await this.siteTextTranslationRepo.changeSiteTextTranslationDefinition(
      selectedSiteTextTranslation.id,
      definitionRef,
    );
  }

  async selectSiteTextTranslationCandidate(
    siteTextTranslationId: Nanoid,
    siteTextId: Nanoid,
    langId: Nanoid,
  ): Promise<void> {
    return this.siteTextTranslationRepo.selectSiteTextTranslation(
      siteTextTranslationId,
      siteTextId,
      langId,
    );
  }

  async cancelSiteTextTranslationCandidate(
    siteTextId: Nanoid,
    langId: Nanoid,
  ): Promise<void> {
    return this.siteTextTranslationRepo.cancelSiteTextTranslation(
      siteTextId,
      langId,
    );
  }
}