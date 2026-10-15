interface Grupo {
    titulo: string;
    itens: string[];
}

interface DependentesListaProps {
    grupos: Grupo[];
    carregando: boolean;
    erro: boolean;
}

/**
 * Mostra o que depende de um item que está sendo inativado/esgotado.
 * O backend nunca propaga o status sozinho: quem decide é o usuário.
 */
export default function DependentesLista({
    grupos,
    carregando,
    erro,
}: DependentesListaProps) {
    if (carregando) {
        return (
            <p className="mt-3 text-gray-500">
                Verificando o que depende deste item...
            </p>
        );
    }

    if (erro) {
        return (
            <p className="mt-3 text-amber-700">
                Não foi possível verificar o que depende deste item. Você ainda
                pode continuar.
            </p>
        );
    }

    const comItens = grupos.filter((grupo) => grupo.itens.length > 0);

    if (comItens.length === 0) {
        return (
            <p className="mt-3 text-gray-500">
                Nada depende deste item no momento.
            </p>
        );
    }

    return (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
            {comItens.map((grupo) => (
                <div key={grupo.titulo} className="mb-2 last:mb-0">
                    <p className="font-semibold text-gray-800">{grupo.titulo}</p>

                    <ul className="ml-5 list-disc text-gray-700">
                        {grupo.itens.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                        ))}
                    </ul>
                </div>
            ))}

            <p className="mt-2 text-xs text-gray-600">
                Eles não serão alterados automaticamente. Se necessário, ajuste o
                status de cada um manualmente.
            </p>
        </div>
    );
}
