"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EquipmentTypeRecord } from "@/lib/supabase/types";
import { type EquipmentTypeFormValues } from "@/lib/validators/equipment_types";
import { EquipmentTypeFormDialog } from "./EquipmentTypeFormDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type EquipmentTypeRow = EquipmentTypeRecord;

type EquipmentTypeActionInput = {
  name: string;
  description?: string;
};

type EquipmentTypeUpdateInput = Partial<EquipmentTypeActionInput>;

type EquipmentTypesTableProps = {
  data: EquipmentTypeRow[];
  onCreate: (input: EquipmentTypeActionInput) => Promise<void>;
  onUpdate: (id: string | number, input: EquipmentTypeUpdateInput) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
};

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; equipmentType: EquipmentTypeRow };

type PendingAction =
  | { type: "form" }
  | { type: "delete"; id: string | number };

export function EquipmentTypesTable({ data, onCreate, onUpdate, onDelete }: EquipmentTypesTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [confirmEquipmentType, setConfirmEquipmentType] = useState<EquipmentTypeRow | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // UI state: search/filter/sort
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visibleEquipmentTypes = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = data.slice();

    if (q.length > 0) {
      list = list.filter((r) => {
        return (
          r.name.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
        );
      });
    }

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      return a.name.localeCompare(b.name) * dir;
    });

    return list;
  }, [data, search, sortBy, sortDir]);

  const isFormLoading = pendingAction?.type === "form";
  const isRowLoading = (id: string | number, type: "delete") => pendingAction?.type === type && pendingAction.id === id;

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

  const submitForm = async (values: EquipmentTypeFormValues) => {
    setPendingAction({ type: "form" });
    try {
      if (dialogState?.mode === "edit" && dialogState.equipmentType) {
        await onUpdate(dialogState.equipmentType.id, values);
        handleSuccess("Tipo de equipamento atualizado");
      } else {
        await onCreate(values);
        handleSuccess("Tipo de equipamento criado");
      }
      setDialogState(null);
    } catch (error) {
      handleError("Falha ao salvar tipo de equipamento", error);
      throw error;
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmEquipmentType) return;
    setPendingAction({ type: "delete", id: confirmEquipmentType.id });
    try {
      await onDelete(confirmEquipmentType.id);
      handleSuccess("Tipo de equipamento removido");
      setConfirmEquipmentType(null);
    } catch (error) {
      handleError("Erro ao remover tipo de equipamento", error);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      <Card className="rounded-xl border border-gray-100 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Tipos de Equipamento</p>
            <CardTitle className="text-xl font-semibold text-gray-900">Lista de Tipos</CardTitle>
          </div>
            <div className="flex items-center gap-3">
              <input
                aria-label="Pesquisar tipos de equipamento"
                placeholder="Pesquisar por nome ou descrição"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              <Button onClick={() => setDialogState({ mode: "create" })} size="sm">
                <Plus className="mr-2 size-4" /> Novo tipo
              </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow className="bg-gray-50/80 text-xs uppercase tracking-widest text-gray-500">
                <TableHead className="cursor-pointer" onClick={() => {
                    if (sortBy === 'name') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('name'); setSortDir('asc'); }
                  }}>
                  Nome {sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : null}
                </TableHead>
                <TableHead>Descrição</TableHead>
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
              {visibleEquipmentTypes.map((equipmentType) => (
                <TableRow key={String(equipmentType.id)} className="border-gray-100">
                  <TableCell className="font-semibold text-gray-800">{equipmentType.name}</TableCell>
                  <TableCell className="text-gray-700">{equipmentType.description || "—"}</TableCell>
                  <TableCell className="text-gray-500">
                    {equipmentType.created_at ? formatter.format(new Date(equipmentType.created_at)) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Editar"
                        onClick={() => setDialogState({ mode: "edit", equipmentType })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger"
                        aria-label="Excluir"
                        disabled={isRowLoading(String(equipmentType.id), "delete")}
                        onClick={() => setConfirmEquipmentType(equipmentType)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {visibleEquipmentTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-gray-400">
                    Nenhum tipo de equipamento encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EquipmentTypeFormDialog
        open={dialogState !== null}
        mode={dialogState?.mode ?? "create"}
        initialValues={dialogState && dialogState.mode === "edit" ? dialogState.equipmentType : undefined}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        loading={isFormLoading}
        onSubmit={submitForm}
      />

      <ConfirmDialog
        open={confirmEquipmentType !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmEquipmentType(null);
        }}
        title="Remover tipo de equipamento?"
        description={`Essa ação removerá ${confirmEquipmentType?.name ?? "o tipo de equipamento"}.`}
        confirmLabel="Excluir"
        loading={confirmEquipmentType ? isRowLoading(confirmEquipmentType.id, "delete") : false}
        onConfirm={handleDelete}
      />
    </>
  );
}