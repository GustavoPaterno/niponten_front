"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import { useToast } from "@/src/components/feedback/ToastProvider";
import type { Me } from "@/src/lib/auth";
import { limparCarrinho, useCarrinho, type ItemCarrinho } from "@/src/lib/carrinho";
import { mensagemDeErro } from "@/src/lib/http";
import { useDescontoPontos } from "@/src/features/carrinho/useDescontoPontos";
import {
    criarPedido,
    entregaParaCotacao,
    listarEnderecos,
    type EnderecoInput,
    type EnderecoSalvo,
    type PedidoCriado,
    type TipoEntregaCliente,
} from "@/src/services/checkout";
import {
    buscarCep,
    buscarConfiguracaoEntrega,
    type ConfiguracaoEntrega,
    type EnderecoDoCep,
} from "@/src/services/entrega";
import { opcaoDePagamento, type FormaEscolhida } from "@/src/services/pagamento";

import {
    ContatoSecao,
    EnderecoSecao,
    TipoEntregaSecao,
    type ConsultaCep,
    type Contato,
} from "./components/EntregaSecoes";
import PagamentoSecao from "./components/PagamentoSecao";
import ResumoCheckout from "./components/ResumoCheckout";

const ENDERECO_VAZIO: EnderecoInput = {
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    referencia: "",
    bairro: "",
    cidade: "",
    uf: "",
};

const digitos = (cep: string) => cep.replace(/\D/g, "");

/**
 * Completa o endereço com o que veio do CEP, se ele ainda for o mesmo. A rua só é trocada se
 * estava vazia ou se tinha sido preenchida pela consulta anterior (não apaga o que foi digitado).
 */
function preencherComCep(
    atual: EnderecoInput,
    cep: string,
    dados: EnderecoDoCep,
    ruaAutomaticaAnterior: string
): EnderecoInput {
    if (digitos(atual.cep) !== cep) {
        return atual;
    }

    const trocaRua = dados.rua && (atual.rua.trim() === "" || atual.rua === ruaAutomaticaAnterior);

    return {
        ...atual,
        rua: trocaRua ? (dados.rua as string) : atual.rua,
        bairro: dados.bairro ?? "",
        cidade: dados.cidade,
        uf: dados.uf,
    };
}

// O carrinho vem do localStorage, que só existe no navegador: até lá, mostra o carregamento.
const naoAssina = () => () => {};
function useNoNavegador() {
    return useSyncExternalStore(naoAssina, () => true, () => false);
}

export default function CheckoutBuild() {
    const noNavegador = useNoNavegador();
    const itens = useCarrinho();
    const { me, carregando } = useSessao();
    const router = useRouter();
    const toast = useToast();
    // Depois de enviar, o carrinho esvazia: isto evita piscar "carrinho vazio" antes de sair.
    const [enviado, setEnviado] = useState(false);

    if (!noNavegador || carregando || enviado) {
        return (
            <div className="flex justify-center py-20">
                <CircularProgress aria-label="Carregando" />
            </div>
        );
    }

    if (itens.length === 0) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-20 text-center text-tinta">
                <h1 className="font-display text-xl font-extrabold">Seu carrinho está vazio</h1>
                <p className="text-sm text-tinta-suave">Escolha algo no cardápio antes de pagar.</p>
                <Link href="/" className="mt-2 rounded-full bg-marca px-6 py-2.5 font-display text-sm font-bold text-white">
                    Ver cardápio
                </Link>
            </div>
        );
    }

    return (
        <Checkout
            // Entrar ou sair da conta muda os campos e os pontos: o formulário recomeça.
            key={me?.userId ?? "visitante"}
            me={me}
            itens={itens}
            onEnviado={(pedido) => {
                setEnviado(true);
                limparCarrinho();

                // Pagamento online: o pedido existe, mas só vai para a cozinha depois de pago.
                if (pedido.canal === "ONLINE") {
                    toast.success(`Pedido #${pedido.codigo} criado. Agora é só pagar.`);
                    router.push(`/pedidos?pagar=${pedido.id}`);

                    return;
                }

                toast.success(`Pedido #${pedido.codigo} enviado! Acompanhe por aqui.`);
                router.push("/pedidos");
            }}
        />
    );
}

interface CheckoutProps {
    me: Me | null;
    itens: ItemCarrinho[];
    onEnviado: (pedido: PedidoCriado) => void;
}

function Checkout({ me, itens, onEnviado }: CheckoutProps) {
    const cliente = me?.type === "CLIENT";
    // Funcionário lançando pelo balcão: o backend só aceita pagamento presencial.
    const podePagarOnline = !me || cliente;
    const userId = me?.userId;

    const [tipo, setTipo] = useState<TipoEntregaCliente | null>(null);
    const [contato, setContato] = useState<Contato>({ nome: "", telefone: "", email: "" });
    const [endereco, setEndereco] = useState<EnderecoInput>(ENDERECO_VAZIO);
    const [salvos, setSalvos] = useState<EnderecoSalvo[] | null>(null);
    const [escolhido, setEscolhido] = useState<number | "novo" | null>(null);
    const [forma, setForma] = useState<FormaEscolhida | null>(null);
    const [consultaCep, setConsultaCep] = useState<ConsultaCep | null>(null);
    // Rua que a última consulta de CEP preencheu (para saber se pode trocar por outra).
    const ruaAutomatica = useRef("");
    // CEP da consulta mais recente: respostas de consultas antigas são ignoradas.
    const ultimoCep = useRef("");
    // Endereço digitado que vale para a cotação. Só muda ao sair de um campo, para não
    // recalcular a taxa (e localizar o endereço no mapa) a cada tecla.
    const [enderecoCotado, setEnderecoCotado] = useState<EnderecoInput | null>(null);
    const [configEntrega, setConfigEntrega] = useState<ConfiguracaoEntrega | null>(null);

    const delivery = tipo === "DELIVERY";
    const digitaEndereco = delivery && (!cliente || escolhido === "novo");
    const enderecoId = delivery && cliente && typeof escolhido === "number" ? escolhido : null;
    const entregaCotacao = entregaParaCotacao(tipo, {
        enderecoId,
        endereco: digitaEndereco ? enderecoCotado : null,
    });

    // Pontos escolhidos no carrinho, com os valores calculados pelo backend (taxa de entrega inclusa).
    const desconto = useDescontoPontos(itens, me, true, entregaCotacao);

    const [tentou, setTentou] = useState(false);
    const [enviando, setEnviando] = useState(false);
    // Trava imediata contra clique duplo: o `enviando` só desabilita o botão no próximo
    // render, e um segundo clique antes disso criaria outro pedido.
    const enviandoRef = useRef(false);
    const [erro, setErro] = useState<string | null>(null);

    // Raio e faixas de entrega, para mostrar ao cliente. Sem eles o checkout funciona igual.
    useEffect(() => {
        let cancelado = false;

        buscarConfiguracaoEntrega()
            .then((configuracao) => {
                if (!cancelado) {
                    setConfigEntrega(configuracao);
                }
            })
            .catch(() => undefined);

        return () => {
            cancelado = true;
        };
    }, []);

    // Endereços salvos na conta.
    useEffect(() => {
        if (!cliente || userId === undefined) {
            return;
        }

        let cancelado = false;

        listarEnderecos(userId)
            .then((lista) => {
                if (!cancelado) {
                    setSalvos(lista);
                    setEscolhido(lista[0]?.id ?? "novo");
                }
            })
            .catch(() => {
                if (!cancelado) {
                    setSalvos([]);
                    setEscolhido("novo");
                }
            });

        return () => {
            cancelado = true;
        };
    }, [cliente, userId]);

    const consultarCep = (cep: string) => {
        ultimoCep.current = cep;
        setConsultaCep({ cep, estado: "carregando" });

        buscarCep(cep)
            .then((dados) => {
                if (ultimoCep.current !== cep) {
                    return;
                }

                if (!dados) {
                    setConsultaCep({ cep, estado: "nao-encontrado" });

                    return;
                }

                const anterior = ruaAutomatica.current;
                ruaAutomatica.current = dados.rua ?? "";
                setConsultaCep({ cep, estado: "ok", semRua: !dados.rua });
                setEndereco((atual) => preencherComCep(atual, cep, dados, anterior));
                // Se o endereço já tinha número, a taxa já pode ser calculada.
                setEnderecoCotado((atual) => (atual ? preencherComCep(atual, cep, dados, anterior) : atual));
            })
            .catch((e) => {
                if (ultimoCep.current === cep) {
                    setConsultaCep({ cep, estado: "erro", mensagem: mensagemDeErro(e) });
                }
            });
    };

    const mudarEndereco = (novo: EnderecoInput) => {
        const cep = digitos(novo.cep);

        if (cep === digitos(endereco.cep)) {
            setEndereco(novo);

            return;
        }

        // Outro CEP: bairro e cidade do anterior não valem mais.
        setEndereco({ ...novo, bairro: "", cidade: "", uf: "" });

        if (cep.length === 8) {
            consultarCep(cep);
        } else {
            ultimoCep.current = "";
            setConsultaCep(null);
        }
    };

    const cepNaoEncontrado =
        consultaCep?.estado === "nao-encontrado" && consultaCep.cep === digitos(endereco.cep);
    // A cotação ainda não usa o endereço que está na tela.
    const taxaDesatualizada =
        digitaEndereco &&
        JSON.stringify(entregaCotacao) !==
            JSON.stringify(entregaParaCotacao(tipo, { enderecoId: null, endereco }));
    const email = contato.email.trim();

    const erros = {
        tipo: !tipo,
        forma: !forma || (!podePagarOnline && opcaoDePagamento(forma).canal === "ONLINE"),
        nome: !cliente && contato.nome.trim().length < 2,
        telefone: !cliente && contato.telefone.replace(/\D/g, "").length < 10,
        // Visitante precisa de e-mail; funcionário pode deixar vazio.
        email: !cliente && (email === "" ? !me : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
        cep: digitaEndereco && (digitos(endereco.cep).length !== 8 || cepNaoEncontrado),
        rua: digitaEndereco && !endereco.rua.trim(),
        numero: digitaEndereco && !endereco.numero.trim(),
        enderecoSalvo: delivery && cliente && escolhido === null,
    };
    const invalido = Object.values(erros).some(Boolean);
    const mostrar = (campo: keyof typeof erros) => tentou && erros[campo];

    const confirmar = async () => {
        if (enviandoRef.current) {
            return;
        }

        setTentou(true);
        setErro(null);

        if (invalido || !tipo || !forma) {
            setErro("Confira os campos destacados.");

            return;
        }

        // O total na tela tem de ser o do endereço digitado.
        if (taxaDesatualizada) {
            setEnderecoCotado(endereco);
            setErro("Calculando a taxa de entrega deste endereço. Confira o total e confirme de novo.");

            return;
        }

        enviandoRef.current = true;
        setEnviando(true);

        let pedido: PedidoCriado;

        try {
            pedido = await criarPedido(
                itens,
                {
                    tipo,
                    ...contato,
                    forma,
                    pontos: desconto.pontos,
                    enderecoId: typeof escolhido === "number" ? escolhido : null,
                    endereco: digitaEndereco ? endereco : null,
                },
                me
            );
        } catch (e) {
            setErro(mensagemDeErro(e));
            enviandoRef.current = false;
            setEnviando(false);
            // Preço ou saldo podem ter mudado desde a cotação.
            desconto.recarregar();

            return;
        }

        // O pagamento online é feito em "Meus pedidos", onde dá para tentar de novo sem refazer o
        // pedido.
        onEnviado(pedido);
    };

    return (
        <div className="-mx-2 -mb-2 -mt-2 min-h-[calc(100dvh-4rem)] bg-chapa pb-12 text-tinta sm:-mx-4 sm:-mb-4 sm:-mt-4">
            <div className="mx-auto max-w-6xl px-4 pt-5 md:px-6 md:pt-8">
                <div className="mb-4">
                    <Link href="/carrinho" className="text-sm font-semibold text-marca">
                        ← Voltar ao carrinho
                    </Link>
                    <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">Pagamento</h1>
                </div>

                <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
                    <div className="flex flex-col gap-4">
                        <TipoEntregaSecao
                            tipo={tipo}
                            onChange={setTipo}
                            erro={mostrar("tipo")}
                            raioKm={configEntrega?.ativa ? configEntrega.raioKm : null}
                        />

                        {!cliente && (
                            <ContatoSecao
                                contato={contato}
                                onChange={setContato}
                                visitante={!me}
                                erros={{
                                    nome: mostrar("nome"),
                                    telefone: mostrar("telefone"),
                                    email: mostrar("email"),
                                }}
                            />
                        )}

                        {delivery && (
                            <EnderecoSecao
                                cliente={cliente}
                                salvos={salvos}
                                escolhido={escolhido}
                                onEscolher={setEscolhido}
                                endereco={endereco}
                                onEndereco={mudarEndereco}
                                onConfirmarEndereco={() => setEnderecoCotado(endereco)}
                                consultaCep={consultaCep?.cep === digitos(endereco.cep) ? consultaCep : null}
                                configEntrega={configEntrega}
                                digitando={digitaEndereco}
                                erros={{
                                    cep: mostrar("cep"),
                                    rua: mostrar("rua"),
                                    numero: mostrar("numero"),
                                    enderecoSalvo: mostrar("enderecoSalvo"),
                                }}
                            />
                        )}

                        <PagamentoSecao
                            forma={forma}
                            onChange={setForma}
                            erro={mostrar("forma")}
                            online={podePagarOnline}
                        />
                    </div>

                    <ResumoCheckout
                        itens={itens}
                        cotacao={desconto.cotacao}
                        erroCotacao={desconto.erroCotacao}
                        erro={erro}
                        pontos={desconto.pontos}
                        // Entrega com o cálculo ligado, mas ainda sem endereço: a taxa vem depois.
                        taxaPendente={
                            delivery &&
                            !!configEntrega?.ativa &&
                            !entregaCotacao?.addressId &&
                            !entregaCotacao?.address
                        }
                        cliente={cliente}
                        enviando={enviando}
                        onTentarDeNovo={desconto.recarregar}
                        onConfirmar={confirmar}
                    />
                </div>
            </div>
        </div>
    );
}
