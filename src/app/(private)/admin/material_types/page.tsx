import { MaterialTypesTable } from "./MaterialTypesTable";
import {
  createMaterialType,
  deleteMaterialType,
  listMaterialTypes,
  toggleMaterialType,
  updateMaterialType,
} from "./actions";

export const runtime = 'nodejs';
export const revalidate = 0;

export default async function MaterialTypesPage() {
  const materialTypes = await listMaterialTypes();

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Admin</p>
        <h1 className="text-3xl font-semibold text-gray-900">Tipos de Material</h1>
        <p className="text-sm text-gray-500">Gerencie tipos de material</p>
      </header>

      <MaterialTypesTable
        data={materialTypes}
        onCreate={createMaterialType}
        onUpdate={updateMaterialType}
        onToggle={toggleMaterialType}
        onDelete={deleteMaterialType}
      />
    </section>
  );
}