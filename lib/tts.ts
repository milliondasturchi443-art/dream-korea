// Web Speech API — koreys tilida ovozli o‘qish (TTS)
// iOS/Safari: ovozlar async yuklanadi, birinchi bosishda bo‘sh bo‘lishi mumkin.

let voicesCache: SpeechSynthesisVoice[] = [];

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

function loadVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  const v = s.getVoices();
  if (v.length) voicesCache = v;
  return voicesCache.length ? voicesCache : v;
}

// Sahifa ochilganda ovozlarni oldindan yuklaymiz
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  try {
    window.speechSynthesis.onvoiceschanged = () => { loadVoices(); };
  } catch {}
}

function pickKoVoice(): SpeechSynthesisVoice | null {
  const vs = loadVoices();
  // Afzal: aniq ko-KR, keyin koreys tili, keyin istalgan
  return (
    vs.find(v => v.lang === "ko-KR") ||
    vs.find(v => v.lang.replace("_", "-").startsWith("ko")) ||
    null
  );
}

export function hasTTS(): boolean {
  return !!synth();
}

export function hasKoreanVoice(): boolean {
  return !!pickKoVoice();
}

// Matnni koreys tilida ovoz chiqarib o‘qish. true = ovoz ochildi.
export function speak(text: string): boolean {
  const s = synth();
  if (!s) return false;
  const t = String(text || "").trim();
  if (!t) return false;
  try {
    s.cancel(); // oldingi ovozni to‘xtatish
    const u = new SpeechSynthesisUtterance(t);
    const v = pickKoVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || "ko-KR";
    u.rate = 0.9;
    u.pitch = 1;
    s.speak(u);
    return true;
  } catch {
    return false;
  }
}
