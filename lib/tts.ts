// TTS — koreys tilida ovozli o'qish.
// Zanjir: server proxy (/api/tts) → Android bridge → Google TTS → Web Speech.
// Server proxy WebView/CORS muammosiz ishlaydi (same-origin), shuning uchun birinchi.

let voicesCache: SpeechSynthesisVoice[] = [];
let audioEl: HTMLAudioElement | null = null;
let pendingText = "";
// audio xatosida keyingi bosqichga o'tish uchun
let stage: "proxy" | "google" | "done" = "proxy";

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
  return true;
}

export function hasKoreanVoice(): boolean {
  // Server proxy doim haqiqiy koreys ovozini qaytaradi — qurilmada ovoz bor
  return true;
}

function googleTtsUrl(text: string): string {
  const t = String(text || "").trim().slice(0, 200);
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${encodeURIComponent(t)}`;
}

function proxyTtsUrl(text: string): string {
  const t = String(text || "").trim().slice(0, 200);
  return `/api/tts?text=${encodeURIComponent(t)}`;
}

function stopAll() {
  stage = "done";
  try { androidTts()?.stop(); } catch {}
  try { window.speechSynthesis?.cancel(); } catch {}
  try { audioEl?.pause(); } catch {}
}

// Faqat lokal (brauzer/WebSpeech) ovoz
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

// Google'ning o'zidan to'g'ridan-to'g'ri (proxy ishlamasa)
function playGoogleDirect(text: string): boolean {
  try {
    if (!audioEl) return false;
    audioEl.src = googleTtsUrl(text);
    audioEl.currentTime = 0;
    const p = audioEl.play();
    if (p && typeof p.then === "function") {
      p.catch(() => speakLocal(text));
    }
    return true;
  } catch {
    return speakLocal(text);
  }
}

// Audio xato/рад etilganda keyingi bosqich
function nextStage() {
  const t = pendingText;
  if (!t) return;
  if (stage === "proxy") {
    stage = "google";
    // 1) Android bridge (nat TextToSpeech)
    try {
      const b = androidTts();
      if (b && b.speak(t, 0.9)) { stage = "done"; return; }
    } catch {}
    // 2) Google to'g'ridan-to'g'ri
    playGoogleDirect(t);
    return;
  }
  if (stage === "google") {
    stage = "done";
    speakLocal(t);
  }
}

// Matnni koreys tilida ovoz chiqarib o'qish. true = ovoz ochildi.
export function speak(text: string): boolean {
  const t = String(text || "").trim();
  if (!t) return false;
  if (typeof window === "undefined") return false;
  stopAll();

  pendingText = t;

  // 0) Android bridge — offline va tez, agar qurilmada ko-KR ovoz bo'lsa
  try {
    const b = androidTts();
    if (b && b.speak(t, 0.9)) { stage = "done"; return true; }
  } catch {}

  // 1) Server proxy — WebView'da eng ishonchli (same-origin, haqiqiy koreys ovozi)
  try {
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.preload = "auto";
      audioEl.onerror = nextStage;
    }
    stage = "proxy";
    audioEl.src = proxyTtsUrl(t);
    audioEl.currentTime = 0;
    const p = audioEl.play();
    if (p && typeof p.then === "function") {
      p.catch(nextStage);
    }
    return true;
  } catch {
    nextStage();
    return true;
  }
}

export function stopSpeak() {
  stopAll();
}
