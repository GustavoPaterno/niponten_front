import AuthShell from "@/src/components/auth/AuthShell";
import LoginForm from "./components/LoginForm";

export default function LoginBuild() {
    return (
        <AuthShell
            title="Entrar"
            subtitle="Acesse sua conta para continuar."
        >
            <LoginForm />
        </AuthShell>
    );
}
