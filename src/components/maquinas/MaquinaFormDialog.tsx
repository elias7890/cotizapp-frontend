import { useEffect, useState } from "react"
import type { Maquina, MaquinaRequest, Cliente } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const vacio: MaquinaRequest = {
    clienteId: 0, tipo: "", marca: "", modelo: "",
    serie: "", horometro: null, observaciones: "",
}

interface Props {
    abierto: boolean
    maquina: Maquina | null
    clientes: Cliente[]
    onCerrar: () => void
    onGuardar: (data: MaquinaRequest) => Promise<void>
}

export default function MaquinaFormDialog({ abierto, maquina, clientes, onCerrar, onGuardar }: Props) {
    const [form, setForm] = useState<MaquinaRequest>(vacio)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (abierto) setForm(maquina ? { ...maquina } : vacio)
    }, [abierto, maquina])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.clienteId) return // el backend también valida; esto es UX
        setGuardando(true)
        await onGuardar(form)
        setGuardando(false)
    }

    return (
        <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
            <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{maquina ? "Editar máquina" : "Nueva máquina"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Cliente *</Label>
                        <Select
                            value={form.clienteId ? String(form.clienteId) : ""}
                            onValueChange={(v) => { if (v) setForm({ ...form, clienteId: Number(v) }) }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clientes.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.razonSocial}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de máquina *</Label>
                            <Input
                                required
                                placeholder="Excavadora, Skidder..."
                                value={form.tipo}
                                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Marca</Label>
                            <Input
                                value={form.marca}
                                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Modelo</Label>
                            <Input
                                value={form.modelo}
                                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Serie</Label>
                            <Input
                                value={form.serie}
                                onChange={(e) => setForm({ ...form, serie: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Horómetro (horas)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={form.horometro ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, horometro: e.target.value === "" ? null : Number(e.target.value) })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
                        <Button type="submit" disabled={guardando || !form.clienteId}>
                            {maquina ? "Guardar cambios" : "Crear máquina"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}