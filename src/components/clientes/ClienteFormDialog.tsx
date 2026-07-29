import { useEffect, useState } from "react"
import type { Cliente, ClienteRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

const vacio: ClienteRequest = {
    rut: "", razonSocial: "", nombreFantasia: "", giro: "",
    direccion: "", comuna: "", ciudad: "", telefono: "",
    email: "", contacto: "", notas: "",
}

interface Props {
    abierto: boolean
    cliente: Cliente | null // null = crear, con valor = editar
    onCerrar: () => void
    onGuardar: (data: ClienteRequest) => Promise<void>
}

export default function ClienteFormDialog({ abierto, cliente, onCerrar, onGuardar }: Props) {
    const [form, setForm] = useState<ClienteRequest>(vacio)
    const [guardando, setGuardando] = useState(false)

    // Al abrir: precarga si es edición, limpia si es creación
    useEffect(() => {
        if (abierto) setForm(cliente ? { ...cliente } : vacio)
    }, [abierto, cliente])

    function campo(nombre: keyof ClienteRequest) {
        return {
            value: form[nombre],
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, [nombre]: e.target.value }),
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setGuardando(true)
        await onGuardar(form)
        setGuardando(false)
    }

    return (
        <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
            <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{cliente ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Razón social *</Label>
                            <Input required {...campo("razonSocial")} />
                        </div>
                        <div className="space-y-2">
                            <Label>RUT</Label>
                            <Input placeholder="76.123.456-7" {...campo("rut")} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre fantasía</Label>
                            <Input {...campo("nombreFantasia")} />
                        </div>
                        <div className="space-y-2">
                            <Label>Giro</Label>
                            <Input {...campo("giro")} />
                        </div>
                        <div className="space-y-2">
                            <Label>Contacto</Label>
                            <Input {...campo("contacto")} />
                        </div>
                        <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input {...campo("telefono")} />
                        </div>
                        <div className="space-y-2">
                            <Label>Correo</Label>
                            <Input type="email" {...campo("email")} />
                        </div>
                        <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input {...campo("direccion")} />
                        </div>
                        <div className="space-y-2">
                            <Label>Comuna</Label>
                            <Input {...campo("comuna")} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Ciudad</Label>
                            <Input {...campo("ciudad")} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
                        <Button type="submit" disabled={guardando}>
                            {cliente ? "Guardar cambios" : "Crear cliente"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}