"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload, Check, AlertCircle, Pencil } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

type Props = { botId: string };

type ToastType = 'info' | 'success' | 'error';

const MODELS: { value: string; label: string }[] = [
  { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
];
interface Bot {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  logoUrl: string | null;
  systemPrompt: string;
  welcomeMessage: string;
  model: string;
  color: string;
  published?: boolean;
  theme?: any;
  _count?: { conversations?: number; documents?: number; intents?: number; faqs?: number };
}

type PromptTemplate = {
  name: string;
  systemPrompt: string;
  welcomeMessage: string;
};

const getPromptTemplates = (isItalian: boolean): PromptTemplate[] => {
  if (isItalian) {
    return [
      {
        name: 'Customer Support',
        systemPrompt: `Sei un assistente di customer support.

OBIETTIVO
- Risolvere il problema dell'utente con pochi scambi.

REGOLE
- Fai solo le domande necessarie (1-2 alla volta).
- Non chiedere password o dati sensibili.
- Se manca informazione, dillo e proponi un prossimo passo.` ,
        welcomeMessage: 'Ciao! Come posso aiutarti oggi?'
      },
      {
        name: 'Sales Assistant',
        systemPrompt: `Sei un assistente vendite.

OBIETTIVO
- Capire l'esigenza e proporre 1-3 opzioni.
- Qualificare con domande brevi.
- Proporre un prossimo passo (demo/call/preventivo).`,
        welcomeMessage: 'Benvenuto! Che obiettivo vuoi raggiungere e in che tempi?'
      },
      {
        name: 'Technical Support',
        systemPrompt: `Sei un assistente di supporto tecnico.

REGOLE
- Usa passi numerati.
- Chiedi dettagli tecnici minimi (ambiente, errore, passi per riprodurre).
- Riassumi e indica il prossimo step.` ,
        welcomeMessage: 'Ciao! Che problema tecnico stai riscontrando?'
      },
      {
        name: 'FAQ Assistant',
        systemPrompt: `Sei un assistente FAQ.

REGOLA PRINCIPALE
- Rispondi solo con la knowledge base disponibile. Non inventare.

SE NON SAI
- Dillo e indica come ottenere l'informazione corretta.`,
        welcomeMessage: 'Ciao! Fai una domanda e risponderò usando la documentazione disponibile.'
      },
      {
        name: 'General Assistant',
        systemPrompt: `Sei un assistente generale, chiaro e utile.

STILE
- Risposte concise e operative.
- Chiarisci con una sola domanda se serve.` ,
        welcomeMessage: 'Ciao! Come posso aiutarti?'
      }
    ];
  }

  return [
    {
      name: 'Customer Support',
      systemPrompt: `You are a customer support assistant.

GOAL
- Resolve the user's issue end-to-end with minimal back-and-forth.

RULES
- Ask only necessary questions (1-2 at a time).
- Never request passwords or sensitive data.
- If info is missing, say so and propose next steps.`,
      welcomeMessage: 'Hi! How can I help you today?'
    },
    {
      name: 'Sales Assistant',
      systemPrompt: `You are a sales assistant.

GOAL
- Understand the need and propose 1-3 suitable options.
- Qualify with short questions.
- Offer a clear next step (demo/call/quote).`,
      welcomeMessage: "Welcome! What are you trying to achieve, and what's your main constraint?"
    },
    {
      name: 'Technical Support',
      systemPrompt: `You are a technical support assistant.

RULES
- Use numbered troubleshooting steps.
- Ask for minimal details (environment, error, repro steps).
- Summarize and propose the next action.`,
      welcomeMessage: 'Hi! What technical issue are you running into?'
    },
    {
      name: 'FAQ Assistant',
      systemPrompt: `You are an FAQ assistant.

PRIMARY RULE
- Answer using only the provided knowledge base. Do not guess.

IF UNSURE
- Say you don't have enough information and suggest next steps.`,
      welcomeMessage: "Hi! Ask me anything and I'll answer from the available documentation."
    },
    {
      name: 'General Assistant',
      systemPrompt: `You are a friendly, helpful assistant.

STYLE
- Be concise and actionable.
- Ask a single clarifying question when needed.`,
      welcomeMessage: 'Hello! How can I help you today?'
    }
  ];
};

type PromptWizardAnswers = {
  botType: 'customer_support' | 'sales' | 'technical_support' | 'faq' | 'general' | 'other';
  businessContext: string;
  targetUsers: string;
  goals: string;
  actionsAndData: string;
  tone: string;
  language: 'it' | 'en';
  knowledgeSources: string;
  constraints: string;
  escalation: string;
};

type PromptWizardStep = {
  key: keyof PromptWizardAnswers;
  title: string;
  helper?: string;
  input: 'select' | 'textarea';
};

function getPromptWizardCopy(isItalian: boolean) {
  return {
    generatePrompt: isItalian ? 'Genera prompt' : 'Generate prompt',
    generatorTitle: isItalian ? 'Generatore prompt' : 'Prompt generator',
    generatorSubtitle: isItalian
      ? 'Rispondi a ~10 domande e genera un prompt su misura.'
      : 'Answer ~10 questions and generate a tailored prompt.',
    back: isItalian ? 'Indietro' : 'Back',
    next: isItalian ? 'Avanti' : 'Next',
    cancel: isItalian ? 'Annulla' : 'Cancel',
    apply: isItalian ? 'Genera e applica' : 'Generate & apply',
    generating: isItalian ? 'Generazione€¦' : 'Generating€¦',
    apiKeyMissing: isItalian
      ? 'Funzione disponibile solo dopo aver configurato la chiave API del provider LLM.'
      : 'This feature is available only after configuring the LLM provider API key.',
    generatedOk: isItalian ? 'Prompt generato e applicato.' : 'Prompt generated and applied.',
    genericError: isItalian ? 'Impossibile generare il prompt.' : 'Unable to generate prompt.'
  };
}

function getPromptWizardSteps(isItalian: boolean): PromptWizardStep[] {
  return [
    {
      key: 'botType',
      title: isItalian ? 'Tipo di assistente' : 'Assistant type',
      helper: isItalian
        ? 'Scegli lo scenario principale (supporto, vendite, tecnico€¦).'
        : 'Pick the primary scenario (support, sales, technical€¦).',
      input: 'select'
    },
    {
      key: 'businessContext',
      title: isItalian ? 'Contesto aziendale' : 'Business context',
      helper: isItalian
        ? 'Che azienda è? Cosa vendi/offri? Quali prodotti/servizi?'
        : 'What business is this? What do you sell/offer?',
      input: 'textarea'
    },
    {
      key: 'targetUsers',
      title: isItalian ? 'Utenti target' : 'Target users',
      helper: isItalian
        ? 'Chi ti contatta? (B2C/B2B, livello di competenza, segmenti).'
        : 'Who will contact you? (B2C/B2B, expertise level, segments).',
      input: 'textarea'
    },
    {
      key: 'goals',
      title: isItalian ? 'Obiettivi' : 'Goals',
      helper: isItalian
        ? 'Cosa deve ottenere il bot? (risolvere problemi, prenotare, vendere, ridurre ticket€¦).'
        : 'What should the bot achieve? (resolve issues, book meetings, sell, reduce tickets€¦).',
      input: 'textarea'
    },
    {
      key: 'actionsAndData',
      title: isItalian ? 'Azioni e dati' : 'Actions & data',
      helper: isItalian
        ? 'Cosa può fare il bot e che dati può chiedere? (es. ordine, email, riferimento).'
        : 'What can the bot do and what info can it request? (e.g., order number, email, reference).',
      input: 'textarea'
    },
    {
      key: 'tone',
      title: isItalian ? 'Tono di voce' : 'Tone of voice',
      helper: isItalian
        ? 'Es: professionale, amichevole, diretto, premium, ironico (se appropriato).'
        : 'e.g., professional, friendly, direct, premium, witty (if appropriate).',
      input: 'textarea'
    },
    {
      key: 'language',
      title: isItalian ? 'Lingua' : 'Language',
      helper: isItalian
        ? 'Lingua principale e cosa fare se l€™utente scrive in un€™altra lingua.'
        : 'Primary language and what to do if the user writes in another language.',
      input: 'textarea'
    },
    {
      key: 'knowledgeSources',
      title: isItalian ? 'Fonti/knowledge base' : 'Knowledge sources',
      helper: isItalian
        ? 'Cosa deve usare il bot? (FAQ, documenti, policy, listini, procedure).'
        : 'What should the bot rely on? (FAQs, docs, policies, pricing, procedures).',
      input: 'textarea'
    },
    {
      key: 'constraints',
      title: isItalian ? 'Vincoli e policy' : 'Constraints & policies',
      helper: isItalian
        ? 'Cosa NON deve fare/dire? Regole su privacy, pagamenti, garanzie, promesse.'
        : 'What must it NOT do/say? Rules on privacy, payments, guarantees, promises.',
      input: 'textarea'
    },
    {
      key: 'escalation',
      title: isItalian ? 'Escalation a umano' : 'Human escalation',
      helper: isItalian
        ? 'Quando deve passare a un umano e quali informazioni raccogliere prima.'
        : 'When to hand off to a human and what to collect first.',
      input: 'textarea'
    }
  ];
}

export default function BotOverviewTab({ botId }: Props) {
  const { t, currentLang } = useTranslation();
  const isItalian = currentLang === 'it';
  const wizardCopy = getPromptWizardCopy(isItalian);
  const wizardSteps = getPromptWizardSteps(isItalian);
  const PROMPT_TEMPLATES = getPromptTemplates(isItalian);
  const router = useRouter();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editable name
  const [botName, setBotName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  // Editable fields
  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [model, setModel] = useState("gpt-5-mini");
  const [theme, setTheme] = useState({
    bg: "#ffffff",
    myText: "#000000",
    myBubble: "#4F46E5",
    botText: "#000000",
    botBubble: "#F3F4F6",
    topbarBg: "#4F46E5",
    topbarText: "#ffffff",
  });

  // Track if prompts have unsaved changes
  const [hasPromptChanges, setHasPromptChanges] = useState(false);
  const [promptsSaving, setPromptsSaving] = useState(false);

  // Prompt generator wizard
  const [showPromptWizard, setShowPromptWizard] = useState(false);
  const [promptWizardStepIndex, setPromptWizardStepIndex] = useState(0);
  const [promptWizardGenerating, setPromptWizardGenerating] = useState(false);
  const [promptWizardAnswers, setPromptWizardAnswers] = useState<PromptWizardAnswers>({
    botType: 'customer_support',
    businessContext: '',
    targetUsers: '',
    goals: '',
    actionsAndData: '',
    tone: '',
    language: isItalian ? 'it' : 'en',
    knowledgeSources: '',
    constraints: '',
    escalation: ''
  });

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Debounce timers (only for theme now)
  const themeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("API URL not configured");
        }

        const response = await fetch(`${apiUrl}/api/v1/bots/${botId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/login");
            return;
          }
          throw new Error("Failed to fetch bot");
        }

        const data = await response.json();
        setBot(data);

        setBotName(data.name || "");

        // Initialize editable fields
        setSystemPrompt(data.systemPrompt || "");
        setWelcomeMessage(data.welcomeMessage || "");
        setModel(data.model || "gpt-5-mini");

        if (data.theme) {
          setTheme({
            bg: data.theme.bg || "#ffffff",
            myText: data.theme.myText || "#000000",
            myBubble: data.theme.myBubble || "#4F46E5",
            botText: data.theme.botText || "#000000",
            botBubble: data.theme.botBubble || "#F3F4F6",
            topbarBg: data.theme.topbarBg || "#4F46E5",
            topbarText: data.theme.topbarText || "#ffffff",
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load bot");
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [botId, router]);

  const updateBot = async (updates: Partial<Bot>) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error("Invalid settings");
      }

      const response = await fetch(`${apiUrl}/api/v1/bots/${botId}`, {
        method: "PATCH",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update bot");
      }

      const updated = await response.json();
      setBot(updated);
      if (typeof (updated as any)?.name === 'string') {
        setBotName((updated as any).name);
      }
      showToast(t('bot.overview.savedSuccessfully'), "success");
      return updated;
    } catch (err: any) {
      showToast(err.message || t('bot.overview.failedToSave'), "error");
      throw err;
    }
  };

  // Handle prompt changes (no auto-save)
  const handleSystemPromptChange = (value: string) => {
    setSystemPrompt(value);
    setHasPromptChanges(true);
  };

  // Handle welcome message changes (no auto-save)
  const handleWelcomeMessageChange = (value: string) => {
    setWelcomeMessage(value);
    setHasPromptChanges(true);
  };

  // Apply prompt changes with explicit save
  const applyPromptChanges = async () => {
    setPromptsSaving(true);
    try {
      await updateBot({ systemPrompt, welcomeMessage });
      setHasPromptChanges(false);
      // Revalidate cache if needed (Next.js will handle this on next load)
    } catch (err) {
      // Error already handled by updateBot
    } finally {
      setPromptsSaving(false);
    }
  };

  const applyNameChange = async () => {
    const trimmed = botName.trim();
    if (!trimmed) {
      showToast(t('bot.overview.botNameRequired'), 'error');
      return;
    }

    setNameSaving(true);
    try {
      await updateBot({ name: trimmed } as any);
      setIsEditingName(false);
    } finally {
      setNameSaving(false);
    }
  };

  // Apply prompt template
  const handleTemplateSelect = (templateName: string) => {
    if (!templateName) return;

    const template = PROMPT_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setSystemPrompt(template.systemPrompt);
      setWelcomeMessage(template.welcomeMessage);
      setHasPromptChanges(true);
    }
  };

  const resetPromptWizard = () => {
    setPromptWizardStepIndex(0);
    setPromptWizardGenerating(false);
    setPromptWizardAnswers({
      botType: 'customer_support',
      businessContext: '',
      targetUsers: '',
      goals: '',
      actionsAndData: '',
      tone: '',
      language: isItalian ? 'it' : 'en',
      knowledgeSources: '',
      constraints: '',
      escalation: ''
    });
  };

  const handleGeneratePrompt = async () => {
    if (promptWizardGenerating) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      showToast(wizardCopy.genericError, 'error');
      return;
    }

    try {
      setPromptWizardGenerating(true);
      const response = await fetch(`${apiUrl}/api/v1/bots/${botId}/prompt/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: promptWizardAnswers })
      });

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const message = json?.error || json?.message;
        if (response.status === 503) {
          showToast(message || wizardCopy.apiKeyMissing, 'error');
          return;
        }
        showToast(message || wizardCopy.genericError, 'error');
        return;
      }

      if (typeof json?.systemPrompt === 'string' && json.systemPrompt.length > 0) {
        setSystemPrompt(json.systemPrompt);
      }
      if (typeof json?.welcomeMessage === 'string' && json.welcomeMessage.length > 0) {
        setWelcomeMessage(json.welcomeMessage);
      }

      setHasPromptChanges(true);
      showToast(wizardCopy.generatedOk, 'success');
      setShowPromptWizard(false);
    } catch (err) {
      console.error(err);
      showToast(wizardCopy.genericError, 'error');
    } finally {
      setPromptWizardGenerating(false);
    }
  };

  // Immediate save for model
  const handleModelChange = async (value: string) => {
    setModel(value);
    await updateBot({ model: value } as any);
  };

  // Debounced save for theme
  const handleThemeChange = (key: string, value: string) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);

    if (themeTimerRef.current) {
      clearTimeout(themeTimerRef.current);
    }

    themeTimerRef.current = setTimeout(() => {
      updateBot({ theme: newTheme } as any);
    }, 500);
  };

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast(t('bot.overview.uploadImageFile'), "error");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast(t('bot.overview.imageTooLarge'), "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error("Invalid settings");
      }

      const response = await fetch(`${apiUrl}/api/v1/bots/${botId}/logo`, {
        method: "POST",
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const { logoUrl } = await response.json();
      setBot(bot ? { ...bot, logoUrl } : null);
      showToast(t('bot.overview.logoUploadSuccess'), "success");
    } catch (err: any) {
      showToast(err.message || t('bot.overview.failedToUploadLogo'), "error");
    }
  };

  const handlePublishToggle = async () => {
    if (!bot) return;
    await updateBot({ published: !bot.published });
  };

  const handleDelete = async () => {
    if (!bot || !confirm(t('bot.overview.confirmDelete').replace('{name}', bot.name))) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error("Invalid settings");
      }

      const response = await fetch(`${apiUrl}/api/v1/bots/${bot.id}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to delete bot");
      }

      router.push("/dashboard/bots");
    } catch (err: any) {
      showToast(err.message || t('bot.overview.failedToDelete'), "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="text-charcoal font-medium">{t('bot.overview.loadingBotDetails')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!bot) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-500/20 border border-green-300 text-green-800"
              : toast.type === "error"
              ? "bg-red-100 border border-red-300 text-red-300"
              : "bg-blue-100 border border-blue-300 text-blue-300"
          }`}
        >
          {toast.type === "success" && <Check size={20} />}
          {toast.type === "error" && <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="glass-effect backdrop-blur-md rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Logo */}
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                {bot.logoUrl ? (
                  <img src={bot.logoUrl} alt={bot.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-silver-600">
                    {bot.name ? bot.name.charAt(0).toUpperCase() : 'B'}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-1.5 bg-charcoal text-pearl rounded-full cursor-pointer hover:bg-charcoal/90 shadow-lg">
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="sr-only" htmlFor="bot-name">
                      {t('bot.overview.botName')}
                    </label>
                    <input
                      id="bot-name"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="w-full sm:w-auto min-w-[220px] px-3 py-2 rounded-lg bg-pearl-50 border border-silver-200/70 text-charcoal placeholder:text-silver-400 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                      placeholder={t('bot.overview.botNamePlaceholder')}
                    />
                    <button
                      onClick={applyNameChange}
                      disabled={nameSaving}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-60"
                    >
                      <Save size={16} />
                      {nameSaving ? t('bot.overview.saving') : t('common.save')}
                    </button>
                    <button
                      onClick={() => {
                        setBotName(bot.name || "");
                        setIsEditingName(false);
                      }}
                      disabled={nameSaving}
                      className="px-3 py-2 rounded-lg glass-effect border border-silver-200/70 text-silver-600 text-sm font-medium hover:bg-pearl-100/60 disabled:opacity-60"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-charcoal">{bot.name}</h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass-effect border border-silver-200/70 text-silver-600 text-sm font-medium hover:bg-pearl-100/60"
                    >
                      <Pencil size={16} />
                      {t('common.edit')}
                    </button>
                  </div>
                )}
                {bot.published ? (
                  <span className="px-3 py-1 bg-green-500/20 text-green-800 text-sm font-medium rounded-full">
                    {t('bots.published')}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-pearl-50/60 text-charcoal text-sm font-medium rounded-full">
                    {t('bots.draft')}
                  </span>
                )}
              </div>
              {bot.description && (
                <p className="text-silver-600 text-sm">{bot.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePublishToggle}
              className="px-4 py-2 glass-effect backdrop-blur-md border border-silver-200/70 text-silver-600 rounded-lg hover:bg-pearl-100/60 font-medium text-sm"
            >
              {bot.published ? t('bot.overview.unpublish') : t('bot.overview.publish')}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-charcoal rounded-lg hover:bg-red-700 font-medium text-sm"
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-effect backdrop-blur-md p-6 rounded-lg shadow">
          <div className="text-sm text-silver-600 font-medium mb-2">{t('nav.conversations')}</div>
          <div className="text-3xl font-bold text-charcoal">{bot._count?.conversations ?? 0}</div>
        </div>
        <div className="glass-effect backdrop-blur-md p-6 rounded-lg shadow">
          <div className="text-sm text-silver-600 font-medium mb-2">{t('nav.documents')}</div>
          <div className="text-3xl font-bold text-charcoal">{bot._count?.documents ?? 0}</div>
        </div>
        <div className="glass-effect backdrop-blur-md p-6 rounded-lg shadow">
          <div className="text-sm text-silver-600 font-medium mb-2">{t('bot.overview.intents')}</div>
          <div className="text-3xl font-bold text-charcoal">{bot._count?.intents ?? 0}</div>
        </div>
        <div className="glass-effect backdrop-blur-md p-6 rounded-lg shadow">
          <div className="text-sm text-silver-600 font-medium mb-2">{t('bot.overview.faqs')}</div>
          <div className="text-3xl font-bold text-charcoal">{bot._count?.faqs ?? 0}</div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="glass-effect backdrop-blur-md rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-charcoal mb-4">{t('bot.overview.model')}</h2>
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-4 py-2 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent bg-pearl-50 text-charcoal [&>option]:text-black"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-silver-600 mt-2">
          {t('bot.overview.modelHelp')}
        </p>
      </div>

      {/* Prompts */}
      <div className="glass-effect backdrop-blur-md rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-charcoal">{t('bot.overview.promptsAndMessages')}</h2>
          {hasPromptChanges && (
            <button
              onClick={applyPromptChanges}
              disabled={promptsSaving}
              className="px-4 py-2 bg-charcoal text-pearl rounded-lg hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
            >
              {promptsSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('bot.overview.applying')}
                </>
              ) : (
                <>
                  <Check size={16} />
                  {t('bot.overview.applyChanges')}
                </>
              )}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Prompt Templates Dropdown */}
          <div>
            <label className="block text-sm font-medium text-silver-600 mb-2">
              {t('bot.overview.promptTemplate')}
            </label>
            <div className="flex items-center gap-3">
              <select
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="flex-1 px-4 py-2 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent bg-pearl-50 text-charcoal [&>option]:text-black"
                defaultValue=""
              >
                <option value="">{t('bot.overview.selectTemplate')}</option>
                {PROMPT_TEMPLATES.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  resetPromptWizard();
                  setShowPromptWizard((v) => !v);
                }}
                className="px-4 py-2 border border-silver-200/70 rounded-lg bg-pearl-50 text-charcoal hover:bg-pearl-100/60"
              >
                {wizardCopy.generatePrompt}
              </button>
            </div>
            <p className="text-xs text-silver-500 mt-1">
              {t('bot.overview.promptTemplateHelp')}
            </p>

            {showPromptWizard && (
              <div className="mt-3 rounded-lg border border-silver-200/70 bg-pearl-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-charcoal font-medium">{wizardCopy.generatorTitle}</div>
                    <div className="text-silver-600 text-sm">{wizardCopy.generatorSubtitle}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPromptWizard(false)}
                    className="text-silver-600 hover:text-charcoal"
                  >
                    {wizardCopy.cancel}
                  </button>
                </div>

                <div className="mt-4">
                  <div className="text-silver-600 text-sm">
                    {promptWizardStepIndex + 1} / {wizardSteps.length}
                  </div>
                  <div className="mt-1 text-charcoal font-medium">
                    {wizardSteps[promptWizardStepIndex].title}
                  </div>
                  {wizardSteps[promptWizardStepIndex].helper && (
                    <div className="mt-1 text-silver-600 text-sm">{wizardSteps[promptWizardStepIndex].helper}</div>
                  )}

                  <div className="mt-3">
                    {wizardSteps[promptWizardStepIndex].input === 'select' ? (
                      <select
                        value={promptWizardAnswers.botType}
                        onChange={(e) =>
                          setPromptWizardAnswers((prev) => ({
                            ...prev,
                            botType: e.target.value as PromptWizardAnswers['botType']
                          }))
                        }
                        className="w-full px-4 py-2 border border-silver-200/70 rounded-lg bg-pearl-50 text-charcoal [&>option]:text-black"
                      >
                        <option value="customer_support">{isItalian ? 'Customer support' : 'Customer support'}</option>
                        <option value="sales">{isItalian ? 'Vendite' : 'Sales'}</option>
                        <option value="technical_support">{isItalian ? 'Supporto tecnico' : 'Technical support'}</option>
                        <option value="faq">{isItalian ? 'FAQ' : 'FAQ'}</option>
                        <option value="general">{isItalian ? 'Generico' : 'General'}</option>
                        <option value="other">{isItalian ? 'Altro' : 'Other'}</option>
                      </select>
                    ) : (
                      <textarea
                        value={String(promptWizardAnswers[wizardSteps[promptWizardStepIndex].key] ?? '')}
                        onChange={(e) =>
                          setPromptWizardAnswers((prev) => ({
                            ...prev,
                            [wizardSteps[promptWizardStepIndex].key]: e.target.value
                          }))
                        }
                        rows={4}
                        className="w-full px-4 py-2 border border-silver-200/70 rounded-lg bg-pearl-50 text-charcoal"
                      />
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPromptWizardStepIndex((i) => Math.max(0, i - 1))}
                      disabled={promptWizardStepIndex === 0 || promptWizardGenerating}
                      className="px-3 py-2 border border-silver-200/70 rounded-lg bg-transparent text-charcoal hover:bg-pearl-100/60 disabled:opacity-50"
                    >
                      {wizardCopy.back}
                    </button>

                    {promptWizardStepIndex < wizardSteps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setPromptWizardStepIndex((i) => Math.min(wizardSteps.length - 1, i + 1))}
                        disabled={promptWizardGenerating}
                        className="px-3 py-2 border border-silver-200/70 rounded-lg bg-pearl-50/60 text-charcoal hover:bg-white/15 disabled:opacity-50"
                      >
                        {wizardCopy.next}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGeneratePrompt}
                        disabled={promptWizardGenerating}
                        className="px-3 py-2 border border-silver-200/70 rounded-lg bg-pearl-50/60 text-charcoal hover:bg-white/15 disabled:opacity-50"
                      >
                        {promptWizardGenerating ? wizardCopy.generating : wizardCopy.apply}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-silver-600 mb-2">
              {t('bot.overview.welcomeMessage')}
            </label>
            <input
              type="text"
              value={welcomeMessage}
              onChange={(e) => handleWelcomeMessageChange(e.target.value)}
              placeholder="Hi! How can I help you today?"
              className="w-full px-4 py-2 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent bg-pearl-50 text-charcoal"
            />
            <p className="text-xs text-silver-500 mt-1">
              {hasPromptChanges ? t('bot.overview.clickToSave') : t('bot.overview.welcomeMessageHelp')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-silver-600 mb-2">
              {t('bot.overview.systemPrompt')}
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
              placeholder="You are a helpful assistant..."
              rows={6}
              className="w-full px-4 py-2 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent font-mono text-sm bg-pearl-50 text-charcoal"
            />
            <p className="text-xs text-silver-500 mt-1">
              {hasPromptChanges ? t('bot.overview.clickToSave') : t('bot.overview.systemPromptHelp')}
            </p>
          </div>
        </div>
      </div>

      {/* Theme Customization */}
      <div className="glass-effect backdrop-blur-md rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-charcoal mb-4">{t('bot.overview.theme')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries({
            bg: t('bot.overview.background'),
            myText: t('bot.overview.userTextColor'),
            myBubble: t('bot.overview.userBubbleColor'),
            botText: t('bot.overview.botTextColor'),
            botBubble: t('bot.overview.botBubbleColor'),
            topbarBg: t('bot.overview.headerBackground'),
            topbarText: t('bot.overview.headerTextColor'),
          }).map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-silver-600 mb-2">
                {label}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme[key as keyof typeof theme]}
                  onChange={(e) => handleThemeChange(key, e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-silver-200/70 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme[key as keyof typeof theme]}
                  onChange={(e) => handleThemeChange(key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-silver-200/70 rounded-lg font-mono text-sm bg-pearl-50 text-charcoal"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-silver-500 mt-4">
          {t('bot.overview.themeAutoSave')}
        </p>
      </div>

      {/* Widget Code */}
      {bot.published && (
        <div className="glass-effect backdrop-blur-md rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-charcoal mb-4">{t('bot.overview.widgetEmbedCode')}</h2>
          <p className="text-silver-600 mb-3 text-sm">
            {t('bot.overview.embedInstructions')}
          </p>
          <pre className="bg-gray-900 text-white text-xs p-4 rounded-lg overflow-x-auto">
{`<script src="https://chatbot-studio.pages.dev/widget.js"></script>
<script>
  ChatbotWidget.init({
    botId: '${bot.id}',
    apiUrl: '${process.env.NEXT_PUBLIC_API_URL}'
  });
</script>`}
          </pre>
        </div>
      )}
    </div>
  );
}

