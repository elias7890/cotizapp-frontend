import { BrowserRouter, Routes, Route } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import RutaProtegida from "@/components/layout/RutaProtegida"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import Clientes from "@/pages/Clientes"
import Maquinas from "@/pages/Maquinas"
import Cotizaciones from "@/pages/Cotizaciones"
import { Toaster } from "@/components/ui/sonner"
import CotizacionEditor from "@/pages/CotizacionEditor"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<RutaProtegida />}>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/maquinas" element={<Maquinas />} />
                        <Route path="/cotizaciones" element={<Cotizaciones />} />
                        <Route path="/cotizaciones/nueva" element={<CotizacionEditor />} />
                        <Route path="/cotizaciones/:id" element={<CotizacionEditor />} />
                    </Route>
                </Route>
            </Routes>
            <Toaster richColors position="top-center" />
        </BrowserRouter>
    )
}

export default App