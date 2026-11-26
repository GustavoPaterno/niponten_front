import { CreditCardOutlined, PaymentsOutlined, PixOutlined } from "@mui/icons-material";

import {
    OPCOES_ONLINE,
    OPCOES_PRESENCIAIS,
    type FormaEscolhida,
    type OpcaoPagamento,
} from "@/src/services/pagamento";

import Secao, { OpcaoCartao } from "./Secao";

const ICONES: Record<FormaEscolhida, typeof PaymentsOutlined> = {
    PIX_ONLINE: PixOutlined,
    CARTAO_ONLINE: CreditCardOutlined,
    DINHEIRO: PaymentsOutlined,
    DEBITO: CreditCardOutlined,
    CREDITO: CreditCardOutlined,
    PIX: PixOutlined,
};

function Grupo({
    titulo,
    opcoes,
    forma,
    onChange,
}: {
    titulo: string;
    opcoes: OpcaoPagamento[];
    forma: FormaEscolhida | null;
    onChange: (forma: FormaEscolhida) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-tinta-suave">{titulo}</p>
            <div role="radiogroup" aria-label={titulo} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {opcoes.map((opcao) => {
                    const Icone = ICONES[opcao.valor];

                    return (
                        <OpcaoCartao
                            key={opcao.valor}
                            marcado={forma === opcao.valor}
                            onClick={() => onChange(opcao.valor)}
                            icone={<Icone />}
                            titulo={opcao.label}
                            descricao={opcao.descricao}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default function PagamentoSecao({
    forma,
    onChange,
    erro,
    online,
}: {
    forma: FormaEscolhida | null;
    onChange: (forma: FormaEscolhida) => void;
    erro: boolean;
    /** `false` para o funcionário lançando pelo balcão: o backend só aceita presencial. */
    online: boolean;
}) {
    return (
        <Secao titulo="Forma de pagamento">
            {online && OPCOES_ONLINE.length > 0 && (
                <>
                    <Grupo titulo="Pagar agora" opcoes={OPCOES_ONLINE} forma={forma} onChange={onChange} />
                    <p className="-mt-1 text-xs text-tinta-suave">
                        O pedido vai para a cozinha assim que o pagamento for confirmado.
                    </p>
                </>
            )}
            <Grupo
                titulo="Pagar na entrega ou no balcão"
                opcoes={OPCOES_PRESENCIAIS}
                forma={forma}
                onChange={onChange}
            />
            {erro && <p className="text-sm text-erro">Escolha como vai pagar.</p>}
        </Secao>
    );
}
