"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OperatorRecord } from "@/lib/supabase/types";
import { type OperatorFormValues } from "@/lib/validators/operators";
import { OperatorFormDialog } from "./OperatorFormDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type OperatorRow = OperatorRecord;

type OperatorActionInput = {
  name: string;
  pin: string;
  status: "active" | "inactive";
};

type OperatorUpdateInput = Partial<OperatorActionInput>;

type OperatorsTableProps = {
  data: OperatorRow[];
  onCreate: (input: OperatorActionInput) => Promise<void>;
  onUpdate: (id: number, input: OperatorUpdateInput) => Promise<void>;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; operator: OperatorRow };

type PendingAction =
  | { type: "form" }
  | { type: "toggle" | "delete"; id: number };

export function OperatorsTable({ data, onCreate, onUpdate, onToggle, onDelete }: OperatorsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [confirmOperator, setConfirmOperator] = useState<OperatorRow | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [optimistic, setOptimistic] = useState<Record<number, { status: "active" | "inactive"; loading: boolean }>>({});

  const sortedOperators = useMemo(
    () => data.slice().sort((a, b) => (a.seq_id ?? 0) - (b.seq_id ?? 0)),
    [data],
  );

  // UI state: search/filter/sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"seq_id" | "name" | "created_at">("seq_id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visibleOperators = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = data.slice();

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (q.length > 0) {
      list = list.filter((r) => {
        return (
          String(r.id).toLowerCase().includes(q) ||
          (r.name || "").toLowerCase().includes(q) ||
          (r.pin || "").toLowerCase().includes(q)
        );
      });
    }

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "seq_id") return ((a.seq_id ?? 0) - (b.seq_id ?? 0)) * dir;
      if (sortBy === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      return a.name.localeCompare(b.name) * dir;
    });

    return list;
  }, [data, search, statusFilter, sortBy, sortDir]);

  const isFormLoading = pendingAction?.type === "form";
  const isRowLoading = (id: number, type: "toggle" | "delete") => pendingAction?.type === type && pendingAction.id === id;

  const handleSuccess = (message: string) => {
    toast({ title: message });
    router.refresh();
  };

  const handleError = (message: string, error: unknown) => {
    toast({
      variant: "destructive",
      title: message,
      description: error instanceof Error ? error.message : "Tente novamente",
    });
  };

  const submitForm = async (values: OperatorFormValues) => {
    setPendingAction({ type: "form" });
    try {
      if (dialogState?.mode === "edit" && dialogState.operator) {
        await onUpdate(dialogState.operator.id, values);
        handleSuccess("Operador atualizado");
      } else {
        await onCreate(values);
        handleSuccess("Operador criado");
      }
      setDialogState(null);
    } catch (error) {
      handleError("Falha ao salvar operador", error);
      throw error;
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggle = async (operator: OperatorRow) => {
    const nextStatus = operator.status === "active" ? "inactive" : "active";

    // optimistic update
    setOptimistic((s) => ({ ...s, [operator.id]: { status: nextStatus, loading: true } }));
    setPendingAction({ type: "toggle", id: operator.id });

    try {
      await onToggle(operator.id);
      // keep optimistic state but clear loading
      setOptimistic((s) => ({ ...s, [operator.id]: { status: nextStatus, loading: false } }));
      handleSuccess(nextStatus === "active" ? "Operador ativado" : "Operador desativado");
      // allow server components to revalidate and then clear optimistic state shortly after
      setTimeout(() => {
        setOptimistic((s) => {
          const copy = { ...s };
          delete copy[operator.id];
          return copy;
        });
      }, 800);
    } catch (error) {
      // revert optimistic on error
      setOptimistic((s) => {
        const copy = { ...s };
        delete copy[operator.id];
        return copy;
      });
      handleError("Erro ao alternar status", error);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmOperator) return;
    setPendingAction({ type: "delete", id: confirmOperator.id });
    try {
      await onDelete(confirmOperator.id);
      handleSuccess("Operador removido");
      setConfirmOperator(null);
    } catch (error) {
      handleError("Erro ao remover operador", error);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      <Card className="rounded-xl border border-gray-100 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Operadores</p>
            <CardTitle className="text-xl font-semibold text-gray-900">Equipe atual</CardTitle>
          </div>
            <div className="flex items-center gap-3">
              <input
                aria-label="Pesquisar operadores"
                placeholder="Pesquisar por nome, id ou PIN"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              <select
                aria-label="Filtrar status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2 py-2 border rounded-md text-sm"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <Button onClick={() => setDialogState({ mode: "create" })} size="sm">
                <Plus className="mr-2 size-4" /> Novo operador
              </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow className="bg-gray-50/80 text-xs uppercase tracking-widest text-gray-500">
                <TableHead className="cursor-pointer" onClick={() => {
                    if (sortBy === 'seq_id') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('seq_id'); setSortDir('asc'); }
                  }}>
                  # {sortBy === 'seq_id' ? (sortDir === 'asc' ? '▲' : '▼') : null}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => {
                    if (sortBy === 'name') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('name'); setSortDir('asc'); }
                  }}>
                  Nome {sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : null}
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">PIN</TableHead>
                <TableHead className="cursor-pointer" onClick={() => {
                    if (sortBy === 'created_at') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('created_at'); setSortDir('asc'); }
                  }}>
                  Criado em {sortBy === 'created_at' ? (sortDir === 'asc' ? '▲' : '▼') : null}
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOperators.map((operator) => (
                <TableRow key={operator.id} className="border-gray-100">
                  <TableCell className="font-semibold text-gray-800">{operator.seq_id ?? "—"}</TableCell>
                  <TableCell className="text-gray-700">{operator.name}</TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const opt = optimistic[operator.id];
                      const displayStatus = opt ? opt.status : operator.status;
                      const loading = Boolean(opt?.loading) || isRowLoading(operator.id, "toggle");

                      return (
                        <button
                          role="switch"
                          aria-checked={displayStatus === "active"}
                          tabIndex={0}
                          aria-label={displayStatus === "active" ? "Desativar" : "Ativar"}
                          onClick={() => handleToggle(operator)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleToggle(operator);
                            }
                          }}
                          disabled={loading}
                          className={`relative inline-flex items-center gap-3 px-3 py-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            displayStatus === "active"
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <span className="relative flex items-center">
                            <span
                              className={`inline-block w-9 h-5 rounded-full transition-colors duration-200 ${
                                displayStatus === "active" ? "bg-green-300" : "bg-red-300"
                              }`}
                            />
                            <span
                              className={`absolute left-0 top-1/2 -translate-y-1/2 inline-block bg-white rounded-full w-4 h-4 shadow transform transition-transform duration-200 ${
                                displayStatus === "active" ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </span>

                          <span className="sr-only">{displayStatus === "active" ? "Ativo" : "Inativo"}</span>

                          <span className="ml-2 text-xs font-medium" aria-live="polite">
                            {loading ? (
                              <svg className="animate-spin w-4 h-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                            ) : (
                              <span>{displayStatus === "active" ? "Ativo" : "Inativo"}</span>
                            )}
                          </span>
                        </button>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-gray-900">{operator.pin}</TableCell>
                  <TableCell className="text-gray-500">
                    {operator.created_at ? formatter.format(new Date(operator.created_at)) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Editar"
                        onClick={() => setDialogState({ mode: "edit", operator })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger"
                        aria-label="Excluir"
                        disabled={isRowLoading(operator.id, "delete")}
                        onClick={() => setConfirmOperator(operator)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedOperators.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    Nenhum operador cadastrado ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <OperatorFormDialog
        open={dialogState !== null}
        mode={dialogState?.mode ?? "create"}
        initialValues={dialogState && dialogState.mode === "edit" ? dialogState.operator : undefined}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        loading={isFormLoading}
        onSubmit={submitForm}
      />

      <ConfirmDialog
        open={confirmOperator !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmOperator(null);
        }}
        title="Remover operador?"
        description={`Essa ação removerá ${confirmOperator?.name ?? "o operador"}.`}
        confirmLabel="Excluir"
        loading={confirmOperator ? isRowLoading(confirmOperator.id, "delete") : false}
        onConfirm={handleDelete}
      />
    </>
  );
}
