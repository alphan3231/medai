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
  },
  tr: {
    appName: "MedAI",
    appTitle: "Teshis numarasi yapmadan, duzenli intake.",
    appSubtitle:
      "Semptomlarini toparlar, riskli sinyalleri isaretler ve doktordan once duzenli bir kayit cikarir.",
    intakeBadge: "Semptom Intake Asistani",
    disclaimer:
      "MedAI sadece intake destegi icindir. Teshis koymaz, ilac onermez ve doktorun yerini tutmaz.",
    featureOneTitle: "Yapilandirilmis takip",
    featureOneBody:
      "Asistan sonuca ziplamadan, intake mantiginda net takip sorulari sorar.",
    featureTwoTitle: "Yumusak aciliyet sinyali",
    featureTwoBody:
      "Riskli semptom kaliplari warning uretir ama konusmayi kesmez.",
    featureThreeTitle: "Iki dilli kayit",
    featureThreeBody:
      "Kaydedilen her intake kendi dilini ve tum gecmisini Firestore icinde korur.",
    authTitle: "Guvenli intake alanina gir.",
    authSubtitle:
      "Semptom gecmisini hesabina baglamak icin email ve sifre kullan.",
    emailLabel: "Email",
    passwordLabel: "Sifre",
    signIn: "Giris yap",
    signUp: "Hesap olustur",
    switchToSignIn: "Zaten hesabin var mi? Giris yap",
    switchToSignUp: "Hesabin yok mu? Hesap olustur",
    sidebarTitle: "Gecmis",
    sidebarHint: "Her oturum kendi dilini ve warning durumunu korur.",
    newChat: "Yeni intake",
    signOut: "Cikis yap",
    chatPlaceholder: "Bir oturum sec ya da sifirdan yeni intake baslat.",
    composerPlaceholder:
      "Ne hissettigini, ne zaman basladigini ve neyin arttirdigini ya da azalttigini yaz.",
    send: "Gonder",
    sending: "Dusunuyor",
    historyEmpty: "Henuz oturum yok. Ana semptomunla basla.",
    startPrompt:
      "Ana semptomunu, ne zaman basladigini ve acil hissettiren bir sey olup olmadigini yaz.",
    introLabel: "MedAI nasil yanit verir",
    sessionLabel: "oturum",
    userRole: "kullanici",
    assistantRole: "asistan",
    warningTitle: "Olasi acil durum sinyali",
    warningSoft:
      "Bu durum acil tibbi degerlendirme gerektirebilir. Semptomlar siddetliyse veya kotulesiyorsa hemen acil yardim ya da doktor destegi al.",
    authError: "Kimlik dogrulama basarisiz oldu. Email ve sifreyi kontrol edip tekrar dene.",
    genericError: "Bir sey ters gitti. Lutfen tekrar dene.",
    missingKeyError:
      "Sunucuda OPENAI_API_KEY ayarli degil. Chatbotu kullanmadan once ekle.",
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
