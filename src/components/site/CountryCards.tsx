import Link from "next/link";
import { hubPath } from "@/lib/site/country-pages";
import type { CountrySummary } from "@/lib/site/data";
import type { CountryCode } from "@/lib/engine/types";

const FLAGS: Record<CountryCode, string> = { us: "🇺🇸", uk: "🇬🇧", ca: "🇨🇦", au: "🇦🇺" };

export function CountryCards({
  countries,
  suggested,
}: {
  countries: CountrySummary[];
  suggested?: CountryCode | null;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {countries.map((c) => (
        <li
          key={c.code}
          className={`rounded border p-4 ${c.code === suggested ? "border-primary" : "border-base-300"}`}
        >
          <h3 className="text-lg font-semibold">
            <span aria-hidden="true">{FLAGS[c.code]} </span>
            <Link href={hubPath(c.code)} className="link">
              {c.testName}
            </Link>
          </h3>
          {c.code === suggested && <p className="badge badge-primary my-1">Suggested for you</p>}
          <p className="text-sm">
            {c.description.questions} · pass mark {c.description.passMark} · {c.description.time}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/${c.code}/practice-test`} className="btn btn-primary btn-sm">
              Start {c.name} practice test
            </Link>
            <Link
              href={hubPath(c.code)}
              className="btn btn-outline btn-sm"
              aria-label={`${c.testName}: rules and format`}
            >
              Rules and format
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
