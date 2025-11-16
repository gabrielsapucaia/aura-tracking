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
import { Pencil, Plus, Trash2, Power } from "lucide-react";

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

  const sortedOperators = useMemo(
    () => data.slice().sort((a, b) => (a.seq_id ?? 0) - (b.seq_id ?? 0)),
    [data],
  );

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
    setPendingAction({ type: "toggle", id: operator.id });
    try {
      await onToggle(operator.id);
      handleSuccess(
        operator.status === "active" ? "Operador desativado" : "Operador ativado",
      );
    } catch (error) {
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
          <Button onClick={() => setDialogState({ mode: "create" })} size="sm">
            <Plus className="mr-2 size-4" /> Novo operador
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 text-xs uppercase tracking-widest text-gray-500">
                <TableHead>#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">PIN</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOperators.map((operator) => (
                <TableRow key={operator.id} className="border-gray-100">
                  <TableCell className="font-semibold text-gray-800">{operator.seq_id ?? "—"}</TableCell>
                  <TableCell className="text-gray-700">{operator.name}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge
                      status={operator.status}
                      label={operator.status === "active" ? "Ativo" : "Inativo"}
                    />
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-gray-900">{operator.pin}</TableCell>
                  <TableCell className="text-gray-500">
                    {operator.created_at ? formatter.format(new Date(operator.created_at)) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={operator.status === "active" ? "Desativar" : "Ativar"}
                        disabled={isRowLoading(operator.id, "toggle")}
                        onClick={() => handleToggle(operator)}
                      >
                        <Power className="size-4" />
                      </Button>
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
