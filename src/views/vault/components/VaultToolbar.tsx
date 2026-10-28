import { ChevronDown, Search } from "lucide-react";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedEnv: string;
  onEnvChange: (value: string) => void;
  total: number;
}

export function VaultToolbar({
  searchTerm,
  onSearchChange,
  selectedEnv,
  onEnvChange,
  total,
}: Props) {
  return (
    <div className="p-4 border-b border-dark-border flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar sistemas, servicios, usuarios..."
            className="w-full bg-dark-bg border border-dark-border text-xs text-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-brand-teal placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <select
          value={selectedEnv}
          onChange={(e) => onEnvChange(e.target.value)}
          className="bg-dark-bg border border-dark-border text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-teal"
        >
          <option value="ALL">Todos los entornos</option>
          <option value="PRD">PRD</option>
          <option value="QAS">QAS</option>
          <option value="DEV">DEV</option>
        </select>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-xs text-slate-300 hover:border-slate-600 transition-colors">
          Todos los tipos
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <span className="text-[11px] text-slate-400 ml-2 hidden lg:inline">
          {total} credenciales · Cifrado AES-256
        </span>
      </div>
    </div>
  );
}
