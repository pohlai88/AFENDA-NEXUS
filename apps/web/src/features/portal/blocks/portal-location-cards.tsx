'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Building2 } from 'lucide-react';
import type { PortalLocation } from '../queries/portal.queries';

interface PortalLocationCardsProps {
  locations: PortalLocation[];
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  HQ: 'Headquarters',
  WAREHOUSE: 'Warehouse',
  BILLING: 'Billing Address',
  SHIPPING: 'Shipping Address',
  BRANCH: 'Branch Office',
};

export function PortalLocationCards({ locations }: PortalLocationCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {locations.map((location) => (
        <Card key={location.id} className="flex flex-col">
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">{location.name}</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {LOCATION_TYPE_LABELS[location.locationType] || location.locationType}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 text-sm">
            <div className="flex gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p>{location.addressLine1}</p>
                {location.addressLine2 && <p>{location.addressLine2}</p>}
                <p>
                  {location.city}
                  {location.stateProvince && `, ${location.stateProvince}`}
                  {location.postalCode && ` ${location.postalCode}`}
                </p>
                <p>{location.country}</p>
              </div>
            </div>

            {location.primaryContactName && (
              <div className="flex gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{location.primaryContactName}</p>
                  {location.primaryContactEmail && <p>{location.primaryContactEmail}</p>}
                  {location.primaryContactPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span>{location.primaryContactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {location.businessHoursStart && location.businessHoursEnd && (
              <div className="flex gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  {location.businessHoursStart} - {location.businessHoursEnd}
                  {location.timezone && ` (${location.timezone})`}
                </p>
              </div>
            )}

            {location.notes && (
              <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                {location.notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
