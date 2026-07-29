import { NavLink, Outlet } from "react-router-dom"
import { LayoutDashboard, Users, Wrench, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { to: "/", label: "Inicio", icon: LayoutDashboard },
    { to: "/clientes", label: "Clientes", icon: Users },
    { to: "/maquinas", label: "Máquinas", icon: Wrench },
    { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
]

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* ===== Sidebar: solo visible en md (768px) hacia arriba ===== */}
            <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 border-r bg-card">
                <div className="p-6 text-xl font-bold">
                    Cotiz<span className="text-blue-500">App</span>
                </div>
                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-500/10 text-blue-500"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* ===== Contenido ===== */}
            <main className="md:pl-60 pb-20 md:pb-0">
                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>

            {/* ===== Barra inferior: solo visible en móvil ===== */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-card/95 backdrop-blur">
                <div className="grid grid-cols-4">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                                    isActive ? "text-blue-500" : "text-muted-foreground"
                                )
                            }
                        >
                            <Icon className="h-5 w-5" />
                            {label}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    )
}