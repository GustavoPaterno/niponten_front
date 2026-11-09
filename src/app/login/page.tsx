import LoginBuild from "@/src/features/login/LoginBuild";
import { caminhoDeVolta } from "@/src/lib/navegacao";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
    const { voltar } = await searchParams;

    return <LoginBuild voltar={caminhoDeVolta(voltar)} />;
}
