import { adminRoute } from "@/lib/api/admin-route";
import { ChapterModel } from "@/lib/db/models";

export const GET = adminRoute("question:write", async (_actor, req) => {
  const country = new URL(req.url).searchParams.get("countryCode");
  return ChapterModel.find(country ? { countryCode: country } : {}).sort({
    countryCode: 1,
    order: 1,
  });
});
