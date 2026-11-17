import Operacion from "./Operacion";
import { purchasesApi } from "../services/api";
export default function Compras() { return <Operacion type="compra" api={purchasesApi} />; }

