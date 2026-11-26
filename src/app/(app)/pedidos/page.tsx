import { Suspense } from "react";

import MeusPedidos from "@/src/features/meus-pedidos/MeusPedidos";

// MeusPedidos lê ?destaque= (vindo da tela de pagamento): fica num Suspense para a página continuar estática.
export default function MeusPedidosPage() {
    return (
        <Suspense>
            <MeusPedidos />
        </Suspense>
    );
}
