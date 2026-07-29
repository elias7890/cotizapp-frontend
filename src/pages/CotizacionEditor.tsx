import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
    api, descargarPDF, type Cliente, type Maquina, type Cotizacion,
    type CotizacionRequest, type DetalleRequest, ApiError,
} from "@/lib/api"
import { formatoCLP } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Download, Send, Loader2 } from "lucide-react"

interface Linea extends DetalleRequest {
    key: number // identidad local para el render
}

export default function CotizacionEditor() {
    const { id } = useParams() // undefined en /nueva
    const navigate = useNavigate()
    const esNueva = !id

    const [cargando, setCargando] = useState(!esNueva)
    const [guardando, setGuardando] = useState(false)
    const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)

    // Catálogos
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [maquinas, setMaquinas] = useState<Maquina[]>([])
    const [cargandoMaquinas, setCargandoMaquinas] = useState(false)

    // Formulario
    const [clienteId, setClienteId] = useState(0)
    const [maquinaId, setMaquinaId] = useState<number | null>(null)
    const [lineas, setLineas] = useState<Linea[]>([{ key: 1, descripcion: "", cantidad: "1", precioUnitario: "" }])
    const [observaciones, setObservaciones] = useState("")
    const [recuadroFinal, setRecuadroFinal] = useState("")
    const [formaPago, setFormaPago] = useState("")
    const [validezDias, setValidezDias] = useState(15)

    const soloLectura = cotizacion?.estado === "anulada"

    // Carga catálogo de clientes
    useEffect(() => {
        api.clientes.listar("", 1, 100).then((res) => setClientes(res.data))
    }, [])

    // Carga la cotización si es edición
    useEffect(() => {
        if (esNueva) return
        api.cotizaciones.obtener(Number(id))
            .then((c) => {
                setCotizacion(c)
                setClienteId(c.clienteId ?? 0)
                setMaquinaId(c.maquinaId)
                setLineas(c.detalles.map((d, i) => ({
                    key: i + 1,
                    descripcion: d.descripcion,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario,
                })))
                setObservaciones(c.observaciones)
                setRecuadroFinal(c.recuadroFinal)
                setFormaPago(c.formaPago)
                setValidezDias(c.validezDias)
            })
            .catch(() => {
                toast.error("No se encontró la cotización")
                navigate("/cotizaciones")
            })
            .finally(() => setCargando(false))
    }, [id, esNueva, navigate])

    // Máquinas del cliente seleccionado (select encadenado)
    useEffect(() => {
        if (!clienteId) return
        api.maquinas.listar("", clienteId, 1, 100)
            .then((res) => setMaquinas(res.data))
            .catch(() => toast.error("No se pudieron cargar las máquinas del cliente"))
            .finally(() => setCargandoMaquinas(false))
    }, [clienteId])

    // ===== Totales en vivo (solo para MOSTRAR; el backend decide) =====
    const subtotal = lineas.reduce((acc, l) => {
        const total = (parseFloat(l.cantidad) || 0) * (parseFloat(l.precioUnitario) || 0)
        return acc + total
    }, 0)
    const iva = Math.round(subtotal * 0.19)
    const total = subtotal + iva

    // ===== Manejo de líneas =====
    function actualizarLinea(key: number, campo: keyof DetalleRequest, valor: string) {
        setLineas(lineas.map((l) => (l.key === key ? { ...l, [campo]: valor } : l)))
    }

    function agregarLinea() {
        const nuevoKey = Math.max(...lineas.map((l) => l.key), 0) + 1
        setLineas([...lineas, { key: nuevoKey, descripcion: "", cantidad: "1", precioUnitario: "" }])
    }

    function quitarLinea(key: number) {
        if (lineas.length === 1) return
        setLineas(lineas.filter((l) => l.key !== key))
    }

    // ===== Acciones =====
    function armarRequest(): CotizacionRequest {
        return {
            clienteId,
            maquinaId,
            detalles: lineas
                .filter((l) => l.descripcion.trim() !== "")
                .map(({ descripcion, cantidad, precioUnitario }) => ({
                    descripcion, cantidad, precioUnitario: precioUnitario || "0",
                })),
            observaciones,
            recuadroFinal,
            validezDias,
            formaPago,
        }
    }

    async function guardar(): Promise<Cotizacion | null> {
        setGuardando(true)
        try {
            const data = armarRequest()
            const res = esNueva && !cotizacion
                ? await api.cotizaciones.crear(data)
                : await api.cotizaciones.actualizar(cotizacion?.id ?? Number(id), data)
            setCotizacion(res)
            return res
        } catch (err) {
            if (err instanceof ApiError) toast.error(err.message)
            else toast.error("Error al guardar")
            return null
        } finally {
            setGuardando(false)
        }
    }

    async function handleGuardar() {
        const res = await guardar()
        if (res) {
            toast.success(esNueva ? "Borrador creado" : "Cambios guardados")
            if (esNueva) navigate(`/cotizaciones/${res.id}`, { replace: true })
        }
    }

    async function handleEmitir() {
        const guardada = await guardar()
        if (!guardada) return
        try {
            const emitida = await api.cotizaciones.emitir(guardada.id)
            setCotizacion(emitida)
            toast.success(`Cotización emitida con el N° ${emitida.numero}`)
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "No se pudo emitir")
        }
    }

    // Derivados (después de los hooks, antes del return está bien: no son hooks)
    const clienteSeleccionado = clientes.find((c) => c.id === clienteId)
    const maquinaSeleccionada = maquinas.find((m) => m.id === maquinaId)
    const puedeGuardar = clienteId > 0 && lineas.some((l) => l.descripcion.trim() !== "")

    if (cargando) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-60 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-4 max-w-4xl">
            {/* ===== Encabezado ===== */}
            <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold flex-1">
                    {cotizacion?.numero ? `Cotización N° ${cotizacion.numero}` : "Nueva cotización"}
                </h1>
                {cotizacion && <BadgeEstado estado={cotizacion.estado} />}
            </div>

            {/* ===== Cliente y máquina ===== */}
            <Card>
                <CardHeader><CardTitle className="text-base">Cliente y máquina</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Cliente *</Label>
                        <Select
                            value={clienteId ? String(clienteId) : ""}
                            onValueChange={(v) => {
                                if (!v) return
                                setClienteId(Number(v))
                                setMaquinaId(null)
                                setMaquinas([])
                                setCargandoMaquinas(true)
                            }}
                            disabled={soloLectura}
                        >
                            <SelectTrigger className="w-full">
                                <span className="truncate text-left">
                                    {clienteSeleccionado
                                        ? clienteSeleccionado.razonSocial
                                        : <span className="text-muted-foreground">Selecciona un cliente</span>}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {clientes.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.razonSocial}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Máquina (opcional)</Label>
                        <Select
                            value={maquinaId ? String(maquinaId) : ""}
                            onValueChange={(v) => setMaquinaId(v ? Number(v) : null)}
                            disabled={soloLectura || !clienteId || cargandoMaquinas}
                        >
                            <SelectTrigger className="w-full">
                                <span className="truncate text-left">
                                    {maquinaSeleccionada
                                        ? `${maquinaSeleccionada.tipo} ${maquinaSeleccionada.marca} ${maquinaSeleccionada.modelo}`
                                        : (
                                            <span className="text-muted-foreground">
                                                {!clienteId
                                                    ? "Primero elige el cliente"
                                                    : cargandoMaquinas
                                                        ? "Cargando máquinas..."
                                                        : maquinas.length === 0
                                                            ? "Este cliente no tiene máquinas"
                                                            : "Selecciona una máquina"}
                                            </span>
                                        )}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {maquinas.map((m) => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                        {m.tipo} {m.marca} {m.modelo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* ===== Líneas ===== */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Productos y servicios</CardTitle>
                    {!soloLectura && (
                        <Button variant="outline" size="sm" onClick={agregarLinea}>
                            <Plus className="h-4 w-4 mr-1" /> Agregar línea
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    {lineas.map((l) => {
                        const totalLinea = (parseFloat(l.cantidad) || 0) * (parseFloat(l.precioUnitario) || 0)
                        return (
                            <div key={l.key} className="grid grid-cols-12 gap-2 items-start">
                                <div className="col-span-12 md:col-span-6">
                                    <Input
                                        placeholder="Descripción del producto o servicio"
                                        value={l.descripcion}
                                        onChange={(e) => actualizarLinea(l.key, "descripcion", e.target.value)}
                                        disabled={soloLectura}
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-1">
                                    <Input
                                        type="number" min="0" step="0.01" placeholder="Cant."
                                        value={l.cantidad}
                                        onChange={(e) => actualizarLinea(l.key, "cantidad", e.target.value)}
                                        disabled={soloLectura}
                                        className="text-right"
                                    />
                                </div>
                                <div className="col-span-5 md:col-span-2">
                                    <Input
                                        type="number" min="0" placeholder="Precio unit."
                                        value={l.precioUnitario}
                                        onChange={(e) => actualizarLinea(l.key, "precioUnitario", e.target.value)}
                                        disabled={soloLectura}
                                        className="text-right"
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2 flex h-9 items-center justify-end text-sm font-medium tabular-nums">
                                    {formatoCLP(totalLinea)}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {!soloLectura && (
                                        <Button
                                            variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500"
                                            onClick={() => quitarLinea(l.key)}
                                            disabled={lineas.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {/* Totales */}
                    <div className="border-t pt-3 space-y-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{formatoCLP(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>IVA 19%</span>
                            <span className="tabular-nums">{formatoCLP(iva)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold">
                            <span>Total</span>
                            <span className="tabular-nums">{formatoCLP(total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ===== Detalles adicionales ===== */}
            <Card>
                <CardHeader><CardTitle className="text-base">Detalles del documento</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label>Observaciones</Label>
                        <Textarea
                            rows={2}
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            disabled={soloLectura}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Recuadro final (garantías, notas destacadas)</Label>
                        <Textarea
                            rows={2}
                            value={recuadroFinal}
                            onChange={(e) => setRecuadroFinal(e.target.value)}
                            disabled={soloLectura}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Condición de pago</Label>
                        <Input
                            placeholder="Contado, 30 días..."
                            value={formaPago}
                            onChange={(e) => setFormaPago(e.target.value)}
                            disabled={soloLectura}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Validez (días)</Label>
                        <Input
                            type="number" min="1"
                            value={validezDias}
                            onChange={(e) => setValidezDias(Number(e.target.value) || 15)}
                            disabled={soloLectura}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ===== Barra de acciones ===== */}
            <div className="flex flex-wrap gap-2 justify-end sticky bottom-20 md:bottom-4 bg-background/95 backdrop-blur p-3 rounded-lg border">
                {cotizacion && (
                    <Button variant="outline" onClick={() => descargarPDF(cotizacion.id, cotizacion.numero)}>
                        <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                )}
                {!soloLectura && (
                    <>
                        <Button variant="outline" onClick={handleGuardar} disabled={guardando || !puedeGuardar}>
                            {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {cotizacion?.estado === "emitida" ? "Guardar cambios" : "Guardar borrador"}
                        </Button>
                        {(!cotizacion || cotizacion.estado === "borrador") && (
                            <Button onClick={handleEmitir} disabled={guardando || !puedeGuardar}>
                                <Send className="h-4 w-4 mr-2" /> Emitir
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function BadgeEstado({ estado }: { estado: string }) {
    const estilos: Record<string, string> = {
        emitida: "bg-emerald-500/10 text-emerald-500",
        borrador: "bg-amber-500/10 text-amber-500",
        anulada: "bg-red-500/10 text-red-500",
    }
    return <Badge variant="outline" className={estilos[estado] ?? ""}>{estado}</Badge>
}