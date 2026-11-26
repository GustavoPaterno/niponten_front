import { Suspense } from "react";

import MeusPedidos from "@/src/features/meus-pedidos/MeusPedidos";

// MeusPedidos lê ?pagar= (vindo do checkout): fica num Suspense para a página continuar estática.
export default function MeusPedidosPage() {
    return (
        <Suspense>
            <MeusPedidos />
        </Suspense>
    );
}
