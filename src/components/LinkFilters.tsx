import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface LinkFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterMode: string;
  onFilterModeChange: (value: string) => void;
  filterCampaign: string;
  onFilterCampaignChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  campaigns: string[];
}

const LinkFilters = ({
  searchTerm,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  filterCampaign,
  onFilterCampaignChange,
  sortBy,
  onSortByChange,
  campaigns,
}: LinkFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou slug..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={filterMode} onValueChange={onFilterModeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Tipo de link" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="form">Formulário</SelectItem>
          <SelectItem value="direct">Direto</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterCampaign} onValueChange={onFilterCampaignChange}>
        <SelectTrigger>
          <SelectValue placeholder="Campanha" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as campanhas</SelectItem>
          {campaigns.map((campaign) => (
            <SelectItem key={campaign} value={campaign}>
              {campaign}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger>
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Mais recentes</SelectItem>
          <SelectItem value="oldest">Mais antigos</SelectItem>
          <SelectItem value="name">Nome (A-Z)</SelectItem>
          <SelectItem value="leads">Mais leads</SelectItem>
          <SelectItem value="conversion">Maior conversão</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LinkFilters;
