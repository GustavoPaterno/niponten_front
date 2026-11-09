import AuthShell from "@/src/components/auth/AuthShell";
import CadastroForm from "./components/CadastroForm";

/** `voltar`: página para onde levar depois de criar a conta (ex.: o carrinho). */
export default function CadastroBuild({ voltar }: { voltar: string | null }) {
    return (
        <AuthShell
            title="Criar conta"
            subtitle="Preencha seus dados para fazer pedidos."
        >
            <CadastroForm voltar={voltar} />
        </AuthShell>
    );
}
