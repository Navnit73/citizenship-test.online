import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// `connection()` only matters inside Next's renderer; make it a no-op in tests.
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
