import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { CriarConta } from "./pages/CriarConta";
import { EsqueciSenha } from "./pages/EsqueciSenha";
import { Dashboard } from "./pages/Dashboard";
import { Processos } from "./pages/Processos";
import { ProcessoForm } from "./pages/ProcessoForm";
import { ProcessoDetalhe } from "./pages/ProcessoDetalhe";
import { Clientes } from "./pages/Clientes";
import { Financeiro } from "./pages/Financeiro";
import { Configuracoes } from "./pages/Configuracoes";
import { PortalArea, PortalLogin } from "./pages/PortalCliente";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/criar-conta" element={<CriarConta />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/portal" element={<PortalLogin />} />
      <Route path="/portal/area" element={<PortalArea />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="processos" element={<Processos />} />
        <Route path="processos/novo" element={<ProcessoForm />} />
        <Route path="processos/:id/editar" element={<ProcessoForm />} />
        <Route path="processos/:id" element={<ProcessoDetalhe />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
