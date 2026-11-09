"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Alert,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    useMediaQuery,
} from "@mui/material";
import {
    AddLocationAltOutlined,
    CheckCircle,
    Close,
    DeliveryDiningOutlined,
    PlaceOutlined,
    RestaurantOutlined,
    StorefrontOutlined,
} from "@mui/icons-material";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import type { ItemCarrinho } from "@/src/lib/carrinho";
import { formatCurrency } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import { linkDeAcesso } from "@/src/lib/navegacao";
import {
    TIPOS_ENTREGA,
    criarPedido,
    listarEnderecos,
    type EnderecoInput,
    type EnderecoSalvo,
    type PedidoCriado,
    type TipoEntregaCliente,
} from "@/src/services/checkout";

const ICONES = {
    DELIVERY: DeliveryDiningOutlined,
    PICKUP: StorefrontOutlined,
    DINE_IN: RestaurantOutlined,
} as const;

const ENDERECO_VAZIO: EnderecoInput = { cep: "", rua: "", numero: "", complemento: "", referencia: "" };

/** (11) 91234-5678 */
function mascararTelefone(valor: string): string {
    const d = valor.replace(/\D/g, "").slice(0, 11);

    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 12345-678 */
function mascararCep(valor: string): string {
    const d = valor.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

// Foco dos campos na cor da marca e cantos arredondados.
const campo = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

interface FinalizarPedidoDialogProps {
    open: boolean;
    itens: ItemCarrinho[];
    total: number;
    onFechar: () => void;
    onCriado: (pedido: PedidoCriado) => void;
}

export default function FinalizarPedidoDialog(props: FinalizarPedidoDialogProps) {
    const celular = useMediaQuery("(max-width:639px)");

    return (
        <Dialog
            open={props.open}
            onClose={props.onFechar}
            fullWidth
            maxWidth="sm"
            fullScreen={celular}
            slotProps={{ paper: { sx: { borderRadius: celular ? 0 : "20px" } } }}
        >
            {/* O formulário reinicia a cada abertura. */}
            {props.open && <Formulario {...props} />}
        </Dialog>
    );
}

function Formulario({ itens, total, onFechar, onCriado }: FinalizarPedidoDialogProps) {
    const { me } = useSessao();
    const cliente = me?.type === "CLIENT";

    const [tipo, setTipo] = useState<TipoEntregaCliente | null>(null);
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [endereco, setEndereco] = useState<EnderecoInput>(ENDERECO_VAZIO);

    // Cliente logado: endereços salvos na conta.
    const [salvos, setSalvos] = useState<EnderecoSalvo[] | null>(null);
    const [escolhido, setEscolhido] = useState<number | "novo" | null>(null);

    const [tentou, setTentou] = useState(false);
    const [enviando, setEnviando] = useState(false);
    // Trava imediata contra clique duplo: o `enviando` só desabilita o botão no próximo
    // render, e um segundo clique antes disso criaria outro pedido.
    const enviandoRef = useRef(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        if (!cliente || !me) {
            return;
        }

        let cancelado = false;

        listarEnderecos(me.userId)
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
    }, [cliente, me]);

    const delivery = tipo === "DELIVERY";
    const digitaEndereco = delivery && (!cliente || escolhido === "novo");

    const erros = {
        tipo: !tipo,
        nome: !cliente && nome.trim().length < 2,
        telefone: !cliente && telefone.replace(/\D/g, "").length < 10,
        cep: digitaEndereco && endereco.cep.replace(/\D/g, "").length !== 8,
        rua: digitaEndereco && !endereco.rua.trim(),
        numero: digitaEndereco && !endereco.numero.trim(),
        enderecoSalvo: delivery && cliente && escolhido === null,
    };
    const invalido = Object.values(erros).some(Boolean);

    const mudarEndereco = (campo: keyof EnderecoInput, valor: string) =>
        setEndereco((atual) => ({ ...atual, [campo]: campo === "cep" ? mascararCep(valor) : valor }));

    const confirmar = async () => {
        if (enviandoRef.current) {
            return;
        }

        setTentou(true);
        setErro(null);

        if (invalido || !tipo) {
            return;
        }

        enviandoRef.current = true;
        setEnviando(true);

        try {
            const criado = await criarPedido(
                itens,
                {
                    tipo,
                    nome,
                    telefone,
                    enderecoId: typeof escolhido === "number" ? escolhido : null,
                    endereco: digitaEndereco ? endereco : null,
                },
                me
            );
            onCriado(criado);
        } catch (e) {
            setErro(mensagemDeErro(e));
            enviandoRef.current = false;
            setEnviando(false);
        }
    };

    return (
        <>
            <DialogTitle sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 3, pb: 1.5 }}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">Finalizar pedido</h2>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Total de {formatCurrency(total)} · pagamento na entrega ou no balcão
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onFechar}
                        disabled={enviando}
                        aria-label="Fechar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                    >
                        <Close fontSize="small" />
                    </button>
                </div>
            </DialogTitle>

            <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2 }}>
                <div className="flex flex-col gap-6 pt-1 text-neutral-900">
                    {/* Tipo de entrega */}
                    <section className="flex flex-col gap-2.5">
                        <h3 className="font-semibold">Como você quer receber?</h3>
                        <div role="radiogroup" aria-label="Tipo de entrega" className="grid grid-cols-3 gap-2">
                            {TIPOS_ENTREGA.map((t) => {
                                const Icone = ICONES[t.valor];
                                const marcado = tipo === t.valor;

                                return (
                                    <button
                                        key={t.valor}
                                        type="button"
                                        role="radio"
                                        aria-checked={marcado}
                                        aria-label={`${t.label}: ${t.descricao}`}
                                        onClick={() => setTipo(t.valor)}
                                        className={`relative flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition ${
                                            marcado
                                                ? "bg-red-50 text-(--primary) ring-2 ring-(--primary)"
                                                : "bg-white text-neutral-700 ring-1 ring-black/10 hover:ring-black/25"
                                        }`}
                                    >
                                        {marcado && (
                                            <CheckCircle sx={{ fontSize: 16 }} className="absolute right-2 top-2" />
                                        )}
                                        <Icone />
                                        <span className="text-sm font-semibold">{t.label}</span>
                                        <span className="hidden text-[11px] leading-tight text-neutral-500 sm:block">
                                            {t.descricao}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {tentou && erros.tipo && (
                            <p className="text-sm text-red-600">Escolha como quer receber o pedido.</p>
                        )}
                    </section>

                    {/* Contato (visitante e funcionário no balcão) */}
                    {!cliente && (
                        <section className="flex flex-col gap-3">
                            <div className="flex items-baseline justify-between gap-2">
                                <h3 className="font-semibold">Seus dados</h3>
                                {!me && (
                                    <Link href={linkDeAcesso("/login", "/carrinho")} className="text-sm font-medium text-(--primary)">
                                        Já tem conta? Entrar
                                    </Link>
                                )}
                            </div>
                            <TextField
                                label="Nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                autoComplete="name"
                                fullWidth
                                required
                                error={tentou && erros.nome}
                                helperText={tentou && erros.nome ? "Informe seu nome." : undefined}
                                sx={campo}
                            />
                            <TextField
                                label="Telefone (WhatsApp)"
                                value={telefone}
                                onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                                autoComplete="tel"
                                fullWidth
                                required
                                placeholder="(11) 91234-5678"
                                error={tentou && erros.telefone}
                                helperText={
                                    tentou && erros.telefone
                                        ? "Informe o telefone com DDD."
                                        : "Para avisarmos sobre o seu pedido."
                                }
                                slotProps={{ htmlInput: { inputMode: "tel" } }}
                                sx={campo}
                            />
                        </section>
                    )}

                    {/* Endereço (só delivery) */}
                    {delivery && (
                        <section className="flex flex-col gap-3">
                            <h3 className="font-semibold">Endereço de entrega</h3>

                            {cliente && salvos === null && (
                                <div className="flex justify-center py-4">
                                    <CircularProgress size={24} sx={{ color: "#EE2C2E" }} />
                                </div>
                            )}

                            {cliente && salvos && (
                                <div role="radiogroup" aria-label="Endereço" className="flex flex-col gap-2">
                                    {salvos.map((e) => (
                                        <OpcaoEndereco
                                            key={e.id}
                                            marcado={escolhido === e.id}
                                            onClick={() => setEscolhido(e.id)}
                                            icone={<PlaceOutlined />}
                                            titulo={e.resumo}
                                            subtitulo={e.detalhe}
                                        />
                                    ))}
                                    <OpcaoEndereco
                                        marcado={escolhido === "novo"}
                                        onClick={() => setEscolhido("novo")}
                                        icone={<AddLocationAltOutlined />}
                                        titulo="Novo endereço"
                                        subtitulo="Fica salvo na sua conta para os próximos pedidos"
                                    />
                                </div>
                            )}

                            {digitaEndereco && (
                                <div className="grid grid-cols-6 gap-3">
                                    <TextField
                                        label="CEP"
                                        value={endereco.cep}
                                        onChange={(e) => mudarEndereco("cep", e.target.value)}
                                        autoComplete="postal-code"
                                        required
                                        placeholder="12345-678"
                                        error={tentou && erros.cep}
                                        helperText={tentou && erros.cep ? "CEP com 8 dígitos." : undefined}
                                        slotProps={{ htmlInput: { inputMode: "numeric" } }}
                                        className="col-span-6 sm:col-span-2"
                                        sx={campo}
                                    />
                                    <TextField
                                        label="Rua"
                                        value={endereco.rua}
                                        onChange={(e) => mudarEndereco("rua", e.target.value)}
                                        autoComplete="address-line1"
                                        required
                                        error={tentou && erros.rua}
                                        helperText={tentou && erros.rua ? "Informe a rua." : undefined}
                                        className="col-span-6 sm:col-span-4"
                                        sx={campo}
                                    />
                                    <TextField
                                        label="Número"
                                        value={endereco.numero}
                                        onChange={(e) => mudarEndereco("numero", e.target.value)}
                                        required
                                        error={tentou && erros.numero}
                                        helperText={tentou && erros.numero ? "Informe o número." : undefined}
                                        className="col-span-2"
                                        sx={campo}
                                    />
                                    <TextField
                                        label="Complemento"
                                        value={endereco.complemento}
                                        onChange={(e) => mudarEndereco("complemento", e.target.value)}
                                        placeholder="Apto, bloco, casa..."
                                        autoComplete="address-line2"
                                        className="col-span-4"
                                        sx={campo}
                                    />
                                    <TextField
                                        label="Ponto de referência (opcional)"
                                        value={endereco.referencia}
                                        onChange={(e) => mudarEndereco("referencia", e.target.value)}
                                        placeholder="Ex.: ao lado da padaria"
                                        className="col-span-6"
                                        sx={campo}
                                    />
                                </div>
                            )}
                        </section>
                    )}

                    {erro && <Alert severity="error">{erro}</Alert>}
                </div>
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5, borderTop: "1px solid #eee" }}>
                <button
                    type="button"
                    onClick={confirmar}
                    disabled={enviando}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-(--primary) font-semibold text-white shadow-md shadow-red-600/30 transition hover:bg-[#d92628] active:scale-[0.99] disabled:opacity-60"
                >
                    {enviando ? (
                        <>
                            <CircularProgress size={18} sx={{ color: "#fff" }} />
                            Enviando pedido...
                        </>
                    ) : (
                        <>Confirmar pedido · {formatCurrency(total)}</>
                    )}
                </button>
            </DialogActions>
        </>
    );
}

function OpcaoEndereco({
    marcado,
    onClick,
    icone,
    titulo,
    subtitulo,
}: {
    marcado: boolean;
    onClick: () => void;
    icone: React.ReactNode;
    titulo: string;
    subtitulo: string;
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                marcado
                    ? "bg-red-50 ring-2 ring-(--primary)"
                    : "bg-white ring-1 ring-black/10 hover:ring-black/25"
            }`}
        >
            <span className={marcado ? "text-(--primary)" : "text-neutral-400"}>{icone}</span>
            <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{titulo}</span>
                {subtitulo && <span className="block truncate text-xs text-neutral-500">{subtitulo}</span>}
            </span>
            {marcado && <CheckCircle fontSize="small" className="text-(--primary)" />}
        </button>
    );
}
