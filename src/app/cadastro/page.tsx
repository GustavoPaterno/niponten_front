import CadastroBuild from "@/src/features/cadastro/CadastroBuild";
import { caminhoDeVolta } from "@/src/lib/navegacao";

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
    const { voltar } = await searchParams;

    return <CadastroBuild voltar={caminhoDeVolta(voltar)} />;
}
