import { OperatorsTable } from "./OperatorsTable";
import {
  createOperator,
  deleteOperator,
  listOperators,
  toggleOperator,
  updateOperator,
} from "./actions";

export const runtime = 'nodejs';
export const revalidate = 0;

export default async function OperatorsPage() {
  const operators = await listOperators();

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Admin</p>
        <h1 className="text-3xl font-semibold text-gray-900">Operadores</h1>
        <p className="text-sm text-gray-500">Gerencie operadores e PINs em tempo real</p>
      </header>

      <OperatorsTable
        data={operators}
        onCreate={createOperator}
        onUpdate={updateOperator}
        onToggle={toggleOperator}
        onDelete={deleteOperator}
      />
    </section>
  );
}
