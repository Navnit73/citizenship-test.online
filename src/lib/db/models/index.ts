import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Reuse compiled models across hot reloads. */
function define<S extends Schema>(name: string, schema: S): Model<InferSchemaType<S>> {
  return (mongoose.models[name] as Model<InferSchemaType<S>>) ?? mongoose.model(name, schema);
}

const COUNTRY_CODES = ["us", "uk", "ca", "au"];
const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_: unknown, r: Record<string, unknown>) => {
    delete r._id;
    return r;
  },
};
const opts = { timestamps: true, toJSON, toObject: toJSON };

const countrySchema = new Schema(
  {
    code: { type: String, enum: COUNTRY_CODES, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    examConfig: { type: Schema.Types.Mixed, required: true }, // validated by examConfigSchema
    officialSourceUrl: { type: String, required: true },
    lastReviewedAt: Date,
  },
  opts,
);
export const CountryModel = define("Country", countrySchema);

const chapterSchema = new Schema(
  {
    countryCode: { type: String, enum: COUNTRY_CODES, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    order: { type: Number, default: 0 },
    summary: String,
  },
  opts,
);
chapterSchema.index({ countryCode: 1, slug: 1 }, { unique: true });
export const ChapterModel = define("Chapter", chapterSchema);

export const QUESTION_TYPES = [
  "single",
  "multiple",
  "truefalse",
  "shorttext",
  "dictation",
] as const;
const questionSchema = new Schema(
  {
    countryCode: { type: String, enum: COUNTRY_CODES, required: true },
    versions: { type: [String], required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    prompt: { type: String, required: true },
    options: [
      { _id: false, id: { type: String, required: true }, text: { type: String, required: true } },
    ],
    correctOptionIds: { type: [String], default: [] },
    acceptedAnswers: { type: [String], default: [] },
    explanation: String,
    sourceRef: { type: String, required: true },
    tags: { type: [String], default: [] },
    difficulty: { type: Number, min: 1, max: 3, default: 1 },
    audioUrl: String,
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  opts,
);
questionSchema.index({ countryCode: 1, chapterId: 1, status: 1 });
questionSchema.pre(
  "validate",
  function (this: {
    type: string;
    options: unknown[];
    correctOptionIds: string[];
    invalidate: (p: string, m: string) => void;
  }) {
    const choice = ["single", "multiple", "truefalse"].includes(this.type);
    if (choice && (this.options.length < 2 || this.correctOptionIds.length === 0)) {
      this.invalidate("options", "Choice questions need at least 2 options and a correct answer");
    }
  },
);
export const QuestionModel = define("Question", questionSchema);

const testSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    countryCode: { type: String, enum: COUNTRY_CODES, required: true },
    kind: {
      type: String,
      enum: ["mock", "chapter", "custom", "weak-areas", "flashcards"],
      required: true,
    },
    questionIds: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    rules: Schema.Types.Mixed,
    timeLimitSec: Number,
    isPublished: { type: Boolean, default: false },
    seo: { title: String, description: String, noindex: Boolean },
  },
  opts,
);
export const TestModel = define("Test", testSchema);

const attemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    guestId: String,
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    countryCode: { type: String, enum: COUNTRY_CODES, required: true },
    seed: { type: String, required: true },
    answers: [
      {
        _id: false,
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        response: Schema.Types.Mixed,
        correct: Boolean,
        timeMs: Number,
      },
    ],
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    startedAt: { type: Date, required: true },
    finishedAt: Date,
    mode: { type: String, enum: ["read", "listen", "write", "speak"], default: "read" },
  },
  opts,
);
attemptSchema.index({ userId: 1, finishedAt: -1 });
attemptSchema.index({ guestId: 1 });
export const AttemptModel = define("Attempt", attemptSchema);

export const POST_TYPES = ["blog", "guide", "howto", "legal", "page"] as const;
const postSchema = new Schema(
  {
    type: { type: String, enum: POST_TYPES, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    countryCode: { type: String, enum: COUNTRY_CODES },
    categoryId: Schema.Types.ObjectId,
    body: { type: String, required: true },
    excerpt: String,
    seo: { title: String, description: String, ogImage: String, noindex: Boolean },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "scheduled", "published"], default: "draft" },
    publishedAt: Date,
    revisions: [{ _id: false, body: String, editedBy: Schema.Types.ObjectId, at: Date }],
  },
  opts,
);
postSchema.index({ slug: 1, type: 1 }, { unique: true });
export const PostModel = define("Post", postSchema);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: String,
    role: { type: String, enum: ["admin", "editor", "author", "user"], default: "user" },
    image: String,
    emailVerified: Date,
    preferences: {
      country: { type: String, enum: COUNTRY_CODES },
      mode: { type: String, enum: ["read", "listen", "write", "speak"] },
      audioSpeed: Number,
    },
  },
  opts,
);
export const UserModel = define("User", userSchema);

const redirectSchema = new Schema(
  {
    from: { type: String, required: true, unique: true },
    to: { type: String, required: true },
    status: { type: Number, enum: [301, 302, 307, 308], default: 301 },
  },
  opts,
);
export const RedirectModel = define("Redirect", redirectSchema);

const accountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
  },
  { ...opts, strict: false },
);
accountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
export const AccountModel = define("Account", accountSchema);

const verificationTokenSchema = new Schema({
  identifier: { type: String, required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
});
verificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });
verificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });
export const VerificationTokenModel = define("VerificationToken", verificationTokenSchema);

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: "at", updatedAt: false }, toJSON, toObject: toJSON },
);
auditLogSchema.index({ at: -1 });
export const AuditLogModel = define("AuditLog", auditLogSchema);
