import {
  ElectionTypesConst,
  NodeTypeConst,
  PropertyKeyConst,
  RelationshipTypeConst,
  TablesNameConst,
} from '../constants/graph.constant';
import { LanguageDto, LanguageWithElecitonsDto } from '@/dtos/language.dto';
import { GraphFirstLayerService } from './graph-first-layer.service';
import { GraphSecondLayerService } from './graph-second-layer.service';
import { GraphThirdLayerService } from './graph-third-layer.service';
import { VotingService } from './voting.service';
import { VotableContent, VotableItem } from '../dtos/votable-item.dto';

export class DefinitionService {
  constructor(
    private readonly graphFirstLayerService: GraphFirstLayerService,
    private readonly graphSecondLayerService: GraphSecondLayerService,
    private readonly graphThirdLayerService: GraphThirdLayerService,
    private readonly votingService: VotingService,
  ) {}

  /**
   * Finds ballot entry for a given definitionId or creates new ballot entry if not found.
   *
   * @param definitionId
   * @param electionId - in case if no existing ballotEntry found, new one will be created using this electionId
   * @param forNodeId - nodeId (with type word or phrase) for which definition will be found or created
   * @returns - id of the created ballot entry
   */
  async findBallotEntryIdForDefinition(
    definitionId: Nanoid,
    electionId: Nanoid,
    forNodeId: Nanoid,
  ): Promise<Nanoid> {
    const node = await this.graphFirstLayerService.readNode(forNodeId, [
      'nodeType',
    ]);
    let relationshipType = RelationshipTypeConst.WORD_TO_DEFINITION;
    if (node?.nodeType.type_name === NodeTypeConst.PHRASE) {
      relationshipType = RelationshipTypeConst.PHRASE_TO_DEFINITION;
    }

    let relationship = await this.graphFirstLayerService.findRelationship(
      forNodeId,
      definitionId,
      relationshipType,
    );

    if (!relationship) {
      relationship = await this.graphFirstLayerService.createRelationship(
        forNodeId,
        definitionId,
        relationshipType,
      );
    }

    // if ballot entry exists, it won't be created, Just found and returned.
    const ballotEntryId = await this.votingService.addBallotEntry(electionId, {
      tableName: TablesNameConst.RELATIONSHIPS,
      rowId: relationship.id,
    });

    return ballotEntryId;
  }

  /**
   * Creates defintion for given nodeId and ballot entry for this definition.
   *
   * @param definitionText - definition text
   * @param forNodeId - node Id (word or phrase) for which definition is created
   * @param electionId - election for node Id (word or phrase). Ballot entry will be connected to this election.
   * @returns - created definition Id and ballot Id
   */

  async createDefinition(
    definitionText: string,
    forNodeId: Nanoid,
    electionId: Nanoid,
  ): Promise<{
    definitionId: Nanoid;
    ballotEntryId: Nanoid;
  }> {
    const existingDefinitionNode =
      await this.graphFirstLayerService.getNodeByProp(
        NodeTypeConst.DEFINITION,
        {
          key: PropertyKeyConst.TEXT,
          value: definitionText,
        },
        { from_node_id: forNodeId },
      );

    const definitionNode = existingDefinitionNode
      ? existingDefinitionNode
      : (
          await this.graphSecondLayerService.createRelatedToNodeFromObject(
            RelationshipTypeConst.WORD_TO_DEFINITION,
            {},
            forNodeId,
            NodeTypeConst.DEFINITION,
            { [PropertyKeyConst.TEXT]: definitionText },
          )
        ).node;

    const ballotEntryId = await this.findBallotEntryIdForDefinition(
      definitionNode.id,
      electionId,
      forNodeId,
    );

    return {
      definitionId: definitionNode.id,
      ballotEntryId,
    };
  }

  /**
   * Creates word and election of type 'definition' for this word
   *
   * @param word - word text
   * @param langId - language of this word
   * @returns - created word Id and election Id (to add definition ballots to it)
   */
  async createWordAndDefinitionsElection(
    word: string,
    langId: Nanoid,
  ): Promise<{ wordId: Nanoid; electionId: Nanoid }> {
    const wordId = await this.graphThirdLayerService.createWord(word, langId);
    const electionId = await this.votingService.createElection(
      TablesNameConst.NODES,
      wordId,
      ElectionTypesConst.DEFINITION,
    );
    return { wordId, electionId };
  }

  /**
   * Creates phrase and election of type 'definition' for this phrase
   *
   * @param word - phrase text
   * @param langId - language of this phrase
   * @returns - created phrase Id and election Id (to add definition ballots to it)
   */
  async createPhraseAndDefinitionsElection(
    phrase: string,
    langId: Nanoid,
  ): Promise<{ phraseId: Nanoid; electionId: Nanoid }> {
    const existingPhraseNode = await this.graphFirstLayerService.getNodeByProp(
      NodeTypeConst.PHRASE,
      {
        key: PropertyKeyConst.TEXT,
        value: phrase,
      },
    );
    const node = existingPhraseNode
      ? existingPhraseNode
      : (
          await this.graphSecondLayerService.createRelatedFromNodeFromObject(
            RelationshipTypeConst.PHRASE_TO_LANG,
            {},
            NodeTypeConst.PHRASE,
            { name: phrase },
            langId,
          )
        ).node;

    const electionId = await this.votingService.createElection(
      TablesNameConst.NODES,
      node.id,
      ElectionTypesConst.DEFINITION,
    );
    return { phraseId: node.id, electionId };
  }

  /**
   * Finds definitions for given node Id and election Id and returns as VotableContent
   *
   * @param forNodeId
   * @param electionId
   * @returns
   */
  async getDefinitionsAsVotableContent(
    forNodeId: Nanoid,
    electionId: Nanoid,
  ): Promise<Array<VotableContent>> {
    const definitionNodes =
      await this.graphFirstLayerService.getNodesByTypeAndRelatedNodes({
        type: NodeTypeConst.DEFINITION,
        from_node_id: forNodeId,
      });
    const vcPromises: Promise<VotableContent>[] = definitionNodes.map(
      async (definitionNode) => {
        const ballotId = await this.findBallotEntryIdForDefinition(
          definitionNode.id,
          electionId,
          forNodeId,
        );

        const { up: upVotes, down: downVotes } =
          await this.votingService.getVotesStats(ballotId);
        return {
          content: this.graphSecondLayerService.getNodePropertyValue(
            definitionNode,
            PropertyKeyConst.TEXT,
          ),
          upVotes,
          downVotes,
          id: definitionNode.id,
          ballotId,
        };
      },
    );
    return Promise.all(vcPromises);
  }

  /**
   * Finds Phrases for given language Id as VotableItems
   * For now, not quite sure how vote on phrases (not phrase definitions, but phrase itself, so it is still TODO)
   *
   * @param langNodeId
   * @returns
   */
  async getPhrasesAsVotableItems(
    langNodeId: string,
  ): Promise<Array<VotableItem>> {
    const phraseNodes =
      await this.graphFirstLayerService.getNodesByTypeAndRelatedNodes({
        type: NodeTypeConst.PHRASE,
        to_node_id: langNodeId,
      });

    const viPromises = phraseNodes.map(async (pn) => {
      // if electionId exists, it won't be created, Just found and returned.
      const electionId = await this.votingService.createElection(
        TablesNameConst.NODES,
        pn.id,
        ElectionTypesConst.DEFINITION,
      );
      return {
        title: {
          content: this.graphSecondLayerService.getNodePropertyValue(
            pn,
            'name',
          ),
          upVotes: 0, //TODO: 0 is a mocked value, replace it when voting is ready
          downVotes: 0, //TODO: 0 is a mocked value, replace it when voting is ready
          id: pn.id,
        } as VotableContent,
        contents: await this.getDefinitionsAsVotableContent(pn.id, electionId),
        contentElectionId: electionId,
      } as VotableItem;
    });
    const vi = await Promise.all(viPromises);
    return vi;
  }

  /**
   * Finds Words for given language Id as VotableContent
   * For now, not quite sure how vote on phrases (not phrase definitions, but phrase itself, so it is still TODO)
   * @param langNodeId
   * @returns
   */
  async getWordsAsVotableItems(
    langNodeId: string,
  ): Promise<Array<VotableItem>> {
    const wordNodes = await this.graphThirdLayerService.getWords({
      to_node_id: langNodeId,
      relationship_type: RelationshipTypeConst.WORD_TO_LANG,
    });
    const viPromises = wordNodes.map(async (wn) => {
      // if electionId exists, it won't be created, Just found and returned.
      const electionId = await this.votingService.createElection(
        TablesNameConst.NODES,
        wn.id,
        ElectionTypesConst.DEFINITION,
      );
      return {
        title: {
          content: this.graphSecondLayerService.getNodePropertyValue(
            wn,
            'name',
          ),
          upVotes: 0, //TODO: 0 is a mocked value, replace it when voting is ready
          downVotes: 0, //TODO: 0 is a mocked value, replace it when voting is ready
          id: wn.id,
        } as VotableContent,
        contents: await this.getDefinitionsAsVotableContent(wn.id, electionId),
        contentElectionId: electionId,
      } as VotableItem;
    });
    const vi = await Promise.all(viPromises);
    return vi;
  }

  /**
   * Gets all languges. Finds or creates for each language elecions of words and phrases
   *
   * @returns
   */
  async getLanguages(): Promise<LanguageWithElecitonsDto[]> {
    const languages = await this.graphThirdLayerService.getLanguages();
    const langPromises: Promise<LanguageWithElecitonsDto>[] = languages.map(
      async (l) => {
        const electionWordsId = await this.votingService.createElection(
          TablesNameConst.NODES,
          l.id,
          ElectionTypesConst.WORD_LANGUAGE,
        );
        const electionPhrasesId = await this.votingService.createElection(
          TablesNameConst.NODES,
          l.id,
          ElectionTypesConst.PHRASE_LANGUAGE,
        );
        return {
          ...l,
          electionWordsId,
          electionPhrasesId,
        };
      },
    );
    return Promise.all(langPromises);
  }

  /**
   * Updates definition (as text property of given node Id).
   *
   * @param definitionNodeId - node Id to be updated
   * @param newDefinitionValue - new defintion value
   */

  async updateDefinitionValue(
    definitionNodeId: Nanoid,
    newDefinitionValue: string,
  ): Promise<void> {
    this.graphSecondLayerService.updateNodeObject(definitionNodeId, {
      [PropertyKeyConst.TEXT]: newDefinitionValue,
    });
  }
}
