"use client";

import { useEffect, useState } from "react";
import { CircularProgress, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { AddOutlined, DeleteOutlined, MyLocationOutlined, PlaceOutlined } from "@mui/icons-material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { formatCurrency, formatDate, parsePreco } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import {
    MAXIMO_FAIXAS,
    buscarCep,
    buscarConfiguracaoEntrega,
    formatarKm,
    localidade,
    localizarLoja,
    salvarConfiguracaoEntrega,
    type ConfiguracaoEntrega,
    type EnderecoLojaInput,
    type Posicao,
} from "@/src/services/entrega";

import MapaLoja from "./MapaLoja";

// Limites do backend: distância com até 3 dígitos e 2 casas; taxa em reais com 2 casas.
const CEP_VALIDO = /^\d{5}-?\d{3}$/;
const KM_VALIDO = /^\d{1,3}([.,]\d{1,2})?$/;
const REAIS_VALIDOS = /^\d{1,9}([.,]\d{1,2})?$/;

interface FaixaForm {
    /** Só para a `key` da linha. */
    id: number;
    km: string;
    taxa: string;
}

interface Formulario {
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    faixas: FaixaForm[];
}

interface Localidade {
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
}

/**
 * Onde está o pino. `fixado` = posto à mão (clique, arraste ou localização do aparelho): só então
 * a posição vai para o backend. Sem `fixado`, é a posição achada pelo endereço.
 */
interface Pino {
    posicao: Posicao | null;
    fixado: boolean;
}

/** Resultado do último "Localizar no mapa" do endereço atual. */
type Busca = "nenhuma" | "buscando" | "achou" | "naoAchou";

let proximoId = 0;
const novaFaixa = (km = "", taxa = ""): FaixaForm => ({ id: proximoId++, km, taxa });

function paraTexto(numero: number | null): string {
    return numero === null ? "" : String(numero).replace(".", ",");
}

function paraFormulario(configuracao: ConfiguracaoEntrega): Formulario {
    const endereco = configuracao.endereco;

    return {
        cep: endereco?.cep ?? "",
        rua: endereco?.rua ?? "",
        numero: endereco?.numero ?? "",
        complemento: endereco?.complemento ?? "",
        faixas:
            configuracao.faixas.length > 0
                ? configuracao.faixas.map((f) => novaFaixa(paraTexto(f.ateKm), paraTexto(f.taxa)))
                : [novaFaixa()],
    };
}

const paraPino = (configuracao: ConfiguracaoEntrega): Pino => ({
    posicao: configuracao.posicao,
    fixado: configuracao.pinoFixado,
});

const paraLocalidade = (configuracao: ConfiguracaoEntrega): Localidade | null =>
    configuracao.endereco
        ? { bairro: configuracao.endereco.bairro, cidade: configuracao.endereco.cidade, uf: configuracao.endereco.uf }
        : null;

const FORM_VAZIO: Formulario = { cep: "", rua: "", numero: "", complemento: "", faixas: [novaFaixa()] };

/** Endereço e pino da loja, e faixas de taxa por distância. */
export default function EntregaCore() {
    const toast = useToast();

    const [tentativa, setTentativa] = useState(0);
    const [erroCarga, setErroCarga] = useState<string | null>(null);
    const [salva, setSalva] = useState<ConfiguracaoEntrega | null>(null);
    const [form, setForm] = useState<Formulario>(FORM_VAZIO);
    const [pino, setPino] = useState<Pino>({ posicao: null, fixado: false });
    const [lugar, setLugar] = useState<Localidade | null>(null);
    const [erroCep, setErroCep] = useState<string | null>(null);
    const [busca, setBusca] = useState<Busca>("nenhuma");
    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [localizando, setLocalizando] = useState(false);

    useEffect(() => {
        let cancelado = false;

        buscarConfiguracaoEntrega()
            .then((configuracao) => {
                if (!cancelado) {
                    setSalva(configuracao);
                    setForm(paraFormulario(configuracao));
                    setPino(paraPino(configuracao));
                    setLugar(paraLocalidade(configuracao));
                    setErroCarga(null);
                }
            })
            .catch((erro) => {
                if (!cancelado) {
                    setErroCarga(mensagemDeErro(erro));
                }
            });

        return () => {
            cancelado = true;
        };
    }, [tentativa]);

    const errosEndereco = {
        cep: !CEP_VALIDO.test(form.cep.trim()) ? "CEP com 8 dígitos, como 13560-042." : erroCep,
        rua: form.rua.trim() === "" ? "Informe a rua." : null,
        numero: form.numero.trim() === "" ? "Informe o número." : null,
    };
    const enderecoInvalido = !!(errosEndereco.cep || errosEndereco.rua || errosEndereco.numero);

    const kms = form.faixas.map((f) => parsePreco(f.km.trim()));
    const errosFaixas = form.faixas.map((f, i) => ({
        km:
            !KM_VALIDO.test(f.km.trim()) || kms[i] <= 0
                ? "Distância maior que zero, até 999,99 km."
                : kms.findIndex((k) => k === kms[i]) !== i
                  ? "Já existe uma faixa com esta distância."
                  : null,
        taxa: !REAIS_VALIDOS.test(f.taxa.trim()) ? "Valor igual ou maior que zero, até 2 casas." : null,
    }));
    const faixasInvalidas = errosFaixas.some((e) => e.km || e.taxa);
    const formInvalido = enderecoInvalido || faixasInvalidas;

    // Como as faixas ficam para o cliente (o backend guarda em ordem crescente).
    const previa = faixasInvalidas
        ? []
        : form.faixas
              .map((f) => ({ ateKm: parsePreco(f.km.trim()), taxa: parsePreco(f.taxa.trim()) }))
              .sort((a, b) => a.ateKm - b.ateKm);

    const linkMapa = pino.posicao
        ? `https://www.google.com/maps/search/?api=1&query=${pino.posicao.lat},${pino.posicao.lng}`
        : null;

    const enderecoDigitado = (): EnderecoLojaInput => ({
        cep: form.cep,
        rua: form.rua,
        numero: form.numero,
        complemento: form.complemento || null,
    });

    // Mudou o endereço: a posição achada para o anterior não vale mais. O pino posto à mão fica.
    const alterarEndereco = (campo: "cep" | "rua" | "numero" | "complemento", texto: string) => {
        setForm((atual) => ({ ...atual, [campo]: texto }));

        if (campo !== "complemento") {
            setBusca("nenhuma");
            setPino((atual) => (atual.fixado ? atual : { posicao: null, fixado: false }));
        }
    };

    const alterarCep = async (texto: string) => {
        alterarEndereco("cep", texto);
        setErroCep(null);
        setLugar(null);

        if (!CEP_VALIDO.test(texto.trim())) {
            return;
        }

        try {
            const achado = await buscarCep(texto);

            if (!achado) {
                setErroCep("CEP não encontrado.");

                return;
            }

            setLugar({ bairro: achado.bairro, cidade: achado.cidade, uf: achado.uf });

            // No CEP único de cidade pequena não vem rua: o admin digita.
            if (achado.rua) {
                setForm((atual) => ({ ...atual, rua: achado.rua ?? atual.rua }));
            }
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
        }
    };

    const localizar = async () => {
        if (enderecoInvalido) {
            setTentouSalvar(true);

            return;
        }

        setBusca("buscando");

        try {
            const achada = await localizarLoja(enderecoDigitado());

            setLugar({ bairro: achada.endereco.bairro, cidade: achada.endereco.cidade, uf: achada.endereco.uf });
            setBusca(achada.posicao ? "achou" : "naoAchou");
            setPino(achada.posicao ? { posicao: achada.posicao, fixado: false } : { posicao: null, fixado: false });
        } catch (erro) {
            setBusca("nenhuma");
            toast.error(mensagemDeErro(erro));
        }
    };

    const moverPino = (posicao: Posicao) =>
        setPino({ posicao: { lat: Number(posicao.lat.toFixed(6)), lng: Number(posicao.lng.toFixed(6)) }, fixado: true });

    const alterarFaixa = (id: number, campo: "km" | "taxa", texto: string) =>
        setForm((atual) => ({
            ...atual,
            faixas: atual.faixas.map((f) => (f.id === id ? { ...f, [campo]: texto } : f)),
        }));

    const usarMinhaLocalizacao = () => {
        if (!("geolocation" in navigator)) {
            toast.error("Este navegador não informa a localização.");

            return;
        }

        setLocalizando(true);
        navigator.geolocation.getCurrentPosition(
            (posicao) => {
                setLocalizando(false);
                moverPino({ lat: posicao.coords.latitude, lng: posicao.coords.longitude });
                toast.success("Pino colocado na sua localização. Confira no mapa antes de salvar.");
            },
            () => {
                setLocalizando(false);
                toast.error("Não foi possível obter a localização. Permita o acesso ou clique no mapa.");
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    const salvar = async () => {
        setTentouSalvar(true);

        if (formInvalido) {
            return;
        }

        setSalvando(true);

        try {
            const nova = await salvarConfiguracaoEntrega({
                endereco: enderecoDigitado(),
                pino: pino.fixado ? pino.posicao : null,
                faixas: form.faixas.map((f) => ({
                    ateKm: parsePreco(f.km.trim()),
                    taxa: parsePreco(f.taxa.trim()),
                })),
            });

            setSalva(nova);
            setForm(paraFormulario(nova));
            setPino(paraPino(nova));
            setLugar(paraLocalidade(nova));
            setBusca("nenhuma");
            setTentouSalvar(false);
            toast.success("Configuração de entrega salva.");
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-2 sm:gap-5 sm:p-4">
            <div className="text-tinta">
                <Typography variant="h5">Taxa de entrega</Typography>

                <Typography variant="subtitle2" className="opacity-60">
                    Endereço da loja e quanto cobrar por distância
                </Typography>
            </div>

            {!salva ? (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-10 shadow-component">
                    {erroCarga ? (
                        <>
                            <p role="alert" className="text-center text-sm text-erro">
                                {erroCarga}
                            </p>
                            <Button
                                text="Tentar novamente"
                                color={ButtonColor.Secondary}
                                onClick={() => {
                                    setErroCarga(null);
                                    setTentativa((t) => t + 1);
                                }}
                            />
                        </>
                    ) : (
                        <CircularProgress aria-label="Carregando configuração" />
                    )}
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <section className="rounded-xl bg-white p-4 text-tinta shadow-component sm:p-6">
                        <h2 className="font-display text-lg font-bold">Configuração</h2>
                        <p className="mt-1 text-sm text-tinta-suave">
                            A distância é medida em linha reta da loja até o endereço do cliente. Vale apenas para
                            pedidos novos. Última alteração: {formatDate(salva.atualizadaEm)}.
                        </p>

                        {!salva.ativa && (
                            <p className="mt-3 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">
                                O cálculo está desligado: os pedidos de entrega saem sem taxa e sem limite de
                                distância. Informe o endereço da loja e as faixas para ligar. Depois de salvo, ele
                                fica ligado.
                            </p>
                        )}

                        <h3 className="mt-5 font-display font-bold">Endereço da loja</h3>
                        {salva.ativa && !salva.endereco && (
                            <p className="mt-2 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">
                                A loja foi configurada só com coordenadas. Informe o endereço para salvar de novo; o
                                pino atual continua valendo.
                            </p>
                        )}
                        <div className="mt-3 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start">
                            <TextField
                                label="CEP"
                                value={form.cep}
                                onChange={(e) => alterarCep(e.target.value)}
                                required
                                fullWidth
                                placeholder="13560-042"
                                error={(tentouSalvar || !!erroCep) && !!errosEndereco.cep}
                                helperText={
                                    (tentouSalvar || erroCep) && errosEndereco.cep
                                        ? errosEndereco.cep
                                        : lugar
                                          ? localidade(lugar)
                                          : undefined
                                }
                                slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 9 } }}
                            />
                            <TextField
                                label="Rua"
                                value={form.rua}
                                onChange={(e) => alterarEndereco("rua", e.target.value)}
                                required
                                fullWidth
                                error={tentouSalvar && !!errosEndereco.rua}
                                helperText={tentouSalvar ? (errosEndereco.rua ?? undefined) : undefined}
                            />
                            <TextField
                                label="Número"
                                value={form.numero}
                                onChange={(e) => alterarEndereco("numero", e.target.value)}
                                required
                                fullWidth
                                error={tentouSalvar && !!errosEndereco.numero}
                                helperText={tentouSalvar ? (errosEndereco.numero ?? undefined) : undefined}
                            />
                            <TextField
                                label="Complemento"
                                value={form.complemento}
                                onChange={(e) => alterarEndereco("complemento", e.target.value)}
                                fullWidth
                                placeholder="Loja 2"
                            />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-display font-bold">Posição no mapa</h3>
                            <Button
                                text={busca === "buscando" ? "Localizando..." : "Localizar no mapa"}
                                color={ButtonColor.Secondary}
                                onClick={busca === "buscando" ? () => undefined : localizar}
                            />
                        </div>
                        <div className="mt-3">
                            <MapaLoja posicao={pino.posicao} onMover={moverPino} />
                        </div>
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-tinta-suave" aria-live="polite">
                            <PlaceOutlined fontSize="small" className="mt-0.5 shrink-0" />
                            <span>
                                {pino.fixado
                                    ? "Pino ajustado à mão: a distância é medida deste ponto."
                                    : busca === "naoAchou"
                                      ? "Não achamos este endereço no mapa. Clique no mapa no lugar da loja ou use a sua localização."
                                      : pino.posicao
                                        ? "Posição achada pelo endereço. Se o pino não estiver na loja, arraste-o ou clique no lugar certo."
                                        : "Clique em Localizar no mapa para conferir a posição. Ao salvar, ela é achada pelo endereço."}
                            </span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <button
                                type="button"
                                onClick={localizando ? undefined : usarMinhaLocalizacao}
                                className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-marca"
                            >
                                {localizando ? <CircularProgress size={16} /> : <MyLocationOutlined fontSize="small" />}
                                Usar minha localização
                            </button>
                            {pino.fixado && (
                                <button
                                    type="button"
                                    onClick={localizar}
                                    className="cursor-pointer font-semibold text-marca"
                                >
                                    Voltar para a posição do endereço
                                </button>
                            )}
                            {linkMapa && (
                                <a href={linkMapa} target="_blank" rel="noreferrer" className="font-semibold text-marca">
                                    Abrir no Google Maps
                                </a>
                            )}
                        </div>

                        <h3 className="mt-6 font-display font-bold">Faixas de distância</h3>
                        <p className="mt-1 text-sm text-tinta-suave">
                            Cada endereço paga a taxa da primeira faixa que o alcança. A maior faixa é o raio de
                            entrega: mais longe que ela, o cliente só pode retirar.
                        </p>

                        <ul className="mt-3 flex flex-col gap-3">
                            {form.faixas.map((faixa, i) => {
                                const erros = tentouSalvar ? errosFaixas[i] : { km: null, taxa: null };

                                return (
                                    <li key={faixa.id} className="flex items-start gap-2">
                                        <TextField
                                            label="Até (km)"
                                            value={faixa.km}
                                            onChange={(e) => alterarFaixa(faixa.id, "km", e.target.value)}
                                            required
                                            fullWidth
                                            error={!!erros.km}
                                            helperText={erros.km ?? undefined}
                                            slotProps={{ htmlInput: { inputMode: "decimal" } }}
                                        />
                                        <TextField
                                            label="Taxa"
                                            value={faixa.taxa}
                                            onChange={(e) => alterarFaixa(faixa.id, "taxa", e.target.value)}
                                            required
                                            fullWidth
                                            error={!!erros.taxa}
                                            helperText={erros.taxa ?? "Use 0 para entrega grátis."}
                                            slotProps={{
                                                htmlInput: { inputMode: "decimal" },
                                                input: {
                                                    startAdornment: (
                                                        <span className="mr-2 text-sm text-tinta-suave">R$</span>
                                                    ),
                                                },
                                            }}
                                        />
                                        <Tooltip title="Remover faixa">
                                            <span>
                                                <IconButton
                                                    aria-label="Remover faixa"
                                                    disabled={form.faixas.length === 1}
                                                    onClick={() =>
                                                        setForm((atual) => ({
                                                            ...atual,
                                                            faixas: atual.faixas.filter((f) => f.id !== faixa.id),
                                                        }))
                                                    }
                                                    sx={{ mt: 1 }}
                                                >
                                                    <DeleteOutlined />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </li>
                                );
                            })}
                        </ul>

                        {form.faixas.length < MAXIMO_FAIXAS && (
                            <button
                                type="button"
                                onClick={() => setForm((atual) => ({ ...atual, faixas: [...atual.faixas, novaFaixa()] }))}
                                className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-marca"
                            >
                                <AddOutlined fontSize="small" />
                                Adicionar faixa
                            </button>
                        )}

                        <div className="mt-6 flex justify-end">
                            <Button
                                text={salvando ? "Salvando..." : "Salvar configuração"}
                                color={ButtonColor.Green}
                                onClick={salvando ? () => undefined : salvar}
                            />
                        </div>
                    </section>

                    <section className="rounded-xl bg-white p-4 text-tinta shadow-component sm:p-6">
                        <h2 className="font-display text-lg font-bold">Como o cliente vê</h2>
                        {previa.length === 0 ? (
                            <p className="mt-2 text-sm text-tinta-suave">Preencha as faixas para ver a tabela.</p>
                        ) : (
                            <>
                                <dl className="mt-3 flex flex-col gap-1.5 text-sm tabular-nums">
                                    {previa.map((f, i) => (
                                        <div key={i} className="flex justify-between gap-3">
                                            <dt className="text-tinta-suave">
                                                {i === 0
                                                    ? `Até ${formatarKm(f.ateKm)}`
                                                    : `De ${formatarKm(previa[i - 1].ateKm)} a ${formatarKm(f.ateKm)}`}
                                            </dt>
                                            <dd className="font-semibold">
                                                {f.taxa === 0 ? "Grátis" : formatCurrency(f.taxa)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <p className="mt-3 border-t border-black/10 pt-3 text-sm">
                                    Raio de entrega: <strong>{formatarKm(previa[previa.length - 1].ateKm)}</strong>
                                </p>
                            </>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
