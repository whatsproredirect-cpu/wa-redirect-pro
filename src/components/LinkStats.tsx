import { TrendingUp, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LinkStatsProps {
  totalClicks: number;
  totalLeads: number;
  lastLeadAt?: string | null;
}

const LinkStats = ({ totalClicks, totalLeads, lastLeadAt }: LinkStatsProps) => {
  const conversionRate =
    totalClicks > 0 ? ((totalLeads / totalClicks) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-3 gap-3 pt-3 border-t">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Taxa Conv.</span>
        </div>
        <p className="text-sm font-semibold">{conversionRate}%</p>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Leads</span>
        </div>
        <p className="text-sm font-semibold">{totalLeads}</p>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Último</span>
        </div>
        <p className="text-xs font-medium truncate">
          {lastLeadAt
            ? formatDistanceToNow(new Date(lastLeadAt), {
                addSuffix: true,
                locale: ptBR,
              })
            : "Nenhum"}
        </p>
      </div>
    </div>
  );
};

export default LinkStats;
