import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { api, descargarPDF, type Cotizacion, ApiError } from "@/lib/api"
import { formatoCLP, formatoFecha } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, FileText, Download } from "lucide-react"
import ConfirmarDialog from "@/components/ConfirmarDialog"

export default function Cotizaciones() {
    const navigate = useNavigate()
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[] | null>(null)
    const [total, setTotal] = useState(0)
    const [q, setQ] = useState("")
    const [busqueda, setBusqueda] = useState("")
    const [estado, setEstado] = useState("")
    const [page, setPage] = useState(1)
    const [anulando, setAnulando] = useState<Cotizacion | null>(null)
    const limit = 20

    const cargar = useCallback(() => {
        api.cotizaciones.listar(busqueda, estado, page, limit)
            .then((res) => {
                setCotizaciones(res.data)
                setTotal(res.total)
            })
            .catch(() => toast.error("No se pudieron cargar las cotizaciones"))
    }, [busqueda, estado, page])

    useEffect(() => { cargar() }, [cargar])

    useEffect(() => {
        const t = setTimeout(() => { setBusqueda(q); setPage(1) }, 300)
        return () => clearTimeout(t)
    }, [q])

    async function handleEmitir(c: Cotizacion) {
        try {
            const emitida = await api.cotizaciones.emitir(c.id)
            toast.success(`Cotización emitida con el N° ${emitida.numero}`)
            cargar()
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "No se pudo emitir")
        }
    }

    async function handleDuplicar(c: Cotizacion) {
        try {
            const copia = await api.cotizaciones.duplicar(c.id)
            toast.success("Borrador duplicado")
            navigate(`/cotizaciones/${copia.id}`)
        } catch {
            toast.error("No se pudo duplicar")
        }
    }

    async function handleAnular() {
        if (!anulando) return
        try {
            await api.cotizaciones.anular(anulando.id)
            toast.success("Cotización anulada")
            setAnulando(null)
            cargar()
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "No se pudo anular")
        }
    }

    async function handlePDF(c: Cotizacion) {
        try {
            await descargarPDF(c.id, c.numero)
        } catch {
            toast.error("No se pudo descargar el PDF")
        }
    }

    const totalPaginas = Math.ceil(total / limit)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Cotizaciones</h1>
                <Button onClick={() => navigate("/cotizaciones/nueva")}>
                    <Plus className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Nueva cotización</span>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por número, cliente o máquina..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={estado || "todas"} onValueChange={(v) => { setEstado(!v || v === "todas" ? "" : v); setPage(1) }}>
                    <SelectTrigger className="md:w-48">
                        <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Todos los estados</SelectItem>
                        <SelectItem value="borrador">Borradores</SelectItem>
                        <SelectItem value="emitida">Emitidas</SelectItem>
                        <SelectItem value="anulada">Anuladas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="p-0">
                    {!cotizaciones ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : cotizaciones.length === 0 ? (
                        <div className="py-16 text-center space-y-2">
                            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                {busqueda || estado ? "Sin resultados" : "Aún no hay cotizaciones"}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N°</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead className="hidden md:table-cell">Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cotizaciones.map((c) => (
                                    <TableRow
                                        key={c.id}
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/cotizaciones/${c.id}`)}
                                    >
                                        <TableCell className="font-medium tabular-nums">
                                            {c.numero ? `N° ${c.numero}` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium truncate max-w-40 md:max-w-none">
                                                {c.cliente.razonSocial}
                                            </p>
                                            <p className="text-xs text-muted-foreground md:hidden">
                                                {c.fechaEmision ? formatoFecha(c.fechaEmision) : formatoFecha(c.createdAt)}
                                            </p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {c.fechaEmision ? formatoFecha(c.fechaEmision) : formatoFecha(c.createdAt)}
                                        </TableCell>
                                        <TableCell><BadgeEstado estado={c.estado} /></TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {formatoCLP(c.total)}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handlePDF(c)}>
                                                        <Download className="h-4 w-4 mr-2" /> Descargar PDF
                                                    </DropdownMenuItem>
                                                    {c.estado === "borrador" && (
                                                        <DropdownMenuItem onClick={() => handleEmitir(c)}>
                                                            Emitir
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleDuplicar(c)}>
                                                        Duplicar
                                                    </DropdownMenuItem>
                                                    {c.estado === "emitida" && (
                                                        <DropdownMenuItem
                                                            className="text-red-500 focus:text-red-500"
                                                            onClick={() => setAnulando(c)}
                                                        >
                                                            Anular
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {totalPaginas > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{total} cotizaciones</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1}
                                onClick={() => setPage(page - 1)}>Anterior</Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPaginas}
                                onClick={() => setPage(page + 1)}>Siguiente</Button>
                    </div>
                </div>
            )}

            <ConfirmarDialog
                abierto={!!anulando}
                titulo="¿Anular cotización?"
                descripcion={`Se anulará la cotización N° ${anulando?.numero}. Conservará su número y no podrá editarse.`}
                onCancelar={() => setAnulando(null)}
                onConfirmar={handleAnular}
            />
        </div>
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