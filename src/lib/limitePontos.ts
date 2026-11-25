/**
 * ⚠️⚠️⚠️ REGRA TEMPORÁRIA NO FRONT: REMOVER QUANDO O BACKEND IMPLEMENTAR ⚠️⚠️⚠️
 *
 * Regra de negócio: o desconto com pontos não pode passar de 50% do valor dos produtos.
 * Isso é responsabilidade do backend, que ainda não faz a checagem (hoje ele só recusa desconto
 * maior que o valor dos itens que aceitam pontos). Enquanto isso, o limite é aplicado aqui.
 *
 * Atenção: por ser no front, a regra pode ser burlada chamando a API direto.
 *
 * Quando o backend passar a limitar:
 * 1. apague `FRACAO_MAXIMA_DESCONTO_PONTOS` e troque a linha marcada com "TEMPORÁRIO (50%)"
 *    por `const tetoCentavos = elegivelCentavos;` (ou use o máximo que o backend informar);
 * 2. ajuste o texto do limite em `features/carrinho/components/PontosCarrinho.tsx`.
 */
export const FRACAO_MAXIMA_DESCONTO_PONTOS = 0.5;

interface Limite {
    /** Pontos que o cliente tem. */
    saldo: number;
    /** Quanto 1 ponto vale, em reais. */
    valorDoPonto: number;
    /** Soma, em reais, dos itens que aceitam pontos (vem da cotação do backend). */
    subtotalElegivel: number;
}

/** Quantos pontos o cliente pode usar neste pedido. Conta em centavos para não sobrar resto. */
export function maximoDePontos({ saldo, valorDoPonto, subtotalElegivel }: Limite): number {
    const pontoCentavos = Math.round(valorDoPonto * 100);
    const elegivelCentavos = Math.round(subtotalElegivel * 100);

    if (pontoCentavos <= 0) {
        return 0;
    }

    const tetoCentavos = Math.floor(elegivelCentavos * FRACAO_MAXIMA_DESCONTO_PONTOS); // TEMPORÁRIO (50%)

    return Math.max(0, Math.min(saldo, Math.floor(tetoCentavos / pontoCentavos)));
}
