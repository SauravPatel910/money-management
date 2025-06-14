function Loading({ text = "Loading..." }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex h-64 items-center justify-center">
        <div className="text-primary-600">
          <svg className="mr-3 h-10 w-10 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <div className="text-lg font-medium text-primary-700">{text}</div>
      </div>
    </div>
  );
}
export default Loading;
