import { Outlet } from "@tanstack/react-router";
import { Suspense } from "react";

// Create a loading component
const LoadingComponent = () => (
  <div className="py-10 text-center">Loading...</div>
);

// Layout component with common structure
function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-primary-200 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-center text-4xl font-bold text-primary-800 drop-shadow-sm">
          <span className="decoration-primary-400">Money Management App</span>
        </h1>

        <Suspense fallback={<LoadingComponent />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

export default Layout;
export { LoadingComponent };
