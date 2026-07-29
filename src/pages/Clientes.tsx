import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { api, type Cliente, type ClienteRequest, ApiError } from "@/lib/api"
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
import { Plus, Search, MoreHorizontal, Users } from "lucide-react"
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog"
import ConfirmarDialog from "@/components/ConfirmarDialog"

export default function Clientes() {
    const [clientes, setClientes] = useState<Cliente[] | null>(null)
    const [total, setTotal] = useState(0)
    const [q, setQ] = useState("")
    const [busqueda, setBusqueda] = useState("") // valor con debounce aplicado
    const [page, setPage] = useState(1)
    const limit = 20

    // Modales
    const [formAbierto, setFormAbierto] = useState(false)
    const [editando, setEditando] = useState<Cliente | null>(null)
    const [eliminando, setEliminando] = useState<Cliente | null>(null)

    const cargar = useCallback(() => {
        api.clientes.listar(busqueda, page, limit)
            .then((res) => {
                setClientes(res.data)
                setTotal(res.total)
            })
            .catch(() => toast.error("No se pudieron cargar los clientes"))
    }, [busqueda, page])

    useEffect(() => {
        cargar()
    }, [cargar])

    // Debounce: espera 300ms tras dejar de escribir antes de buscar
    useEffect(() => {
        const t = setTimeout(() => {
            setBusqueda(q)
            setPage(1)
        }, 300)
        return () => clearTimeout(t)
    }, [q])

    async function handleGuardar(data: ClienteRequest) {
        try {
            if (editando) {
                await api.clientes.actualizar(editando.id, data)
                toast.success("Cliente actualizado")
            } else {
                await api.clientes.crear(data)
                toast.success("Cliente creado")
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
            await api.clientes.eliminar(eliminando.id)
            toast.success("Cliente eliminado")
            setEliminando(null)
            cargar()
        } catch {
            toast.error("No se pudo eliminar")
        }
    }

    const totalPaginas = Math.ceil(total / limit)

    return (
        <div className="space-y-4">
            {/* ===== Encabezado ===== */}
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Clientes</h1>
                <Button onClick={() => { setEditando(null); setFormAbierto(true) }}>
                    <Plus className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Nuevo cliente</span>
                </Button>
            </div>

            {/* ===== Búsqueda ===== */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por razón social, fantasía o RUT..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* ===== Tabla / estados ===== */}
            <Card>
                <CardContent className="p-0">
                    {!clientes ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : clientes.length === 0 ? (
                        <div className="py-16 text-center space-y-2">
                            <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                {busqueda ? "Sin resultados para la búsqueda" : "Aún no hay clientes"}
                            </p>
                            {!busqueda && (
                                <Button variant="outline" size="sm" onClick={() => setFormAbierto(true)}>
                                    Crear el primero
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Razón social</TableHead>
                                    <TableHead className="hidden md:table-cell">RUT</TableHead>
                                    <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                                    <TableHead className="hidden lg:table-cell">Ciudad</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientes.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <p className="font-medium">{c.razonSocial}</p>
                                            <p className="text-xs text-muted-foreground md:hidden">{c.rut}</p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{c.rut}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{c.contacto}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{c.ciudad}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => { setEditando(c); setFormAbierto(true) }}>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-500 focus:text-red-500"
                                                        onClick={() => setEliminando(c)}
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

            {/* ===== Paginación ===== */}
            {totalPaginas > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{total} clientes</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1}
                                onClick={() => setPage(page - 1)}>Anterior</Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPaginas}
                                onClick={() => setPage(page + 1)}>Siguiente</Button>
                    </div>
                </div>
            )}

            {/* ===== Modales ===== */}
            <ClienteFormDialog
                abierto={formAbierto}
                cliente={editando}
                onCerrar={() => { setFormAbierto(false); setEditando(null) }}
                onGuardar={handleGuardar}
            />
            <ConfirmarDialog
                abierto={!!eliminando}
                titulo="¿Eliminar cliente?"
                descripcion={`Se eliminará "${eliminando?.razonSocial}". Sus cotizaciones históricas se conservan.`}
                onCancelar={() => setEliminando(null)}
                onConfirmar={handleEliminar}
            />
        </div>
    )
}