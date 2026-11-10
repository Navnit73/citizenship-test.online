import Link from "next/link";
import { COUNTRY_CODES, COUNTRY_NAMES } from "@/lib/countries";

export default function Home() {
  return (
    <main>
      <h1 className="mb-2 text-3xl font-bold">Free citizenship test practice</h1>
      <p className="mb-6">Choose your country to start a free practice test.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {COUNTRY_CODES.map((code) => (
          <li key={code}>
            <Link
              href={`/${code}/practice-test`}
              className="btn btn-outline btn-block justify-start"
            >
              {COUNTRY_NAMES[code]} practice test
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
