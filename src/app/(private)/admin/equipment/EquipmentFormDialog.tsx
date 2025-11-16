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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EquipmentRecord, EquipmentTypeRecord } from "@/lib/supabase/types";
import { equipmentFormSchema, type EquipmentFormValues } from "@/lib/validators/equipment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type EquipmentFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: EquipmentRecord;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EquipmentFormValues) => Promise<void>;
};

const defaultValues: EquipmentFormValues = {
  tag: "",
  type_id: "none",
  status: "active",
};

export function EquipmentFormDialog({
  open,
  mode,
  initialValues,
  loading = false,
  onOpenChange,
  onSubmit,
}: EquipmentFormDialogProps) {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeRecord[]>([]);
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      // Fetch equipment types
      fetch('/api/equipment-types')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch equipment types');
          return res.json();
        })
        .then(data => setEquipmentTypes(data))
        .catch(err => {
          console.error('Error fetching equipment types:', err);
          setEquipmentTypes([]); // Set empty array on error
        });

      form.reset(
        initialValues
          ? {
              tag: initialValues.tag,
              type_id: initialValues.type_id || "none",
              status: initialValues.status,
            }
          : defaultValues,
      );
    }
  }, [form, initialValues, open]);

  const title = mode === "create" ? "Adicionar equipamento" : "Editar equipamento";
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
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: TAG001" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Equipamento</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === "none" ? null : value)} value={field.value || "none"} disabled={loading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        Nenhum tipo selecionado
                      </SelectItem>
                      {equipmentTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
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