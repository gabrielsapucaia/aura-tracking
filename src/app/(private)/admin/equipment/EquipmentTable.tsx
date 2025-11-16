"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EquipmentRecord } from "@/lib/supabase/types";
import { type EquipmentFormValues } from "@/lib/validators/equipment";
import { EquipmentFormDialog } from "./EquipmentFormDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [confirmEquipment, setConfirmEquipment] = useState<EquipmentRow | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, { status: "active" | "inactive"; loading: boolean }>>({});

  // UI state: search/filter/sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"seq_id" | "tag" | "created_at">("seq_id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visibleEquipment = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = data.slice();

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
      if (sortBy === "seq_id") return ((a.seq_id ?? 0) - (b.seq_id ?? 0)) * dir;
      if (sortBy === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      return a.tag.localeCompare(b.tag) * dir;
    });

    return list;
  }, [data, search, statusFilter, sortBy, sortDir]);

  const isFormLoading = pendingAction?.type === "form";
  const isRowLoading = (id: string, type: "toggle" | "delete") => pendingAction?.type === type && pendingAction.id === id;

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

  const submitForm = async (values: EquipmentFormValues) => {
    setPendingAction({ type: "form" });
    try {
      const payload = {
        ...values,
        type_id: values.type_id === "none" ? null : values.type_id,
      };
      if (dialogState?.mode === "edit" && dialogState.equipment) {
        await onUpdate(dialogState.equipment.id, payload);
        handleSuccess("Equipamento atualizado");
      } else {
        await onCreate(payload);
        handleSuccess("Equipamento criado");
      }
      setDialogState(null);
    } catch (error) {
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
      handleError("Erro ao alternar status", error);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmEquipment) return;
    setPendingAction({ type: "delete", id: confirmEquipment.id });
    try {
      await onDelete(confirmEquipment.id);
      handleSuccess("Equipamento removido");
      setConfirmEquipment(null);
    } catch (error) {
      handleError("Erro ao remover equipamento", error);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      <Card className="rounded-xl border border-gray-100 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Equipamentos</p>
            <CardTitle className="text-xl font-semibold text-gray-900">Lista de Equipamentos</CardTitle>
          </div>
            <div className="flex items-center gap-3">
              <input
                aria-label="Pesquisar equipamentos"
                placeholder="Pesquisar por tag, id ou tipo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              <select
                aria-label="Filtrar status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                className="px-2 py-2 border rounded-md text-sm"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <Button onClick={() => setDialogState({ mode: "create" })} size="sm">
                <Plus className="mr-2 size-4" /> Novo equipamento
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
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="cursor-pointer" onClick={() => {
                    if (sortBy === 'tag') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('tag'); setSortDir('asc'); }
                  }}>
                  Tag {sortBy === 'tag' ? (sortDir === 'asc' ? '▲' : '▼') : null}
                </TableHead>
                <TableHead>Tipo</TableHead>
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
              {visibleEquipment.map((equipment) => (
                <TableRow key={equipment.id} className="border-gray-100">
                  <TableCell className="font-semibold text-gray-800">{equipment.seq_id ?? "—"}</TableCell>
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
                  <TableCell className="text-gray-700">{equipment.tag}</TableCell>
                  <TableCell className="text-gray-700">{equipment.equipment_types?.name || "—"}</TableCell>
                  <TableCell className="text-gray-500">
                    {equipment.created_at ? formatter.format(new Date(equipment.created_at)) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Editar"
                        onClick={() => setDialogState({ mode: "edit", equipment })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger"
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
        </CardContent>
      </Card>

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
    </>
  );
}