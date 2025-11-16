import { EquipmentTable } from "./EquipmentTable";
import {
  createEquipment,
  deleteEquipment,
  listEquipment,
  toggleEquipment,
  updateEquipment,
} from "./actions";

export const runtime = 'nodejs';
export const revalidate = 0;

export default async function EquipmentPage() {
  const equipment = await listEquipment();

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Admin</p>
        <h1 className="text-3xl font-semibold text-gray-900">Equipamentos</h1>
        <p className="text-sm text-gray-500">Gerencie equipamentos e seus status</p>
      </header>

      <EquipmentTable
        data={equipment}
        onCreate={createEquipment}
        onUpdate={updateEquipment}
        onToggle={toggleEquipment}
        onDelete={deleteEquipment}
      />
    </section>
  );
}