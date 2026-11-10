import { examConfigSchema } from "@/lib/engine/schemas";
import type { CountryCode, ExamVersion } from "@/lib/engine/types";
import { CountryModel } from "../models";

export type CountryInput = {
  code: CountryCode;
  name: string;
  slug: string;
  examConfig: unknown;
  officialSourceUrl: string;
  lastReviewedAt?: Date;
};

export const countriesRepo = {
  async upsert(input: CountryInput) {
    const examConfig = examConfigSchema.parse(input.examConfig);
    return CountryModel.findOneAndUpdate(
      { code: input.code },
      { ...input, examConfig },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  },
  list() {
    return CountryModel.find().sort({ code: 1 });
  },
  async getVersion(code: CountryCode, key?: string): Promise<ExamVersion> {
    const country = await CountryModel.findOne({ code });
    if (!country) throw new Error(`Country ${code} not found`);
    const config = examConfigSchema.parse(country.examConfig);
    const wanted = key ?? config.activeVersion;
    const version = config.versions.find((v) => v.key === wanted);
    if (!version) throw new Error(`Unknown version ${wanted} for ${code}`);
    return version;
  },
  getActiveVersion(code: CountryCode): Promise<ExamVersion> {
    return countriesRepo.getVersion(code);
  },
};
