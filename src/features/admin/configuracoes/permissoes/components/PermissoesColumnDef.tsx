export const PermissaoColumnDef = ({
    permitido,
    children,
}: {
    permitido: boolean;
    children: React.ReactNode;
}) => (
    <div
        title={permitido ? "Permitido" : "Não permitido"}
        className={`flex h-7 w-7 items-center justify-center rounded-md ${
            permitido
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-500"
        }`}
    >
        {children}
    </div>
);