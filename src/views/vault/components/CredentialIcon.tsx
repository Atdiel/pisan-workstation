import { Cloud, Database, Globe, Server, ShieldCheck } from "lucide-react";
import { Credential } from "../../../types/vault";

export function CredentialIcon({ type }: { type: Credential["iconType"] }) {
  switch (type) {
    case "sap":
      return <Server className="w-4 h-4 text-brand-teal" />;
    case "vpn":
      return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    case "cloud":
      return <Cloud className="w-4 h-4 text-sky-400" />;
    case "db":
      return <Database className="w-4 h-4 text-amber-400" />;
    default:
      return <Globe className="w-4 h-4 text-indigo-400" />;
  }
}
