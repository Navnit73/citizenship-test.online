type SpeakOptions = { text: string; rate: number; audioUrl?: string };

export function canSpeak(): boolean {
  return (
    "speechSynthesis" in globalThis && typeof globalThis.SpeechSynthesisUtterance !== "undefined"
  );
}

function speakWithSynthesis(text: string, rate: number): () => void {
  speechSynthesis.cancel(); // clear anything already queued
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
  return () => speechSynthesis.cancel();
}

/** Plays a pre-generated MP3 when available, else the Web Speech API. Returns a stop function. */
export function speak({ text, rate, audioUrl }: SpeakOptions): () => void {
  if (audioUrl && typeof Audio !== "undefined") {
    const audio = new Audio(audioUrl);
    audio.playbackRate = rate;
    let fallbackStop: (() => void) | undefined;
    audio.play().catch(() => {
      if (canSpeak()) fallbackStop = speakWithSynthesis(text, rate);
    });
    return () => {
      audio.pause();
      fallbackStop?.();
    };
  }
  return canSpeak() ? speakWithSynthesis(text, rate) : () => {};
}
