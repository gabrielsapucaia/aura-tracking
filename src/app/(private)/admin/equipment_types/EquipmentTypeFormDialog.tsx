"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EquipmentTypeRecord } from "@/lib/supabase/types";
import { equipmentTypeFormSchema, type EquipmentTypeFormValues } from "@/lib/validators/equipment_types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type EquipmentTypeFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: EquipmentTypeRecord;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EquipmentTypeFormValues) => Promise<void>;
};

const defaultValues: EquipmentTypeFormValues = {
  name: "",
  description: "",
};

export function EquipmentTypeFormDialog({
  open,
  mode,
  initialValues,
  loading = false,
  onOpenChange,
  onSubmit,
}: EquipmentTypeFormDialogProps) {
  const form = useForm<EquipmentTypeFormValues>({
    resolver: zodResolver(equipmentTypeFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialValues
          ? {
              name: initialValues.name,
              description: initialValues.description || "",
            }
          : defaultValues,
      );
    }
  }, [form, initialValues, open]);

  const title = mode === "create" ? "Adicionar tipo de equipamento" : "Editar tipo de equipamento";
  const actionLabel = mode === "create" ? "Criar" : "Salvar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Máquina de Solda" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição opcional" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : actionLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}