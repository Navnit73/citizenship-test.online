import { Suspense } from "react";
import { connection } from "next/server";

async function Connection() {
  await connection();
  return null;
}

/**
 * Lets a page whose generateMetadata needs request-time data keep its static
 * shell: the metadata streams in instead of blocking the build.
 */
export function DynamicMarker() {
  return (
    <Suspense>
      <Connection />
    </Suspense>
  );
}
