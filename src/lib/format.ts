export function formatoCLP(valor: string | number): string {
    const n = typeof valor === "string" ? parseFloat(valor) : valor
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
    }).format(n)
}

export function formatoFecha(iso: string): string {
    return new Date(iso).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}