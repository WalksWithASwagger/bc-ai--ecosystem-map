import Navigation from '../../components/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <Navigation />
      <main className="pl-64">
        {children}
      </main>
    </div>
  )
}