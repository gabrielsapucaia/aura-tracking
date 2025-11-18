import { ReleasesTable } from "./ReleasesTable";
import {
  createRelease,
  deleteRelease,
  listReleases,
  toggleRelease,
  updateRelease,
} from "./actions";
import { listMaterialTypes } from "../material_types/actions";

export const runtime = 'nodejs';
export const revalidate = 0;

export default async function ReleasesPage() {
  const [releases, materialTypes] = await Promise.all([
    listReleases(),
    listMaterialTypes(),
  ]);

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Admin</p>
        <h1 className="text-3xl font-semibold text-gray-900">Liberações</h1>
        <p className="text-sm text-gray-500">Gerencie liberações de materiais</p>
      </header>

      <ReleasesTable
        data={releases}
        materialTypes={materialTypes}
        onCreate={createRelease}
        onUpdate={updateRelease}
        onToggle={toggleRelease}
        onDelete={deleteRelease}
      />
    </section>
  );
}