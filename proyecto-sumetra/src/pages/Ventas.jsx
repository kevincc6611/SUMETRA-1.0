import Operacion from "./Operacion";
import { salesApi } from "../services/api";
export default function Ventas() { return <Operacion type="venta" api={salesApi} />; }
