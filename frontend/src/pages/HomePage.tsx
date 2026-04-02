import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { 
  Megaphone, 
  Users, 
  Calendar, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
    staleTime: 0,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const activeCampaigns = data?.activeCampaigns || [];
  const expiringPartners = data?.expiringPartners || [];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Visão geral das ações comerciais e contratos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            Sessão Ativa
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Column 1: Active Campaigns */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Campanhas Ativas Hoje
              </h2>
            </div>
            <Link 
              to="/campanhas" 
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Ver todas
            </Link>
          </div>

          <div className="space-y-4">
            {activeCampaigns.length > 0 ? (
              activeCampaigns.map((campanha) => (
                <div key={campanha.id} className="card group relative overflow-hidden flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                        {campanha.nome}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {campanha.parceiro?.nomeFantasia || campanha.parceiro?.nomeAjustado || 'Sem parceiro'}
                      </p>
                    </div>
                    <div className="rounded-full bg-primary-100 px-3 py-1 text-[10px] font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-400">
                      ATIVO
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(campanha.dataInicio).toLocaleDateString()} - {new Date(campanha.dataFim).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {campanha._count.produtos} produtos
                    </div>
                  </div>
                  
                  <Link
                    to={`/campanhas/${campanha.id}/produtos`}
                    className="absolute inset-0 z-10 opacity-0"
                    aria-label="Ver produtos"
                  />
                </div>
              ))
            ) : (
              <div className="card border-dashed flex flex-col items-center justify-center py-10 text-center opacity-60">
                <Megaphone className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">Nenhuma campanha ativa no momento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Expiring Contracts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Contratos a Vencer
              </h2>
            </div>
            <Link 
              to="/parceiros" 
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Gerir todos
            </Link>
          </div>

          <div className="space-y-4">
            {expiringPartners.length > 0 ? (
              expiringPartners.map((parceiro) => {
                const days = Math.ceil((new Date(parceiro.dataSaida).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isCritical = days < 15;

                return (
                  <div key={parceiro.id} className="card group flex items-center gap-4">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isCritical ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    )}>
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">
                        {parceiro.nomeFantasia || parceiro.nomeAjustado}
                      </h3>
                      <p className={cn(
                        "text-xs font-medium mt-0.5",
                        isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                      )}>
                        Vence em {days} dias ({new Date(parceiro.dataSaida).toLocaleDateString()})
                      </p>
                    </div>
                    <Link 
                      to={`/parceiros/${parceiro.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="card border-dashed flex flex-col items-center justify-center py-10 text-center opacity-60">
                <Users className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">Nenhum contrato vencendo nos próximos 30 dias.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
