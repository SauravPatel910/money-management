import { Suspense } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./routes";

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading app...
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
