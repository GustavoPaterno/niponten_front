import AuthShell from "@/src/components/auth/AuthShell";
import LoginForm from "./components/LoginForm";

/** `voltar`: página para onde levar depois de entrar (ex.: o carrinho). */
export default function LoginBuild({ voltar }: { voltar: string | null }) {
    return (
        <AuthShell
            title="Entrar"
            subtitle="Acesse sua conta para continuar."
        >
            <LoginForm voltar={voltar} />
        </AuthShell>
    );
}
