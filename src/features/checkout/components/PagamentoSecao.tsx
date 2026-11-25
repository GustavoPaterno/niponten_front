import { CreditCardOutlined, PaymentsOutlined, PixOutlined } from "@mui/icons-material";

import { OPCOES_PAGAMENTO, type FormaEscolhida } from "@/src/services/pagamento";

import Secao, { OpcaoCartao } from "./Secao";

const ICONES: Record<FormaEscolhida, typeof PaymentsOutlined> = {
    DINHEIRO: PaymentsOutlined,
    DEBITO: CreditCardOutlined,
    CREDITO: CreditCardOutlined,
    PIX: PixOutlined,
};

export default function PagamentoSecao({
    forma,
    onChange,
    erro,
}: {
    forma: FormaEscolhida | null;
    onChange: (forma: FormaEscolhida) => void;
    erro: boolean;
}) {
    return (
        <Secao titulo="Forma de pagamento">
            <p className="-mt-1 text-sm text-tinta-suave">Você paga na entrega ou no balcão.</p>
            <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {OPCOES_PAGAMENTO.map((opcao) => {
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
            {erro && <p className="text-sm text-erro">Escolha como vai pagar.</p>}
        </Secao>
    );
}
