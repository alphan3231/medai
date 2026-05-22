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
  attachmentButton: string;
  attachmentHint: string;
  attachmentShortcutHint: string;
  attachmentSymptom: string;
  attachmentXray: string;
  attachmentRemove: string;
  attachmentUploading: string;
  attachmentReady: string;
  attachmentError: string;
  attachmentCountError: string;
  attachmentTypeError: string;
  attachmentSizeError: string;
  attachmentUploadError: string;
  attachmentPendingError: string;
  attachmentOnlyPrompt: string;
  xrayNoticeTitle: string;
  xrayNoticeBody: string;
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
    attachmentButton: "Add photos",
    attachmentHint:
      "Photos are used only to support symptom intake and follow-up questions. They do not replace clinician review.",
    attachmentShortcutHint: "Click, paste, or drag images into the composer.",
    attachmentSymptom: "Symptom photo",
    attachmentXray: "X-ray",
    attachmentRemove: "Remove",
    attachmentUploading: "Uploading",
    attachmentReady: "Ready",
    attachmentError: "Upload failed",
    attachmentCountError: "You can attach up to 4 images per message.",
    attachmentTypeError: "Only JPG, PNG, and WEBP images are supported.",
    attachmentSizeError: "Each image must be 8 MB or smaller.",
    attachmentUploadError: "We could not upload one of the images. Remove it and try again.",
    attachmentPendingError: "Wait for uploads to finish or remove failed images before sending.",
    attachmentOnlyPrompt: "Send a symptom note or one or more images to start the intake.",
    xrayNoticeTitle: "X-ray safety note",
    xrayNoticeBody:
      "X-ray images are treated as context only. MedAI should not replace clinician or radiology review.",
  },
  tr: {
    appName: "MedAI",
    appTitle: "Tanı koymadan, belirtileri düzenli toplar.",
    appSubtitle:
      "Şikayetlerini toplar, riskli durumları işaretler ve doktor görüşmesinden önce düzenli bir kayıt hazırlar.",
    intakeBadge: "Semptom Ön Değerlendirme Asistanı",
    disclaimer:
      "MedAI sadece ön değerlendirme desteği içindir. Tanı koymaz, ilaç önermez ve doktorun yerini tutmaz.",
    featureOneTitle: "Düzenli takip soruları",
    featureOneBody:
      "Asistan hemen sonuca atlamaz; durumu netleştirmek için kısa ve yerinde sorular sorar.",
    featureTwoTitle: "Ölçülü aciliyet uyarısı",
    featureTwoBody:
      "Riskli belirti kalıpları görülürse uyarı verir ama konuşmayı yarıda kesmez.",
    featureThreeTitle: "İki dilli kayıtlar",
    featureThreeBody:
      "Her görüşme kendi dilini korur ve tüm geçmişi Firestore üzerinde saklanır.",
    authTitle: "Güvenli belirti kayıt alanına gir.",
    authSubtitle:
      "Belirti geçmişini hesabına bağlamak için email ve şifre kullan.",
    emailLabel: "Email",
    passwordLabel: "Şifre",
    signIn: "Giriş yap",
    signUp: "Hesap oluştur",
    switchToSignIn: "Zaten hesabın var mı? Giriş yap",
    switchToSignUp: "Hesabın yok mu? Hesap oluştur",
    sidebarTitle: "Geçmiş",
    sidebarHint: "Her görüşme kendi dilini ve uyarı durumunu korur.",
    newChat: "Yeni görüşme",
    signOut: "Çıkış yap",
    chatPlaceholder: "Bir görüşme seç ya da sıfırdan yeni bir kayıt başlat.",
    composerPlaceholder:
      "Ne hissettiğini, ne zaman başladığını ve neyin artırıp azalttığını yaz.",
    send: "Gönder",
    sending: "Yanıt hazırlanıyor",
    historyEmpty: "Henüz görüşme yok. Ana şikâyetinle başla.",
    startPrompt:
      "Ana şikâyetini, ne zaman başladığını ve acil hissettiren bir durum olup olmadığını yaz.",
    introLabel: "MedAI nasıl yanıt verir",
    sessionLabel: "görüşme",
    userRole: "kullanıcı",
    assistantRole: "asistan",
    warningTitle: "Olası acil durum sinyali",
    warningSoft:
      "Bu tablo acil tıbbi değerlendirme gerektirebilir. Şikâyetler şiddetliyse ya da hızla kötüleşiyorsa vakit kaybetmeden acil yardım veya doktor desteği al.",
    authError: "Kimlik doğrulama başarısız oldu. Email ve şifreyi kontrol edip tekrar dene.",
    genericError: "Bir şey ters gitti. Lütfen tekrar dene.",
    missingKeyError:
      "Sunucuda OPENAI_API_KEY ayarlı değil. Chatbotu kullanmadan önce ekle.",
    quotaHint: "Her hesap saatte en fazla 5 mesaj gönderebilir. Kullanılmayan haklar birikmez.",
    rateLimitError: "Saatlik 5 mesaj sınırına ulaştın. Yeni mesaj göndermeden önce biraz bekle.",
    attachmentButton: "Fotoğraf ekle",
    attachmentHint:
      "Fotoğraflar yalnızca belirti değerlendirmesini ve takip sorularını desteklemek için kullanılır. Klinik değerlendirmenin yerini tutmaz.",
    attachmentShortcutHint: "Görselleri tıkla, yapıştır ya da sürükleyip bırak.",
    attachmentSymptom: "Belirti fotoğrafı",
    attachmentXray: "Röntgen",
    attachmentRemove: "Kaldır",
    attachmentUploading: "Yükleniyor",
    attachmentReady: "Hazır",
    attachmentError: "Yükleme başarısız",
    attachmentCountError: "Bir mesaja en fazla 4 görsel ekleyebilirsin.",
    attachmentTypeError: "Yalnızca JPG, PNG ve WEBP görseller desteklenir.",
    attachmentSizeError: "Her görsel en fazla 8 MB olabilir.",
    attachmentUploadError: "Görsellerden biri yüklenemedi. Kaldırıp tekrar dene.",
    attachmentPendingError: "Göndermeden önce yüklemelerin bitmesini bekle ya da hatalı görselleri kaldır.",
    attachmentOnlyPrompt: "Ön görüşmeyi başlatmak için belirti notu ya da bir veya daha fazla görsel gönder.",
    xrayNoticeTitle: "Röntgen güvenlik notu",
    xrayNoticeBody:
      "Röntgen görüntüleri yalnızca bağlamsal destek olarak kullanılır. MedAI klinik veya radyoloji değerlendirmesinin yerini almamalıdır.",
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
