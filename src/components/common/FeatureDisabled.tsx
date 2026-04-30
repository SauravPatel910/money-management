type FeatureDisabledProps = {
  title?: string;
};

export default function FeatureDisabled({
  title = "Feature disabled",
}: FeatureDisabledProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-primary-100 bg-white/90 p-6 text-center shadow-card">
      <h2 className="text-xl font-semibold text-primary-700">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">
        This feature is currently turned off by the developers.
      </p>
    </div>
  );
}
