import { afterEach, describe, expect, it, vi } from "vitest";
import { canSpeak, speak } from "./speech";

afterEach(() => vi.unstubAllGlobals());

describe("speech", () => {
  it("reports unsupported without speechSynthesis", () => {
    expect(canSpeak()).toBe(false);
  });
  it("speaks text at the requested rate and can be cancelled", () => {
    const speakFn = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak: speakFn, cancel });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        rate = 1;
        constructor(public text: string) {}
      },
    );
    expect(canSpeak()).toBe(true);
    const stop = speak({ text: "Hello", rate: 0.75 });
    expect(cancel).toHaveBeenCalledTimes(1); // clears anything already queued
    expect(speakFn.mock.calls[0][0]).toMatchObject({ text: "Hello", rate: 0.75 });
    stop();
    expect(cancel).toHaveBeenCalledTimes(2);
  });
  it("prefers an audio file when provided", () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    const Audio = vi.fn(function (this: Record<string, unknown>) {
      this.play = play;
      this.pause = pause;
    });
    vi.stubGlobal("Audio", Audio);
    const stop = speak({ text: "x", rate: 1.25, audioUrl: "/a.mp3" });
    expect(Audio).toHaveBeenCalledWith("/a.mp3");
    expect(play).toHaveBeenCalled();
    stop();
    expect(pause).toHaveBeenCalled();
  });
});
