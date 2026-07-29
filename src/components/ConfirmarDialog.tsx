import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

interface Props {
    abierto: boolean
    titulo: string
    descripcion: string
    onCancelar: () => void
    onConfirmar: () => void
}

export default function ConfirmarDialog({ abierto, titulo, descripcion, onCancelar, onConfirmar }: Props) {
    return (
        <Dialog open={abierto} onOpenChange={(open) => !open && onCancelar()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{titulo}</DialogTitle>
                    <DialogDescription>{descripcion}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancelar}>Cancelar</Button>
                    <Button variant="destructive" onClick={onConfirmar}>Eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}