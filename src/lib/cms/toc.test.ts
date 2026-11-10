import { describe, expect, it } from "vitest";
import { addHeadingIds } from "./toc";

describe("addHeadingIds", () => {
  it("adds slug ids to h2/h3 and returns a table of contents", () => {
    const { html, toc } = addHeadingIds("<h2>Getting started</h2><p>x</p><h3>Step one</h3>");
    expect(html).toBe(
      '<h2 id="getting-started">Getting started</h2><p>x</p><h3 id="step-one">Step one</h3>',
    );
    expect(toc).toEqual([
      { id: "getting-started", text: "Getting started", level: 2 },
      { id: "step-one", text: "Step one", level: 3 },
    ]);
  });
  it("de-duplicates ids and strips inline markup from the label", () => {
    const { toc } = addHeadingIds("<h2>Fees</h2><h2><strong>Fees</strong></h2>");
    expect(toc.map((t) => t.id)).toEqual(["fees", "fees-2"]);
    expect(toc[1].text).toBe("Fees");
  });
  it("ignores h4 and empty headings and leaves other html alone", () => {
    const { html, toc } = addHeadingIds("<h4>Small</h4><h2></h2><p>text</p>");
    expect(toc).toEqual([]);
    expect(html).toBe("<h4>Small</h4><h2></h2><p>text</p>");
  });
});
