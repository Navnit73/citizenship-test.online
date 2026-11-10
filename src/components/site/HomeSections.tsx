import Link from "next/link";
import { headers } from "next/headers";
import { connection } from "next/server";
import { suggestedCountry } from "@/lib/site/geo";
import { postPath } from "@/lib/cms/paths";
import { getHomeData, getPostBySlug } from "@/lib/site/data";
import { CountryCards } from "./CountryCards";

/** The data-driven home sections. Streams in; the hero and static sections paint first. */
export async function CountrySelector() {
  await connection();
  const [{ countries }, h] = await Promise.all([getHomeData(), headers()]);
  // Highlight only: visitors are never redirected based on location.
  const suggested = suggestedCountry(h.get("x-vercel-ip-country"));
  return <CountryCards countries={countries} suggested={suggested} />;
}

export async function LatestPosts() {
  await connection();
  const { latestPosts } = await getHomeData();
  if (latestPosts.length === 0) return <p>New guides are on the way.</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {latestPosts.map((p) => (
        <li key={p.path} className="rounded border border-base-300 p-4">
          <h3 className="font-semibold">
            <Link href={p.path} className="link">
              {p.title}
            </Link>
          </h3>
          {p.excerpt && <p className="mt-1 text-sm">{p.excerpt}</p>}
        </li>
      ))}
    </ul>
  );
}

export async function TrustBlock() {
  await connection();
  const [{ countries, stats }, policy] = await Promise.all([
    getHomeData(),
    getPostBySlug("legal", "editorial-policy"),
  ]);
  return (
    <div className="space-y-3">
      <p>
        Every question carries a source reference, and every country page links to the official
        source and shows when it was last reviewed.
        {/* Only link the policy once it is published, so the home page never links to a 404. */}
        {policy && (
          <>
            {" "}
            Read our{" "}
            <Link href={postPath("legal", policy.slug)} className="link">
              editorial and accuracy policy
            </Link>
            .
          </>
        )}
      </p>
      <ul className="list-disc space-y-1 pl-6">
        {countries.map((c) => (
          <li key={c.code}>
            {c.name}:{" "}
            <a
              href={c.officialSourceUrl}
              className="link"
              rel="noopener noreferrer"
              target="_blank"
            >
              {new URL(c.officialSourceUrl).hostname}
            </a>
            {c.lastReviewedAt && (
              <>
                {" "}
                (reviewed{" "}
                {new Date(c.lastReviewedAt).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
                )
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm">
        {stats.questions} practice question{stats.questions === 1 ? "" : "s"} published
        {stats.tests > 0 ? ` · ${stats.tests} custom test${stats.tests === 1 ? "" : "s"}` : ""}.
      </p>
    </div>
  );
}
