import { EquipmentTypesTable } from "./EquipmentTypesTable";
import {
  createEquipmentType,
  deleteEquipmentType,
  listEquipmentTypes,
  toggleEquipmentType,
  updateEquipmentType,
} from "./actions";

export const runtime = 'nodejs';
export const revalidate = 0;

export default async function EquipmentTypesPage() {
  const equipmentTypes = await listEquipmentTypes();

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Admin</p>
        <h1 className="text-3xl font-semibold text-gray-900">Tipos de Equipamento</h1>
        <p className="text-sm text-gray-500">Gerencie tipos de equipamento</p>
      </header>

      <EquipmentTypesTable
        data={equipmentTypes}
        onCreate={createEquipmentType}
        onUpdate={updateEquipmentType}
        onToggle={toggleEquipmentType}
        onDelete={deleteEquipmentType}
      />
    </section>
  );
}