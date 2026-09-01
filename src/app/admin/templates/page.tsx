import TemplateGrid from "./TemplateGrid";

export const metadata = {
  title: "Templates | Admin",
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-admin-text mb-2">Available Templates</h1>
          <p className="text-admin-text-muted">
            These are the built-in design templates available for your events.
          </p>
        </div>
      </div>

      <TemplateGrid />
    </div>
  );
}
