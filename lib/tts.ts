// Web Speech API — koreys tilida ovozli o'qish (TTS) + Android bridge + Google TTS zaxira.
// iOS/Safari: ovozlar async yuklanadi, birinchi bosishda bo'sh bo'lishi mumkin.
// Android WebView: speechSynthesis ko'pincha ovozsiz — ilova ichida `AndroidTTS` bridge
// (nat TextToSpeech) birinchi navbatda ishlatiladi.

let voicesCache: SpeechSynthesisVoice[] = [];
let audioEl: HTMLAudioElement | null = null;
let pendingText = "";

type AndroidTtsBridge = { speak: (text: string, rate?: number) => boolean; stop: () => void };

function androidTts(): AndroidTtsBridge | null {
  try {
    const a = (window as unknown as { AndroidTTS?: AndroidTtsBridge }).AndroidTTS;
    return a && typeof a.speak === "function" ? a : null;
  } catch {
    return null;
  }
}

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

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  try {
    window.speechSynthesis.onvoiceschanged = () => { loadVoices(); };
  } catch {}
}

function pickKoVoice(): SpeechSynthesisVoice | null {
  const vs = loadVoices();
  return (
    vs.find(v => v.lang === "ko-KR") ||
    vs.find(v => v.lang.replace("_", "-").startsWith("ko")) ||
    null
  );
}

export function hasTTS(): boolean {
  if (typeof window === "undefined") return false;
  return !!androidTts() || "speechSynthesis" in window || typeof Audio !== "undefined";
}

export function hasKoreanVoice(): boolean {
  // Android bridge doimiy ko-KR ovozini ishlatadi (nat TextToSpeech)
  if (typeof window !== "undefined" && androidTts()) return true;
  return !!pickKoVoice();
}

// Google Translate TTS — internet orqali haqiqiy koreys ovozi (ovoz yo'q qurilmalar uchun ham)
function googleTtsUrl(text: string): string {
  const t = String(text || "").trim().slice(0, 200);
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${encodeURIComponent(t)}`;
}

function stopAll() {
  try { androidTts()?.stop(); } catch {}
  try { window.speechSynthesis?.cancel(); } catch {}
  try { audioEl?.pause(); } catch {}
}

// Matnni koreys tilida ovoz chiqarib o'qish. true = ovoz ochildi.
export function speak(text: string): boolean {
  const t = String(text || "").trim();
  if (!t) return false;
  if (typeof window === "undefined") return false;
  stopAll();

  // 0) Android ilova bridge — nat TextToSpeech (WebView'da eng ishonchli)
  try {
    const bridge = androidTts();
    if (bridge && bridge.speak(t, 0.9)) return true;
  } catch {}

  // 1) Google TTS (haqiqiy koreys ovozi, ko'p qurilmada ishonchli)
  try {
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.preload = "auto";
      audioEl.onerror = () => { try { speakLocal(pendingText); } catch {} };
    }
    pendingText = t;
    audioEl.src = googleTtsUrl(t);
    audioEl.currentTime = 0;
    const p = audioEl.play();
    if (p && typeof p.then === "function") { p.catch(() => speakLocal(t)); }
    return true;
  } catch {
    // Google bloklangan bo'lsa — lokal ovoz
    return speakLocal(t);
  }
}

// Faqat lokal (brauzer) ovoz
export function speakLocal(text: string): boolean {
  const s = synth();
  if (!s) return false;
  const t = String(text || "").trim();
  if (!t) return false;
  try {
    s.cancel();
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

export function stopSpeak() {
  stopAll();
}
