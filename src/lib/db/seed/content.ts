import { PostModel } from "../models";

/**
 * Starter legal and policy pages. They only state what this site demonstrably
 * does. They are NOT legal advice: have them reviewed before publishing, and
 * add the pages that need real legal input (privacy policy, terms of use, ...).
 */
const PAGES = [
  {
    slug: "disclaimer",
    title: "Disclaimer",
    excerpt: "Who we are not: this site is independent and not affiliated with any government.",
    body: `<h2>Independent study resource</h2>
<p>citizenship-test.online is an independent study resource. It is not affiliated with, endorsed by or connected to USCIS (United States Citizenship and Immigration Services), the UK Home Office, IRCC (Immigration, Refugees and Citizenship Canada) or the Australian Department of Home Affairs.</p>
<h2>Not legal or immigration advice</h2>
<p>Everything on this site is general information for study purposes. It is not legal or immigration advice, and passing a practice test does not guarantee that you will pass the real test.</p>
<h2>Rules change</h2>
<p>Exam rules, question banks and handbook editions change. Each country page links to the official source and shows when we last reviewed it. Always confirm current requirements with the official source before you apply or sit a test.</p>`,
  },
  {
    slug: "editorial-policy",
    title: "Editorial and accuracy policy",
    excerpt: "How we source, review and correct what we publish.",
    body: `<h2>Sources</h2>
<p>Practice questions are written from the official study materials for each country. Every question carries a source reference so you can check it yourself.</p>
<h2>Exam rules</h2>
<p>Question counts, pass marks and time limits are stored in our database and are the same rules our practice tests use. Each country page shows the official source and the date we last reviewed it.</p>
<h2>Reviews and corrections</h2>
<p>We aim to review each country's content every quarter and whenever the official rules change. If you spot a mistake, please tell us through the contact page and we will correct it and update the review date.</p>`,
  },
  {
    slug: "cookie-policy",
    title: "Cookie policy",
    excerpt: "What this site stores on your device, and when.",
    body: `<h2>What we store</h2>
<p>To work, this site stores a small amount of data in your browser:</p>
<ul>
<li><strong>Practice attempts</strong> (ct.guest.id, ct.guest.attempts): your recent results, kept on your device so you can see your history without an account.</li>
<li><strong>Your cookie choice</strong> (ct.consent): remembers whether you accepted or rejected analytics.</li>
<li><strong>Sign-in cookies</strong>: only if you sign in, so we can keep you signed in.</li>
</ul>
<h2>Analytics</h2>
<p>We only load analytics, and only set analytics cookies, after you accept. If you reject, or never choose, no analytics code is loaded.</p>
<h2>Changing your mind</h2>
<p>Use the “Cookie settings” link in the footer at any time to change your choice.</p>`,
  },
] as const;

export async function seedContent(
  authorId: string,
  { publish = false }: { publish?: boolean } = {},
) {
  const created: string[] = [];
  const skipped: string[] = [];
  for (const page of PAGES) {
    const exists = await PostModel.exists({ type: "legal", slug: page.slug });
    if (exists) {
      skipped.push(page.slug);
      continue;
    }
    await PostModel.create({
      type: "legal",
      ...page,
      authorId,
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date() : undefined,
    });
    created.push(page.slug);
  }
  return { created, skipped };
}
