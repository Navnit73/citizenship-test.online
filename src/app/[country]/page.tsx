import { notFound, permanentRedirect } from "next/navigation";
import { isCountryCode } from "@/lib/countries";
import { hubPath } from "@/lib/site/country-pages";

export function generateStaticParams() {
  return (["us", "uk", "ca", "au"] as const).map((country) => ({ country }));
}

/** `/uk` is not a page of its own; send visitors (and link equity) to the hub. */
export default async function CountryIndex({ params }: PageProps<"/[country]">) {
  const { country } = await params;
  if (!isCountryCode(country)) notFound();
  permanentRedirect(hubPath(country));
}
