import AuthShell from "@/src/components/auth/AuthShell";
import CadastroForm from "./components/CadastroForm";

export default function CadastroBuild() {
    return (
        <AuthShell
            title="Criar conta"
            subtitle="Preencha seus dados para fazer pedidos."
        >
            <CadastroForm />
        </AuthShell>
    );
}
