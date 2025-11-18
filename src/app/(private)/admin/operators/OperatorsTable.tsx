"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OperatorRecord } from "@/lib/supabase/types";
import { type OperatorFormValues } from "@/lib/validators/operators";
import { OperatorFormDialog } from "./OperatorFormDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, Search } from "lucide-react";

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
  const [isRefreshing, startRefresh] = useTransition();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [confirmOperator, setConfirmOperator] = useState<OperatorRow | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [optimistic, setOptimistic] = useState<Record<number, { status: "active" | "inactive"; loading: boolean }>>({});
  const [rows, setRows] = useState<OperatorRow[]>(data);

  useEffect(() => {
    setRows(data);
  }, [data]);

  // UI state: search/filter/sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"id" | "name" | "pin" | "created_at">("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const didSyncToast = useRef(false);

  const visibleOperators = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.slice();

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
      if (sortBy === "id") return (a.id - b.id) * dir;
      if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
      if (sortBy === "pin") return a.pin.localeCompare(b.pin) * dir;
      if (sortBy === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      return 0;
    });

    return list;
  }, [rows, search, statusFilter, sortBy, sortDir]);

  const isFormLoading = pendingAction?.type === "form";
  const isRowLoading = (id: number, type: "toggle" | "delete") => pendingAction?.type === type && pendingAction.id === id;

  const handleSuccess = (message: string) => {
    toast({ title: message });
    if (!didSyncToast.current) {
      toast({ title: "Sincronizando...", duration: 1200 });
      didSyncToast.current = true;
    }
    startRefresh(() => router.refresh());
    setTimeout(() => {
      didSyncToast.current = false;
    }, 1500);
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
        setRows((current) =>
          current.map((item) => (item.id === dialogState.operator.id ? { ...item, ...values } : item))
        );
        await onUpdate(dialogState.operator.id, values);
        handleSuccess("Operador atualizado");
      } else {
        const tempId = Date.now();
        setRows((current) => [
          ...current,
          {
            id: tempId,
            name: values.name,
            pin: values.pin,
            status: values.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            seq_id: (current[current.length - 1]?.seq_id ?? 0) + 1,
          } as OperatorRow,
        ]);
        await onCreate(values);
        handleSuccess("Operador criado");
      }
      setDialogState(null);
    } catch (error) {
      setRows(data);
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
    setRows((current) => current.map((item) => (item.id === operator.id ? { ...item, status: nextStatus } : item)));
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
      setRows(data);
      handleError("Erro ao alternar status", error);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmOperator) return;
    setPendingAction({ type: "delete", id: confirmOperator.id });
    setRows((current) => current.filter((item) => item.id !== confirmOperator.id));
    try {
      await onDelete(confirmOperator.id);
      handleSuccess("Operador removido");
      setConfirmOperator(null);
    } catch (error) {
      setRows(data);
      handleError("Erro ao remover operador", error);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setDialogState({ mode: "create" })} size="sm" className="h-10 bg-primary px-4 text-white hover:bg-primary/90">
          <Plus className="mr-2 size-4" /> Novo item
        </Button>
        <select
          aria-label="Filtrar status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition hover:bg-white focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-accent/20"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            aria-label="Pesquisar operadores"
            placeholder="Pesquise por qualquer palavra"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 min-w-[260px] rounded-md border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table aria-busy={Boolean(pendingAction) || isRefreshing} className="[&_tbody_tr:hover]:bg-gray-50/50">
          <TableHeader>
            <TableRow className="bg-gray-50 text-[11px] uppercase tracking-[0.2em] text-gray-500">
              <TableHead
                className="w-12 cursor-pointer text-center"
                onClick={() => {
                  if (sortBy === "id") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else {
                    setSortBy("id");
                    setSortDir("asc");
                  }
                }}
              >
                ID {sortBy === "id" ? (sortDir === "asc" ? "▲" : "▼") : null}
              </TableHead>
              <TableHead className="w-32 text-center">Status</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  if (sortBy === "name") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else {
                    setSortBy("name");
                    setSortDir("asc");
                  }
                }}
              >
                Nome {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : null}
              </TableHead>
              <TableHead
                className="w-28 cursor-pointer text-center"
                onClick={() => {
                  if (sortBy === "pin") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else {
                    setSortBy("pin");
                    setSortDir("asc");
                  }
                }}
              >
                PIN {sortBy === "pin" ? (sortDir === "asc" ? "▲" : "▼") : null}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  if (sortBy === "created_at") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else {
                    setSortBy("created_at");
                    setSortDir("asc");
                  }
                }}
              >
                Criado em {sortBy === "created_at" ? (sortDir === "asc" ? "▲" : "▼") : null}
              </TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleOperators.map((operator) => (
              <TableRow key={operator.id} className="border-gray-100">
                <TableCell className="text-center font-semibold text-gray-800">{operator.id}</TableCell>
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
                        className={`relative inline-flex items-center gap-3 rounded-full px-3 py-1 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/30 ${
                          displayStatus === "active"
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        <span className="relative flex items-center">
                          <span
                            className={`inline-block h-5 w-9 rounded-full transition-colors duration-200 ${
                              displayStatus === "active" ? "bg-emerald-400" : "bg-red-300"
                            }`}
                          />
                          <span
                            className={`absolute left-0 top-1/2 -translate-y-1/2 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                              displayStatus === "active" ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </span>

                        <span className="sr-only">{displayStatus === "active" ? "Ativo" : "Inativo"}</span>

                        <span className="ml-1 text-xs font-medium" aria-live="polite">
                          {loading ? (
                            <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                <TableCell className="text-gray-800">{operator.name}</TableCell>
                <TableCell className="text-center font-mono text-sm text-gray-900">{operator.pin}</TableCell>
                <TableCell className="text-gray-500">
                  {operator.created_at ? formatter.format(new Date(operator.created_at)) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Editar"
                      onClick={() => setDialogState({ mode: "edit", operator })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
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
            {visibleOperators.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-gray-400">
                  Nenhum operador encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  );
}
