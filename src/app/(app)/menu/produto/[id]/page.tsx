import ProdutoBuild from "@/src/features/produto/ProdutoBuild";

// /menu/produto/[id]            -> produto
// /menu/produto/[id]?promocao=N -> produto com o preço da promoção N
// /menu/produto/[id]?tipo=combo -> combo [id]
export default async function ProdutoPage({
    params,
    searchParams,
}: PageProps<"/menu/produto/[id]">) {
    const { id } = await params;
    const busca = await searchParams;

    const texto = (valor: string | string[] | undefined) =>
        Array.isArray(valor) ? valor[0] : valor;
    const promocao = Number(texto(busca.promocao));

    return (
        <ProdutoBuild
            key={`${id}-${texto(busca.tipo)}-${texto(busca.promocao)}`}
            id={Number(id)}
            combo={texto(busca.tipo) === "combo"}
            promocaoId={Number.isInteger(promocao) && promocao > 0 ? promocao : null}
        />
    );
}
