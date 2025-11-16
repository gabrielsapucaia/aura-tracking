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
import type { OperatorRecord } from "@/lib/supabase/types";
import { operatorFormSchema, type OperatorFormValues } from "@/lib/validators/operators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type OperatorFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: OperatorRecord;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperatorFormValues) => Promise<void>;
};

const defaultValues: OperatorFormValues = {
  name: "",
  pin: "",
  status: "active",
};

export function OperatorFormDialog({
  open,
  mode,
  initialValues,
  loading = false,
  onOpenChange,
  onSubmit,
}: OperatorFormDialogProps) {
  const form = useForm<OperatorFormValues>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialValues
          ? {
              name: initialValues.name,
              pin: initialValues.pin,
              status: initialValues.status,
            }
          : defaultValues,
      );
    }
  }, [form, initialValues, open]);

  const title = mode === "create" ? "Adicionar operador" : "Editar operador";
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
                    <Input placeholder="Ex: Gabriel Ribeiro" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN (4 dígitos)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={4} placeholder="1234" {...field} disabled={loading} />
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
