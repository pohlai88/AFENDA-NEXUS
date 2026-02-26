import type { GroupEntity } from '../entities/group-entity.js';

export interface CreateGroupEntityInput {
  readonly companyId: string;
  readonly name: string;
  readonly entityType: GroupEntity['entityType'];
  readonly parentEntityId: string | null;
  readonly baseCurrency: string;
  readonly countryCode: string;
}

export interface IGroupEntityRepo {
  findById(id: string): Promise<GroupEntity | null>;
  findByCompany(companyId: string): Promise<GroupEntity | null>;
  findByParent(parentEntityId: string): Promise<readonly GroupEntity[]>;
  findAll(): Promise<readonly GroupEntity[]>;
  create(tenantId: string, input: CreateGroupEntityInput): Promise<GroupEntity>;
  update(
    id: string,
    input: Partial<CreateGroupEntityInput & { isActive: boolean }>
  ): Promise<GroupEntity>;
}
