import type { AppLanguage, MedicalWarningLevel } from "@/lib/types";

type CopyShape = {
  appName: string;
  appTitle: string;
  appSubtitle: string;
  intakeBadge: string;
  disclaimer: string;
  featureOneTitle: string;
  featureOneBody: string;
  featureTwoTitle: string;
  featureTwoBody: string;
  featureThreeTitle: string;
  featureThreeBody: string;
  authTitle: string;
  authSubtitle: string;
  emailLabel: string;
  passwordLabel: string;
  signIn: string;
  signUp: string;
  switchToSignIn: string;
  switchToSignUp: string;
  sidebarTitle: string;
  sidebarHint: string;
  newChat: string;
  signOut: string;
  chatPlaceholder: string;
  composerPlaceholder: string;
  send: string;
  sending: string;
  historyEmpty: string;
  startPrompt: string;
  introLabel: string;
  sessionLabel: string;
  userRole: string;
  assistantRole: string;
  warningTitle: string;
  warningSoft: string;
  authError: string;
  genericError: string;
  missingKeyError: string;
  quotaHint: string;
  rateLimitError: string;
};

export const copy: Record<AppLanguage, CopyShape> = {
  en: {
    appName: "MedAI",
    appTitle: "Medical intake, not medical theater.",
    appSubtitle:
      "Capture symptoms, surface red flags, and keep a structured record before the real visit starts.",
    intakeBadge: "Symptom Intake Assistant",
    disclaimer:
      "MedAI is for intake support only. It does not diagnose, prescribe, or replace a licensed clinician.",
    featureOneTitle: "Structured follow-up",
    featureOneBody:
      "The assistant asks intake-style questions instead of jumping to conclusions.",
    featureTwoTitle: "Soft urgency signal",
    featureTwoBody:
      "Red-flag symptom patterns trigger a warning without breaking the conversation.",
    featureThreeTitle: "Bilingual records",
    featureThreeBody:
      "Each saved intake keeps its own language and full history in Firestore.",
    authTitle: "Enter your secure intake workspace.",
    authSubtitle:
      "Use email and password to keep your symptom history connected to your account.",
    emailLabel: "Email",
    passwordLabel: "Password",
    signIn: "Sign in",
    signUp: "Create account",
    switchToSignIn: "Already have an account? Sign in",
    switchToSignUp: "Need an account? Create one",
    sidebarTitle: "History",
    sidebarHint: "Each thread keeps its own language and warning state.",
    newChat: "New intake",
    signOut: "Sign out",
    chatPlaceholder: "Select a session or start a fresh intake.",
    composerPlaceholder:
      "Describe what you are feeling, when it started, and anything that makes it better or worse.",
    send: "Send",
    sending: "Thinking",
    historyEmpty: "No sessions yet. Start with your main symptom.",
    startPrompt:
      "Begin with your main symptom, when it started, and anything that feels urgent.",
    introLabel: "How MedAI responds",
    sessionLabel: "session",
    userRole: "user",
    assistantRole: "assistant",
    warningTitle: "Possible urgent symptom pattern",
    warningSoft:
      "This may need urgent medical attention. If symptoms feel severe or are getting worse, contact emergency care or a clinician now.",
    authError: "Authentication failed. Check your email and password and try again.",
    genericError: "Something went wrong. Please try again.",
    missingKeyError:
      "The server is missing OPENAI_API_KEY. Add it before using the chatbot.",
    quotaHint: "Each account can send up to 5 messages per hour. Unused messages do not carry over.",
    rateLimitError: "You have reached the 5-message hourly limit. Please wait before sending another message.",
  },
  tr: {
    appName: "MedAI",
    appTitle: "Tani koymadan, belirtileri duzenli toplar.",
    appSubtitle:
      "Sikayetlerini toplar, riskli durumlari isaretler ve doktor gorusmesinden once duzenli bir kayit hazirlar.",
    intakeBadge: "Semptom On Degerlendirme Asistani",
    disclaimer:
      "MedAI sadece on degerlendirme destegi icindir. Tani koymaz, ilac onermez ve doktorun yerini tutmaz.",
    featureOneTitle: "Duzenli takip sorulari",
    featureOneBody:
      "Asistan hemen sonuca atlamaz; durumu netlestirmek icin kisa ve yerinde sorular sorar.",
    featureTwoTitle: "Olculu aciliyet uyarisi",
    featureTwoBody:
      "Riskli belirti kaliplari gorulurse uyari verir ama konusmayi yarida kesmez.",
    featureThreeTitle: "Iki dilli kayitlar",
    featureThreeBody:
      "Her gorusme kendi dilini korur ve tum gecmisi Firestore uzerinde saklanir.",
    authTitle: "Guvenli belirti kayit alanina gir.",
    authSubtitle:
      "Belirti gecmisini hesabina baglamak icin email ve sifre kullan.",
    emailLabel: "Email",
    passwordLabel: "Sifre",
    signIn: "Giris yap",
    signUp: "Hesap olustur",
    switchToSignIn: "Zaten hesabin var mi? Giris yap",
    switchToSignUp: "Hesabin yok mu? Hesap olustur",
    sidebarTitle: "Gecmis",
    sidebarHint: "Her gorusme kendi dilini ve uyari durumunu korur.",
    newChat: "Yeni gorusme",
    signOut: "Cikis yap",
    chatPlaceholder: "Bir gorusme sec ya da sifirdan yeni bir kayit baslat.",
    composerPlaceholder:
      "Ne hissettigini, ne zaman basladigini ve neyin artirip azalttigini yaz.",
    send: "Gonder",
    sending: "Yanit hazirlaniyor",
    historyEmpty: "Henuz gorusme yok. Ana sikayetinle basla.",
    startPrompt:
      "Ana sikayetini, ne zaman basladigini ve acil hissettiren bir durum olup olmadigini yaz.",
    introLabel: "MedAI nasil yanit verir",
    sessionLabel: "gorusme",
    userRole: "kullanici",
    assistantRole: "asistan",
    warningTitle: "Olasi acil durum sinyali",
    warningSoft:
      "Bu tablo acil tibbi degerlendirme gerektirebilir. Sikayetler siddetliyse ya da hizla kotulesiyorsa vakit kaybetmeden acil yardim veya doktor destegi al.",
    authError: "Kimlik dogrulama basarisiz oldu. Email ve sifreyi kontrol edip tekrar dene.",
    genericError: "Bir sey ters gitti. Lutfen tekrar dene.",
    missingKeyError:
      "Sunucuda OPENAI_API_KEY ayarli degil. Chatbotu kullanmadan once ekle.",
    quotaHint: "Her hesap saatte en fazla 5 mesaj gonderebilir. Kullanilmayan haklar birikmez.",
    rateLimitError: "Saatlik 5 mesaj sinirina ulastin. Yeni mesaj gondermeden once biraz bekle.",
  },
};

export function getWarningCopy(language: AppLanguage, level: MedicalWarningLevel) {
  if (level === "none") {
    return null;
  }

  return {
    title: copy[language].warningTitle,
    body: copy[language].warningSoft,
  };
}
