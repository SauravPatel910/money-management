import { UnauthorizedError, requireDeveloper } from "@/server/authSession";
import DeveloperFeatures from "@/views/DeveloperFeatures";

export default async function DeveloperFeatureControlsPage() {
  try {
    await requireDeveloper();
  } catch (error) {
    const message =
      error instanceof UnauthorizedError
        ? error.message
        : "Developer access required";

    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-2xl border border-primary-100 bg-white/90 p-6 shadow-card">
          <h1 className="text-2xl font-bold text-primary-800">
            Developer access required
          </h1>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </section>
      </main>
    );
  }

  return <DeveloperFeatures />;
}
