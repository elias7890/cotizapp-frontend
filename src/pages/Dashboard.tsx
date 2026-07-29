import { useEffect, useState } from "react"
import { api, type DashboardData } from "@/lib/api"
import { formatoCLP } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, Wrench, FileText, TrendingUp } from "lucide-react"

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        api.dashboard()
            .then(setData)
            .catch(() => setError("No se pudo cargar el dashboard"))
    }, [])

    if (error) return <p className="text-red-500">{error}</p>

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            {/* ===== Tarjetas de indicadores ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <TarjetaStat
                    titulo="Clientes"
                    valor={data?.totalClientes}
                    icono={<Users className="h-4 w-4 text-blue-500" />}
                />
                <TarjetaStat
                    titulo="Máquinas"
                    valor={data?.totalMaquinas}
                    icono={<Wrench className="h-4 w-4 text-emerald-500" />}
                />
                <TarjetaStat
                    titulo="Cotizaciones del mes"
                    valor={data?.cotizacionesMes}
                    icono={<FileText className="h-4 w-4 text-violet-500" />}
                />
                <TarjetaStat
                    titulo="Monto del mes"
                    valor={data ? formatoCLP(data.montoMes) : undefined}
                    icono={<TrendingUp className="h-4 w-4 text-amber-500" />}
                />
            </div>

            {/* ===== Últimas cotizaciones ===== */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Últimas cotizaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    {!data ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : data.ultimas.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                            Aún no hay cotizaciones
                        </p>
                    ) : (
                        <div className="divide-y">
                            {data.ultimas.map((c) => (
                                <div key={c.id} className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {c.numero ? `N° ${c.numero}` : "Borrador"}
                                            <span className="text-muted-foreground font-normal">
                        {" · "}{c.cliente.razonSocial}
                      </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <BadgeEstado estado={c.estado} />
                                        <span className="text-sm font-semibold tabular-nums">
                      {formatoCLP(c.total)}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function TarjetaStat({ titulo, valor, icono }: {
    titulo: string
    valor: number | string | undefined
    icono: React.ReactNode
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
                {icono}
            </CardHeader>
            <CardContent>
                {valor === undefined
                    ? <Skeleton className="h-7 w-16" />
                    : <p className="text-2xl font-bold tabular-nums">{valor}</p>}
            </CardContent>
        </Card>
    )
}

function BadgeEstado({ estado }: { estado: string }) {
    const estilos: Record<string, string> = {
        emitida: "bg-emerald-500/10 text-emerald-500",
        borrador: "bg-amber-500/10 text-amber-500",
        anulada: "bg-red-500/10 text-red-500",
    }
    return (
        <Badge variant="outline" className={estilos[estado] ?? ""}>
            {estado}
        </Badge>
    )
}