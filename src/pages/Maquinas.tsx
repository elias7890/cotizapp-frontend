import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { api, type Maquina, type MaquinaRequest, type Cliente, ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Wrench } from "lucide-react"
import MaquinaFormDialog from "@/components/maquinas/MaquinaFormDialog"
import ConfirmarDialog from "@/components/ConfirmarDialog"

export default function Maquinas() {
    const [maquinas, setMaquinas] = useState<Maquina[] | null>(null)
    const [clientes, setClientes] = useState<Cliente[]>([]) // NUEVO: para el filtro y el form
    const [total, setTotal] = useState(0)
    const [q, setQ] = useState("")
    const [busqueda, setBusqueda] = useState("")
    const [filtroCliente, setFiltroCliente] = useState(0) // NUEVO
    const [page, setPage] = useState(1)
    const limit = 20

    const [formAbierto, setFormAbierto] = useState(false)
    const [editando, setEditando] = useState<Maquina | null>(null)
    const [eliminando, setEliminando] = useState<Maquina | null>(null)

    // NUEVO: carga los clientes una vez, para el filtro y el selector del form
    useEffect(() => {
        api.clientes.listar("", 1, 100)
            .then((res) => setClientes(res.data))
            .catch(() => toast.error("No se pudieron cargar los clientes"))
    }, [])

    const cargar = useCallback(() => {
        api.maquinas.listar(busqueda, filtroCliente, page, limit)
            .then((res) => {
                setMaquinas(res.data)
                setTotal(res.total)
            })
            .catch(() => toast.error("No se pudieron cargar las máquinas"))
    }, [busqueda, filtroCliente, page])

    useEffect(() => { cargar() }, [cargar])

    useEffect(() => {
        const t = setTimeout(() => { setBusqueda(q); setPage(1) }, 300)
        return () => clearTimeout(t)
    }, [q])

    async function handleGuardar(data: MaquinaRequest) {
        try {
            if (editando) {
                await api.maquinas.actualizar(editando.id, data)
                toast.success("Máquina actualizada")
            } else {
                await api.maquinas.crear(data)
                toast.success("Máquina creada")
            }
            setFormAbierto(false)
            setEditando(null)
            cargar()
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Error al guardar")
        }
    }

    async function handleEliminar() {
        if (!eliminando) return
        try {
            await api.maquinas.eliminar(eliminando.id)
            toast.success("Máquina eliminada")
            setEliminando(null)
            cargar()
        } catch {
            toast.error("No se pudo eliminar")
        }
    }

    // NUEVO: mapa id->nombre para mostrar el cliente en la tabla
    const nombreCliente = (id: number) =>
        clientes.find((c) => c.id === id)?.razonSocial ?? "—"

    const totalPaginas = Math.ceil(total / limit)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Máquinas</h1>
                <Button onClick={() => { setEditando(null); setFormAbierto(true) }}>
                    <Plus className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Nueva máquina</span>
                </Button>
            </div>

            {/* Búsqueda + filtro por cliente */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por tipo, marca, modelo o serie..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {/* NUEVO: filtro por cliente */}
                <Select
                    value={String(filtroCliente)}
                    onValueChange={(v) => { setFiltroCliente(v ? Number(v) : 0); setPage(1) }}
                >
                    <SelectTrigger className="md:w-64">
                        <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">Todos los clientes</SelectItem>
                        {clientes.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.razonSocial}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="p-0">
                    {!maquinas ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : maquinas.length === 0 ? (
                        <div className="py-16 text-center space-y-2">
                            <Wrench className="h-10 w-10 mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                {busqueda || filtroCliente ? "Sin resultados" : "Aún no hay máquinas"}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Máquina</TableHead>
                                    <TableHead className="hidden md:table-cell">Cliente</TableHead>
                                    <TableHead className="hidden lg:table-cell">Serie</TableHead>
                                    <TableHead className="hidden lg:table-cell">Horómetro</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {maquinas.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>
                                            <p className="font-medium">{m.tipo} {m.marca} {m.modelo}</p>
                                            <p className="text-xs text-muted-foreground md:hidden">
                                                {nombreCliente(m.clienteId)}
                                            </p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{nombreCliente(m.clienteId)}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{m.serie}</TableCell>
                                        <TableCell className="hidden lg:table-cell tabular-nums">
                                            {m.horometro != null ? `${m.horometro} hrs` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setEditando(m); setFormAbierto(true) }}>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-500 focus:text-red-500"
                                                        onClick={() => setEliminando(m)}
                                                    >
                                                        Eliminar
                                                    </DropdownMenuItem>
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
                    <span>{total} máquinas</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1}
                                onClick={() => setPage(page - 1)}>Anterior</Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPaginas}
                                onClick={() => setPage(page + 1)}>Siguiente</Button>
                    </div>
                </div>
            )}

            <MaquinaFormDialog
                abierto={formAbierto}
                maquina={editando}
                clientes={clientes}
                onCerrar={() => { setFormAbierto(false); setEditando(null) }}
                onGuardar={handleGuardar}
            />
            <ConfirmarDialog
                abierto={!!eliminando}
                titulo="¿Eliminar máquina?"
                descripcion={`Se eliminará "${eliminando?.tipo} ${eliminando?.marca}". Sus cotizaciones históricas se conservan.`}
                onCancelar={() => setEliminando(null)}
                onConfirmar={handleEliminar}
            />
        </div>
    )
}