export default function ExecutionDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Execução</h1>
        <p className="text-sm text-muted-foreground">O que você deve fazer hoje</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Ganho do dia</p>
          <p className="mt-1 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">SKUs A vendidos</p>
          <p className="mt-1 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">SKUs em ruptura</p>
          <p className="mt-1 text-2xl font-semibold text-destructive">—</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Gargalo atual</p>
          <p className="mt-1 text-2xl font-semibold">—</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">AÇÃO CRÍTICA DO DIA</p>
        <p className="mt-2 text-lg font-medium">
          Importe seus dados de vendas, custos e estoque para ver as decisões do dia.
        </p>
      </div>
    </div>
  )
}
