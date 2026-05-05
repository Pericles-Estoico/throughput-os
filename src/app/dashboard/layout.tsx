import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Execução', icon: '⚡' },
  { href: '/dashboard/sales', label: 'Vendas', icon: '📈' },
  { href: '/dashboard/inventory', label: 'Estoque', icon: '📦' },
  { href: '/dashboard/production', label: 'Produção', icon: '⚙️' },
  { href: '/dashboard/decisions', label: 'Decisões', icon: '🎯' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex h-14 items-center gap-6 px-4">
          <span className="font-semibold tracking-tight">THROUGHPUT OS</span>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
