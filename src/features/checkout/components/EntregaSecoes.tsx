import Link from "next/link";
import { CircularProgress, TextField } from "@mui/material";
import {
    AddLocationAltOutlined,
    CheckCircle,
    DeliveryDiningOutlined,
    PlaceOutlined,
    RestaurantOutlined,
    StorefrontOutlined,
} from "@mui/icons-material";

import { linkDeAcesso } from "@/src/lib/navegacao";
import {
    TIPOS_ENTREGA,
    type EnderecoInput,
    type EnderecoSalvo,
    type TipoEntregaCliente,
} from "@/src/services/checkout";

import Secao, { OpcaoCartao } from "./Secao";

const ICONES = {
    DELIVERY: DeliveryDiningOutlined,
    PICKUP: StorefrontOutlined,
    DINE_IN: RestaurantOutlined,
} as const;

// Cantos arredondados nos campos.
const campo = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

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

export function TipoEntregaSecao({
    tipo,
    onChange,
    erro,
}: {
    tipo: TipoEntregaCliente | null;
    onChange: (tipo: TipoEntregaCliente) => void;
    erro: boolean;
}) {
    return (
        <Secao titulo="Como você quer receber?">
            <div role="radiogroup" aria-label="Tipo de entrega" className="grid grid-cols-3 gap-2">
                {TIPOS_ENTREGA.map((t) => {
                    const Icone = ICONES[t.valor];

                    return (
                        <OpcaoCartao
                            key={t.valor}
                            marcado={tipo === t.valor}
                            onClick={() => onChange(t.valor)}
                            icone={<Icone />}
                            titulo={t.label}
                            descricao={t.descricao}
                        />
                    );
                })}
            </div>
            {erro && <p className="text-sm text-erro">Escolha como quer receber o pedido.</p>}
        </Secao>
    );
}

export interface Contato {
    nome: string;
    telefone: string;
    email: string;
}

/** Dados de quem não é cliente logado: visitante, ou funcionário pedindo pelo balcão. */
export function ContatoSecao({
    contato,
    onChange,
    erros,
    visitante,
}: {
    contato: Contato;
    onChange: (contato: Contato) => void;
    erros: Partial<Record<keyof Contato, boolean>>;
    visitante: boolean;
}) {
    return (
        <Secao titulo={visitante ? "Seus dados" : "Dados de quem pediu"}>
            {visitante && (
                <Link href={linkDeAcesso("/login", "/checkout")} className="-mt-1 text-sm font-medium text-marca">
                    Já tem conta? Entrar
                </Link>
            )}
            <TextField
                label="Nome"
                value={contato.nome}
                onChange={(e) => onChange({ ...contato, nome: e.target.value })}
                autoComplete="name"
                fullWidth
                required
                error={erros.nome}
                helperText={erros.nome ? "Informe o nome." : undefined}
                sx={campo}
            />
            <TextField
                label="Telefone (WhatsApp)"
                value={contato.telefone}
                onChange={(e) => onChange({ ...contato, telefone: mascararTelefone(e.target.value) })}
                autoComplete="tel"
                fullWidth
                required
                placeholder="(11) 91234-5678"
                error={erros.telefone}
                helperText={erros.telefone ? "Informe o telefone com DDD." : "Para avisarmos sobre o pedido."}
                slotProps={{ htmlInput: { inputMode: "tel" } }}
                sx={campo}
            />
            <TextField
                label={visitante ? "E-mail" : "E-mail (opcional)"}
                type="email"
                value={contato.email}
                onChange={(e) => onChange({ ...contato, email: e.target.value })}
                autoComplete="email"
                fullWidth
                required={visitante}
                error={erros.email}
                helperText={
                    erros.email ? "Informe um e-mail válido." : "Enviamos o link para acompanhar o pedido."
                }
                sx={campo}
            />
        </Secao>
    );
}

export function EnderecoSecao({
    cliente,
    salvos,
    escolhido,
    onEscolher,
    endereco,
    onEndereco,
    erros,
    digitando,
}: {
    cliente: boolean;
    /** `null` = ainda carregando (só para cliente). */
    salvos: EnderecoSalvo[] | null;
    escolhido: number | "novo" | null;
    onEscolher: (escolha: number | "novo") => void;
    endereco: EnderecoInput;
    onEndereco: (endereco: EnderecoInput) => void;
    erros: Partial<Record<"cep" | "rua" | "numero" | "enderecoSalvo", boolean>>;
    /** Mostra os campos de um endereço novo. */
    digitando: boolean;
}) {
    const mudar = (chave: keyof EnderecoInput, valor: string) =>
        onEndereco({ ...endereco, [chave]: chave === "cep" ? mascararCep(valor) : valor });

    return (
        <Secao titulo="Endereço de entrega">
            {cliente && salvos === null && (
                <div className="flex justify-center py-4">
                    <CircularProgress size={24} aria-label="Carregando endereços" />
                </div>
            )}

            {cliente && salvos && (
                <div role="radiogroup" aria-label="Endereço" className="flex flex-col gap-2">
                    {salvos.map((e) => (
                        <OpcaoEndereco
                            key={e.id}
                            marcado={escolhido === e.id}
                            onClick={() => onEscolher(e.id)}
                            icone={<PlaceOutlined />}
                            titulo={e.resumo}
                            subtitulo={e.detalhe}
                        />
                    ))}
                    <OpcaoEndereco
                        marcado={escolhido === "novo"}
                        onClick={() => onEscolher("novo")}
                        icone={<AddLocationAltOutlined />}
                        titulo="Novo endereço"
                        subtitulo="Fica salvo na sua conta para os próximos pedidos"
                    />
                </div>
            )}

            {erros.enderecoSalvo && <p className="text-sm text-erro">Escolha um endereço.</p>}

            {digitando && (
                <div className="grid grid-cols-6 gap-3">
                    <TextField
                        label="CEP"
                        value={endereco.cep}
                        onChange={(e) => mudar("cep", e.target.value)}
                        autoComplete="postal-code"
                        required
                        placeholder="12345-678"
                        error={erros.cep}
                        helperText={erros.cep ? "CEP com 8 dígitos." : undefined}
                        slotProps={{ htmlInput: { inputMode: "numeric" } }}
                        className="col-span-6 sm:col-span-2"
                        sx={campo}
                    />
                    <TextField
                        label="Rua"
                        value={endereco.rua}
                        onChange={(e) => mudar("rua", e.target.value)}
                        autoComplete="address-line1"
                        required
                        error={erros.rua}
                        helperText={erros.rua ? "Informe a rua." : undefined}
                        className="col-span-6 sm:col-span-4"
                        sx={campo}
                    />
                    <TextField
                        label="Número"
                        value={endereco.numero}
                        onChange={(e) => mudar("numero", e.target.value)}
                        required
                        error={erros.numero}
                        helperText={erros.numero ? "Informe o número." : undefined}
                        className="col-span-2"
                        sx={campo}
                    />
                    <TextField
                        label="Complemento"
                        value={endereco.complemento}
                        onChange={(e) => mudar("complemento", e.target.value)}
                        placeholder="Apto, bloco, casa..."
                        autoComplete="address-line2"
                        className="col-span-4"
                        sx={campo}
                    />
                    <TextField
                        label="Ponto de referência (opcional)"
                        value={endereco.referencia}
                        onChange={(e) => mudar("referencia", e.target.value)}
                        placeholder="Ex.: ao lado da padaria"
                        className="col-span-6"
                        sx={campo}
                    />
                </div>
            )}
        </Secao>
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
            className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                marcado ? "bg-marca/10 ring-2 ring-marca" : "bg-white ring-1 ring-black/10 hover:ring-black/25"
            }`}
        >
            <span className={marcado ? "text-marca" : "text-tinta-suave/70"}>{icone}</span>
            <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{titulo}</span>
                {subtitulo && <span className="block truncate text-xs text-tinta-suave">{subtitulo}</span>}
            </span>
            {marcado && <CheckCircle fontSize="small" className="text-marca" />}
        </button>
    );
}
