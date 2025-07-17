import { Suspense } from "react";
import AnalyticsClientPage from "./AnalyticsClientPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnalyticsClientPage />
    </Suspense>
  );
}
