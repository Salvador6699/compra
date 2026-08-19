import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hydrateFromSupabase, startRealtimeSync } from "@/lib/supabase-sync";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground/80">
          Página no encontrada
        </h2>
        <p className="mt-4 text-muted-foreground">
          Oops, parece que te has perdido en los pasillos del supermercado.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-6 w-6 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-destructive">Algo ha ido mal</h2>
          <p className="mt-2 text-sm text-destructive/80">{error.message}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 w-full rounded-md border border-destructive/20 px-4 py-2 text-sm font-medium hover:bg-destructive/10 hover:text-destructive"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      await hydrateFromSupabase();
      startRealtimeSync();
      setInitialized(true);
    };

    initApp();

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        hydrateFromSupabase();
        startRealtimeSync();
      }
    };

    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (!initialized) return null; // Avoid flicker

  return <Outlet />;
}
