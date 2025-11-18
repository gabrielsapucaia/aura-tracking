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
import type { MaterialTypeRecord } from "@/lib/supabase/types";
import { materialTypeFormSchema, type MaterialTypeFormValues } from "@/lib/validators/material_types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type MaterialTypeFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: MaterialTypeRecord;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MaterialTypeFormValues) => Promise<void>;
};

const defaultValues: MaterialTypeFormValues = {
  name: "",
  description: "",
  status: "active",
};

export function MaterialTypeFormDialog({
  open,
  mode,
  initialValues,
  loading = false,
  onOpenChange,
  onSubmit,
}: MaterialTypeFormDialogProps) {
  const form = useForm<MaterialTypeFormValues>({
    resolver: zodResolver(materialTypeFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialValues
          ? {
              name: initialValues.name,
              description: initialValues.description || "",
              status: initialValues.status,
            }
          : defaultValues,
      );
    }
  }, [form, initialValues, open]);

  const title = mode === "create" ? "Adicionar tipo de material" : "Editar tipo de material";
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
                  <FormLabel>Tipo Material</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aço Inox" {...field} disabled={loading} />
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
                  <FormLabel>Descritivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição opcional" {...field} disabled={loading} />
                  </FormControl>
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