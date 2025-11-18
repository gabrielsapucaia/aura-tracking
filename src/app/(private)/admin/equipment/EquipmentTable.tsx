"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EquipmentRecord } from "@/lib/supabase/types";
import { type EquipmentFormValues } from "@/lib/validators/equipment";
import { EquipmentFormDialog } from "./EquipmentFormDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, Search } from "lucide-react";

const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type EquipmentRow = EquipmentRecord & {
  equipment_types?: { name: string } | null;
};

type EquipmentActionInput = {
  tag: string;
  type_id: string | null | undefined;
  status: "active" | "inactive";
};

type EquipmentUpdateInput = Partial<EquipmentActionInput>;

type EquipmentTableProps = {
  data: EquipmentRow[];
  onCreate: (input: EquipmentActionInput) => Promise<void>;
  onUpdate: (id: string, input: EquipmentUpdateInput) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; equipment: EquipmentRow };

type PendingAction =
  | { type: "form" }
  | { type: "toggle" | "delete"; id: string };

export function EquipmentTable({ data, onCreate, onUpdate, onToggle, onDelete }: EquipmentTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isRefreshing, startRefresh] = useTransition();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [confirmEquipment, setConfirmEquipment] = useState<EquipmentRow | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, { status: "active" | "inactive"; loading: boolean }>>({});
  const [rows, setRows] = useState<EquipmentRow[]>(data);

  // When server data changes (router.refresh), sync local list while keeping optimistic feel.
  useEffect(() => {
    setRows(data);
  }, [data]);

  // UI state: search/filter/sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"id" | "tag" | "type" | "created_at">("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const didSyncToast = useRef(false);

  const visibleEquipment = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.slice();

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (q.length > 0) {
      list = list.filter((r) => {
        return (
          String(r.id).toLowerCase().includes(q) ||
          (r.tag || "").toLowerCase().includes(q) ||
          (r.equipment_types?.name || "").toLowerCase().includes(q)
        );
      });
    }

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "id") return String(a.id).localeCompare(String(b.id)) * dir;
      if (sortBy === "tag") return a.tag.localeCompare(b.tag) * dir;
      if (sortBy === "type") return (a.equipment_types?.name || "").localeCompare(b.equipment_types?.name || "") * dir;
      if (sortBy === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      return 0;
    });

    return list;
  }, [rows, search, statusFilter, sortBy, sortDir]);

  const isFormLoading = pendingAction?.type === "form";
  const isRowLoading = (id: string, type: "toggle" | "delete") => pendingAction?.type === type && pendingAction.id === id;

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

  const submitForm = async (values: EquipmentFormValues) => {
    setPendingAction({ type: "form" });
    try {
      const payload = {
        ...values,
        type_id: values.type_id === "none" || values.type_id == null ? null : values.type_id,
      };
      if (dialogState?.mode === "edit" && dialogState.equipment) {
        setRows((current) =>
          current.map((item) => (item.id === dialogState.equipment.id ? { ...item, ...payload } : item))
        );
        await onUpdate(dialogState.equipment.id, payload);
        handleSuccess("Equipamento atualizado");
      } else {
        const tempId = `temp-${Date.now()}`;
        setRows((current) => [
          ...current,
          {
            id: tempId,
            tag: payload.tag,
            type_id: payload.type_id,
            status: payload.status,
            equipment_types: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as EquipmentRow,
        ]);
        await onCreate(payload);
        handleSuccess("Equipamento criado");
      }
      setDialogState(null);
    } catch (error) {
      setRows(data); // rollback to server data snapshot on error
      handleError("Falha ao salvar equipamento", error);
      throw error;
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggle = async (equipment: EquipmentRow) => {
    const nextStatus = equipment.status === "active" ? "inactive" : "active";

    // optimistic update
    setOptimistic((s) => ({ ...s, [equipment.id]: { status: nextStatus, loading: true } }));
    setRows((current) => current.map((item) => (item.id === equipment.id ? { ...item, status: nextStatus } : item)));
    setPendingAction({ type: "toggle", id: equipment.id });

    try {
      await onToggle(equipment.id);
      // keep optimistic state but clear loading
      setOptimistic((s) => ({ ...s, [equipment.id]: { status: nextStatus, loading: false } }));
      handleSuccess(nextStatus === "active" ? "Equipamento ativado" : "Equipamento desativado");
      // allow server components to revalidate and then clear optimistic state shortly after
      setTimeout(() => {
        setOptimistic((s) => {
          const copy = { ...s };
          delete copy[equipment.id];
          return copy;
        });
      }, 800);
    } catch (error) {
      // revert optimistic on error
      setOptimistic((s) => {
        const copy = { ...s };
        delete copy[equipment.id];
        return copy;
      });
      setRows(data);
      handleError("Erro ao alternar status", error);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmEquipment) return;
    setPendingAction({ type: "delete", id: confirmEquipment.id });
    setRows((current) => current.filter((item) => item.id !== confirmEquipment.id));
    try {
      await onDelete(confirmEquipment.id);
      handleSuccess("Equipamento removido");
      setConfirmEquipment(null);
    } catch (error) {
      setRows(data);
      handleError("Erro ao remover equipamento", error);
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
            aria-label="Pesquisar equipamentos"
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
                className="w-16 cursor-pointer text-center"
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
                  if (sortBy === "tag") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else {
                    setSortBy("tag");
                    setSortDir("asc");
                  }
                }}
              >
                Tag {sortBy === "tag" ? (sortDir === "asc" ? "▲" : "▼") : null}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  if (sortBy === "type") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else {
                    setSortBy("type");
                    setSortDir("asc");
                  }
                }}
              >
                Tipo {sortBy === "type" ? (sortDir === "asc" ? "▲" : "▼") : null}
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
            {visibleEquipment.map((equipment) => (
              <TableRow key={equipment.id} className="border-gray-100">
                <TableCell className="text-center font-semibold text-gray-800">{equipment.id}</TableCell>
                <TableCell className="text-center">
                  {(() => {
                    const opt = optimistic[equipment.id];
                    const displayStatus = opt ? opt.status : equipment.status;
                    const loading = Boolean(opt?.loading) || isRowLoading(equipment.id, "toggle");

                    return (
                      <button
                        role="switch"
                        aria-checked={displayStatus === "active"}
                        tabIndex={0}
                        aria-label={displayStatus === "active" ? "Desativar" : "Ativar"}
                        onClick={() => handleToggle(equipment)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggle(equipment);
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
                <TableCell className="text-gray-800">{equipment.tag}</TableCell>
                <TableCell className="text-gray-700">{equipment.equipment_types?.name || "—"}</TableCell>
                <TableCell className="text-gray-500">
                  {equipment.created_at ? formatter.format(new Date(equipment.created_at)) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Editar"
                      onClick={() => setDialogState({ mode: "edit", equipment })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      aria-label="Excluir"
                      disabled={isRowLoading(equipment.id, "delete")}
                      onClick={() => setConfirmEquipment(equipment)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {visibleEquipment.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-gray-400">
                  Nenhum equipamento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EquipmentFormDialog
        open={dialogState !== null}
        mode={dialogState?.mode ?? "create"}
        initialValues={dialogState && dialogState.mode === "edit" ? dialogState.equipment : undefined}
        onOpenChange={(open: boolean) => {
          if (!open) setDialogState(null);
        }}
        loading={isFormLoading}
        onSubmit={submitForm}
      />

      <ConfirmDialog
        open={confirmEquipment !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setConfirmEquipment(null);
        }}
        title="Remover equipamento?"
        description={`Essa ação removerá ${confirmEquipment?.tag ?? "o equipamento"}.`}
        confirmLabel="Excluir"
        loading={confirmEquipment ? isRowLoading(confirmEquipment.id, "delete") : false}
        onConfirm={handleDelete}
      />
    </div>
  );
}
