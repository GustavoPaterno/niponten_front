import PagamentoPedido from "@/src/features/meus-pedidos/PagamentoPedido";

// /pedidos/[id]/pagamento -> paga o pedido online [id] (Pix ou cartão) e depois segue para "Meus pedidos".
export default async function PagamentoPedidoPage({ params }: PageProps<"/pedidos/[id]/pagamento">) {
    const { id } = await params;

    return <PagamentoPedido key={id} id={Number(id)} />;
}
