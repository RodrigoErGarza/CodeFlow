import { Suspense } from "react";
import AprendizajeClient from "./AprendizajeClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AprendizajeClient />
    </Suspense>
  );
}
