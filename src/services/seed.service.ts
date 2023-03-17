import { type NodePropertyKeyRepository } from '../repositories/node/node-property-key.repository';
import { type NodePropertyValueRepository } from '../repositories/node/node-property-value.repository';
import { type NodeTypeRepository } from '../repositories/node/node-type.repository';
import { type NodeRepository } from '../repositories/node/node.repository';
import { type RelationshipPropertyKeyRepository } from '../repositories/relationship/relationship-property-key.repository';
import { type RelationshipPropertyValueRepository } from '../repositories/relationship/relationship-property-value.repository';
import { type RelationshipTypeRepository } from '../repositories/relationship/relationship-type.repository';
import { type RelationshipRepository } from '../repositories/relationship/relationship.repository';

export class SeedService {
  constructor(
    private readonly nodeRepository: NodeRepository,
    private readonly nodeTypeRepository: NodeTypeRepository,
    private readonly nodePropertyKeyRepository: NodePropertyKeyRepository,
    private readonly nodePropertyValueRepository: NodePropertyValueRepository,
    private readonly relationshipRepository: RelationshipRepository,
    private readonly relationshipTypeRepository: RelationshipTypeRepository,
    private readonly relationshipPropertyKeyRepository: RelationshipPropertyKeyRepository,
    private readonly relationshipPropertyValueRepository: RelationshipPropertyValueRepository,
  ) {}

  async createNodesAndRelationship() {
    // random string of length 10
    const nodeType1 = await this.nodeTypeRepository.createNodeType(
      Math.random().toString(36).substring(2, 10),
    );
    const nodeType2 = await this.nodeTypeRepository.createNodeType(
      Math.random().toString(36).substring(2, 10),
    );
    const node1 = await this.nodeRepository.createNode(nodeType1);
    const node2 = await this.nodeRepository.createNode(nodeType2);

    const relationshipType =
      await this.relationshipTypeRepository.createRelationshipType(
        Math.random().toString(36).substring(2, 10),
      );

    const relationship = await this.relationshipRepository.createRelationship(
      node1.id,
      node2.id,
      relationshipType,
    );

    const nodePropKey =
      await this.nodePropertyKeyRepository.createNodePropertyKey(
        node1.id,
        Math.random().toString(36).substring(2, 10),
      );

    await this.nodePropertyValueRepository.createNodePropertyValue(
      nodePropKey!,
      Math.random().toString(36).substring(2, 10),
    );

    const relationshipPropKey =
      await this.relationshipPropertyKeyRepository.createRelationshipPropertyKey(
        relationship!.id,
        Math.random().toString(36).substring(2, 10),
      );

    await this.relationshipPropertyValueRepository.createRelationshipPropertyValue(
      relationshipPropKey!,
      Math.random().toString(36).substring(2, 10),
    );
  }
}