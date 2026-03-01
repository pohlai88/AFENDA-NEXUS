'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Building2, Globe, Users } from 'lucide-react';
import type { GroupEntityView as GroupEntity } from '../queries/consolidation.queries';
import {
  entityTypeLabels,
  entityStatusConfig,
  consolidationMethodLabels,
} from '../types';
import type { EntityStatus, EntityType, ConsolidationMethod } from '../types';

function EntityNode({ entity, level = 0 }: { entity: GroupEntity; level?: number }) {
  const config = entityStatusConfig[entity.status as EntityStatus];
  return (
    <div style={{ marginLeft: level * 24 }}>
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent cursor-pointer">
        <div className="bg-primary/10 rounded p-2">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{entity.entityCode}</span>
            <span className="font-medium">{entity.name}</span>
            {entity.entityType !== 'parent' && (
              <Badge variant="secondary">{entityTypeLabels[entity.entityType as EntityType]}</Badge>
            )}
            <Badge className={config.color}>{config.label}</Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {entity.country}
            </span>
            <span>{entity.currency}</span>
            {entity.ownershipPercent < 100 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {entity.ownershipPercent}% owned
              </span>
            )}
            <span>{consolidationMethodLabels[entity.consolidationMethod as ConsolidationMethod]}</span>
          </div>
        </div>
      </div>
      {entity.children?.map((child) => (
        <EntityNode key={child.id} entity={child} level={level + 1} />
      ))}
    </div>
  );
}

interface GroupStructureTreeProps {
  entities: GroupEntity[];
}

export function GroupStructureTree({ entities }: GroupStructureTreeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Group Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {entities.map((entity) => (
          <EntityNode key={entity.id} entity={entity} />
        ))}
      </CardContent>
    </Card>
  );
}
