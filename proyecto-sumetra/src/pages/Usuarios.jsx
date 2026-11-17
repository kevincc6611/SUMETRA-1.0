import { useCallback, useEffect, useState } from "react";
import { usersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState, LoadingScreen, Notice, PageHeader } from "../components/UI";

export default function Usuarios() {
  const { user, refreshUser } = useAuth();
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [working, setWorking] = useState(null); const [message, setMessage] = useState(null);
  const load = useCallback(async () => { setLoading(true); try { setUsers(await usersApi.list()); } catch (err) { setMessage({ type: "error", text: err.message }); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const changeRole = async (item, rol) => { if (item.id === user.id && rol !== "administrador" && !window.confirm("Vas a quitarte permisos de administrador. ¿Deseas continuar?")) return; setWorking(item.id); try { await usersApi.updateRole(item.id, rol); setMessage({ type: "success", text: `Rol de ${item.nombre} actualizado.` }); await load(); if (item.id === user.id) await refreshUser(); } catch (err) { setMessage({ type: "error", text: err.message }); } finally { setWorking(null); } };
  return <div className="page"><PageHeader eyebrow="Administración" title="Usuarios y roles" description="Asigna permisos con el principio de mínimo acceso. Solo los administradores pueden modificar productos y movimientos manuales." /><Notice type={message?.type} onClose={() => setMessage(null)}>{message?.text}</Notice><section className="panel">{loading ? <LoadingScreen compact /> : users.length ? <div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><strong>{item.nombre}</strong>{item.id === user.id && <small className="cell-detail">Tu cuenta</small>}</td><td>{item.email}</td><td><select value={item.rol} onChange={(e) => changeRole(item, e.target.value)} disabled={working === item.id} aria-label={`Rol de ${item.nombre}`}><option value="usuario">Usuario</option><option value="administrador">Administrador</option></select></td><td><span className="badge badge-success">Activo</span></td></tr>)}</tbody></table></div> : <EmptyState title="No hay usuarios" />}</section></div>;
}

