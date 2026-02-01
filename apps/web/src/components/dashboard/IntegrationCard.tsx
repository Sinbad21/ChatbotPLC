'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Lock } from 'lucide-react';

type IntegrationPlan = 'starter' | 'professional' | 'enterprise';

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  requiredPlan: IntegrationPlan;
  userPlan: string;
  onSetup: () => void;
  configured: boolean;
}

const planHierarchy: Record<string, number> = {
  free: 0,
  starter: 0,
  professional: 1,
  enterprise: 2,
};

export function IntegrationCard({
  name,
  description,
  icon,
  requiredPlan,
  userPlan,
  onSetup,
  configured,
}: IntegrationCardProps) {
  const userPlanLevel = planHierarchy[userPlan.toLowerCase()] ?? 0;
  const requiredPlanLevel = planHierarchy[requiredPlan];
  const isLocked = userPlanLevel < requiredPlanLevel;

  const getPlanBadge = () => {
    if (requiredPlan === 'starter') {
      return <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/20">Tutti i piani</Badge>;
    }
    if (requiredPlan === 'professional') {
      return <Badge variant="outline" className="bg-pearl-100/70 text-silver-700 border-silver-200/70">Professional+</Badge>;
    }
    return <Badge variant="outline" className="bg-pearl-100/70 text-silver-700 border-silver-200/70">Enterprise</Badge>;
  };

  return (
    <Card className={`p-6 relative ${isLocked ? 'opacity-60' : ''}`}>
      {isLocked && (
        <div className="absolute top-4 right-4">
          <Lock className="w-5 h-5 text-muted-gray" />
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-charcoal">{name}</h3>
            {configured && (
              <Badge className="bg-emerald text-white">
                <Check className="w-3 h-3 mr-1" />
                Configurato
              </Badge>
            )}
          </div>
          {getPlanBadge()}
        </div>
      </div>

      <p className="text-sm text-muted-gray mb-6 leading-relaxed">
        {description}
      </p>

      {isLocked ? (
        <Button variant="outline" className="w-full" disabled>
          <Lock className="w-4 h-4 mr-2" />
          Richiede {requiredPlan === 'professional' ? 'Professional' : 'Enterprise'}
        </Button>
      ) : (
        <Button
          onClick={onSetup}
          className={configured ? 'w-full' : 'w-full bg-emerald hover:bg-emerald/90 text-white'}
          variant={configured ? 'outline' : 'default'}
        >
          {configured ? 'Modifica configurazione' : 'Configura integrazione'}
        </Button>
      )}
    </Card>
  );
}
