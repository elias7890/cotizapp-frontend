const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1"

// ===== Tipos espejo de tus DTOs de Go =====
export interface Usuario {
    id: number
    nombre: string
    email: string
    rol: string
    createdAt: string
}

export interface LoginResponse {
    token: string
    usuario: Usuario
}

// ===== Manejo del token =====
export function getToken(): string | null {
    return localStorage.getItem("token")
}

export function setSesion(token: string, usuario: Usuario) {
    localStorage.setItem("token", token)
    localStorage.setItem("usuario", JSON.stringify(usuario))
}

export function cerrarSesion() {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
}

export function getUsuario(): Usuario | null {
    const raw = localStorage.getItem("usuario")
    return raw ? (JSON.parse(raw) as Usuario) : null
}

// ===== El fetch central: agrega token, maneja errores =====
export class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken()

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    })

    if (res.status === 401) {
        cerrarSesion()
        window.location.href = "/login" // token vencido -> al login
        throw new ApiError(401, "sesión expirada")
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new ApiError(res.status, body.error ?? "error inesperado")
    }

    if (res.status === 204) return undefined as T // DELETE sin body
    return res.json() as Promise<T>
}

// ===== Endpoints =====
export const api = {
    login: (email: string, password: string) =>
        request<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),
    dashboard: () => request<DashboardData>("/dashboard"),
    clientes: {
        listar: (q = "", page = 1, limit = 20) =>
            request<ListaPaginada<Cliente>>(`/clientes?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`),
        crear: (data: ClienteRequest) =>
            request<Cliente>("/clientes", { method: "POST", body: JSON.stringify(data) }),
        actualizar: (id: number, data: ClienteRequest) =>
            request<Cliente>(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        eliminar: (id: number) =>
            request<void>(`/clientes/${id}`, { method: "DELETE" }),
    },
    maquinas: {
        listar: (q = "", clienteId = 0, page = 1, limit = 20) =>
            request<ListaPaginada<Maquina>>(
                `/maquinas?q=${encodeURIComponent(q)}&clienteId=${clienteId || ""}&page=${page}&limit=${limit}`
            ),
        crear: (data: MaquinaRequest) =>
            request<Maquina>("/maquinas", { method: "POST", body: JSON.stringify(data) }),
        actualizar: (id: number, data: MaquinaRequest) =>
            request<Maquina>(`/maquinas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        eliminar: (id: number) =>
            request<void>(`/maquinas/${id}`, { method: "DELETE" }),
    },
    cotizaciones: {
        listar: (q = "", estado = "", page = 1, limit = 20) =>
            request<ListaPaginada<Cotizacion>>(
                `/cotizaciones?q=${encodeURIComponent(q)}&estado=${estado}&page=${page}&limit=${limit}`
            ),
        obtener: (id: number) => request<Cotizacion>(`/cotizaciones/${id}`),
        crear: (data: CotizacionRequest) =>
            request<Cotizacion>("/cotizaciones", { method: "POST", body: JSON.stringify(data) }),
        actualizar: (id: number, data: CotizacionRequest) =>
            request<Cotizacion>(`/cotizaciones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        emitir: (id: number) =>
            request<Cotizacion>(`/cotizaciones/${id}/emitir`, { method: "POST" }),
        duplicar: (id: number) =>
            request<Cotizacion>(`/cotizaciones/${id}/duplicar`, { method: "POST" }),
        anular: (id: number) =>
            request<Cotizacion>(`/cotizaciones/${id}/anular`, { method: "POST" }),
    },
}

// ===== Dashboard =====
export interface SeriePunto {
    mes: string
    cantidad: number
    monto: string // decimal de Go llega como string
}

export interface CotizacionResumen {
    id: number
    numero: number | null
    estado: string
    cliente: { razonSocial: string }
    total: string
    createdAt: string
}

export interface DashboardData {
    totalClientes: number
    totalMaquinas: number
    cotizacionesMes: number
    cotizacionesAnio: number
    montoMes: string
    montoAnio: string
    serie: SeriePunto[]
    ultimas: CotizacionResumen[]
}

// ===== Clientes =====
export interface Cliente {
    id: number
    rut: string
    razonSocial: string
    nombreFantasia: string
    giro: string
    direccion: string
    comuna: string
    ciudad: string
    telefono: string
    email: string
    contacto: string
    notas: string
    createdAt: string
    updatedAt: string
}

export interface ClienteRequest {
    rut: string
    razonSocial: string
    nombreFantasia: string
    giro: string
    direccion: string
    comuna: string
    ciudad: string
    telefono: string
    email: string
    contacto: string
    notas: string
}

export interface ListaPaginada<T> {
    data: T[]
    total: number
    page: number
    limit: number
}

// ===== Máquinas =====
export interface Maquina {
    id: number
    clienteId: number
    tipo: string
    marca: string
    modelo: string
    serie: string
    horometro: number | null
    observaciones: string
    createdAt: string
    updatedAt: string
}

export interface MaquinaRequest {
    clienteId: number
    tipo: string
    marca: string
    modelo: string
    serie: string
    horometro: number | null
    observaciones: string
}

// ===== Cotizaciones =====
export interface DetalleCotizacion {
    id: number
    orden: number
    descripcion: string
    cantidad: string
    precioUnitario: string
    totalLinea: string
}

export interface Cotizacion {
    id: number
    numero: number | null
    estado: string
    clienteId: number | null
    maquinaId: number | null
    cliente: {
        rut: string
        razonSocial: string
        giro: string
        direccion: string
        comuna: string
        ciudad: string
        telefono: string
        email: string
        contacto: string
    }
    maquina: {
        tipo: string
        marca: string
        modelo: string
        serie: string
        horometro: number | null
    } | null
    detalles: DetalleCotizacion[]
    observaciones: string
    recuadroFinal: string
    validezDias: number
    formaPago: string
    subtotal: string
    iva: string
    total: string
    fechaEmision: string | null
    createdAt: string
    updatedAt: string
}

export interface DetalleRequest {
    descripcion: string
    cantidad: string
    precioUnitario: string
}

export interface CotizacionRequest {
    clienteId: number
    maquinaId: number | null
    detalles: DetalleRequest[]
    observaciones: string
    recuadroFinal: string
    validezDias: number
    formaPago: string
}

export async function descargarPDF(id: number, numero: number | null) {
    const res = await fetch(`${API_URL}/cotizaciones/${id}/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new ApiError(res.status, "no se pudo descargar el PDF")

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = numero ? `cotizacion-${numero}.pdf` : "cotizacion-borrador.pdf"
    a.click()
    URL.revokeObjectURL(url)
}