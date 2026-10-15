"use client";

import { useState } from "react";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";

import Button from "@/src/components/button/Button";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import DependentesLista from "@/src/components/dialog/DependentesLista";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { mensagemDeErro } from "@/src/lib/http";
import {
    alterarStatusProduto,
    atualizarProduto,
    buscarDependentesProduto,
    criarProduto,
    excluirProduto,
    type Produto,
    type ProdutoDependentes,
    type ProdutoInput,
} from "@/src/services/produtos";

import ProdutosDialog from "./ProdutosDialog";
import ProdutosTable from "./components/ProdutosTable";

type Acao =
    | { tipo: "status"; produto: Produto }
    | { tipo: "excluir"; produto: Produto };

interface DependentesState {
    produtoId: number;
    dados: ProdutoDependentes | null;
    erro: boolean;
}

export default function ProdutosCore() {
    const toast = useToast();

    const [reloadKey, setReloadKey] = useState(0);

    const [dialogAberto, setDialogAberto] = useState(false);
    const [editando, setEditando] = useState<Produto | null>(null);

    const [acao, setAcao] = useState<Acao | null>(null);
    const [executando, setExecutando] = useState(false);
    const [dependentes, setDependentes] = useState<DependentesState | null>(null);

    const recarregar = () => setReloadKey((atual) => atual + 1);

    const abrirCriar = () => {
        setEditando(null);
        setDialogAberto(true);
    };

    const abrirEditar = (produto: Produto) => {
        setEditando(produto);
        setDialogAberto(true);
    };

    const handleSalvar = async (input: ProdutoInput): Promise<boolean> => {
        try {
            if (editando) {
                await atualizarProduto(editando, input);
                toast.success("Produto atualizado.");
            } else {
                await criarProduto(input);
                toast.success("Produto criado.");
            }

            setDialogAberto(false);
            recarregar();

            return true;
        } catch (erro) {
            if (editando) {
                // A edição é feita em várias chamadas: parte delas pode já ter sido aplicada.
                // Fecha o formulário e recarrega, para não editar em cima de dados desatualizados.
                toast.error(
                    `${mensagemDeErro(erro)} Algumas alterações podem ter sido aplicadas: confira o produto na lista.`
                );
                setDialogAberto(false);
                recarregar();

                return true;
            }

            // A criação é atômica no backend: nada foi salvo, o formulário continua aberto.
            toast.error(mensagemDeErro(erro));

            return false;
        }
    };

    const pedirAlterarStatus = (produto: Produto) => {
        setAcao({ tipo: "status", produto });
        setDependentes(null);

        // Só vale a pena listar dependentes ao inativar.
        if (produto.status !== "ACTIVE") {
            return;
        }

        buscarDependentesProduto(produto.id)
            .then((dados) =>
                setDependentes({ produtoId: produto.id, dados, erro: false })
            )
            .catch(() =>
                setDependentes({ produtoId: produto.id, dados: null, erro: true })
            );
    };

    const pedirExcluir = (produto: Produto) => {
        setAcao({ tipo: "excluir", produto });
    };

    const cancelarAcao = () => {
        setAcao(null);
        setDependentes(null);
    };

    const confirmarAcao = async () => {
        if (!acao) {
            return;
        }

        setExecutando(true);

        try {
            if (acao.tipo === "status") {
                const novoStatus =
                    acao.produto.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

                await alterarStatusProduto(acao.produto, novoStatus);

                toast.success(
                    novoStatus === "INACTIVE"
                        ? "Produto inativado."
                        : "Produto ativado."
                );
            } else {
                await excluirProduto(acao.produto.id);
                toast.success("Produto excluído.");
            }

            cancelarAcao();
            recarregar();
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
            cancelarAcao();
            recarregar();
        } finally {
            setExecutando(false);
        }
    };

    const inativando =
        acao?.tipo === "status" && acao.produto.status === "ACTIVE";

    const dependentesDoAlvo =
        acao && dependentes?.produtoId === acao.produto.id ? dependentes : null;

    return (
        <div className="flex flex-col gap-4 p-2 sm:gap-5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-black">
                    <Typography variant="h5">Produtos</Typography>

                    <Typography variant="subtitle2" className="opacity-60">
                        Gerencie os produtos da loja
                    </Typography>
                </div>

                <div className="text-black sm:shrink-0">
                    <Button text="Novo produto" icon={Add} onClick={abrirCriar} />
                </div>
            </div>

            <div className="mb-2">
                <ProdutosTable
                    reloadKey={reloadKey}
                    onEditar={abrirEditar}
                    onAlterarStatus={pedirAlterarStatus}
                    onExcluir={pedirExcluir}
                />
            </div>

            <ProdutosDialog
                open={dialogAberto}
                produto={editando}
                onClose={() => setDialogAberto(false)}
                onSave={handleSalvar}
            />

            <ConfirmDialog
                open={acao !== null}
                title={
                    acao?.tipo === "excluir"
                        ? "Excluir produto"
                        : inativando
                          ? "Inativar produto"
                          : "Ativar produto"
                }
                confirmText={acao?.tipo === "excluir" ? "Excluir" : "Confirmar"}
                danger={acao?.tipo === "excluir"}
                loading={executando}
                onConfirm={confirmarAcao}
                onCancel={cancelarAcao}
            >
                {acao?.tipo === "excluir" && (
                    <p>
                        Excluir o produto <strong>{acao.produto.name}</strong>?
                        Essa ação não pode ser desfeita. Se ele estiver em algum
                        combo ou promoção, a exclusão será recusada.
                    </p>
                )}

                {acao?.tipo === "status" && (
                    <>
                        <p>
                            {inativando ? "Inativar" : "Ativar"}{" "}
                            <strong>{acao.produto.name}</strong>?
                        </p>

                        {inativando && (
                            <DependentesLista
                                carregando={dependentesDoAlvo === null}
                                erro={dependentesDoAlvo?.erro ?? false}
                                grupos={[
                                    {
                                        titulo: "Combos que incluem este produto",
                                        itens: dependentesDoAlvo?.dados?.combos ?? [],
                                    },
                                    {
                                        titulo: "Promoções deste produto",
                                        itens: dependentesDoAlvo?.dados?.promocoes ?? [],
                                    },
                                ]}
                            />
                        )}
                    </>
                )}
            </ConfirmDialog>
        </div>
    );
}
