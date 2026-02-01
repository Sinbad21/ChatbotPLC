'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Bot,
 FileText,
 MessageSquare,
 Sparkles,
 ArrowRight,
 Check,
 X,
 Rocket,
} from 'lucide-react';

interface OnboardingStep {
 id: string;
 title: string;
 description: string;
 icon: React.ReactNode;
 action: string;
 href: string;
 completed: boolean;
}

interface OnboardingProps {
 userName?: string;
 hasBots: boolean;
 hasDocuments: boolean;
 hasConversations: boolean;
 onDismiss: () => void;
}

export default function Onboarding({
 userName,
 hasBots,
 hasDocuments,
 hasConversations,
 onDismiss,
}: OnboardingProps) {
 const router = useRouter();
 const [currentStep, setCurrentStep] = useState(0);
 const [showWelcome, setShowWelcome] = useState(true);

 const steps: OnboardingStep[] = [
  {
   id: 'create-bot',
   title: 'Crea il tuo primo chatbot',
   description: 'Inizia creando un assistente AI personalizzato per il tuo business.',
   icon: <Bot className="w-6 h-6" />,
   action: 'Crea Bot',
   href: '/dashboard/create-bot',
   completed: hasBots,
  },
  {
   id: 'add-knowledge',
   title: 'Aggiungi la tua knowledge base',
   description: 'Carica documenti, FAQ o testi per addestrare il tuo chatbot.',
   icon: <FileText className="w-6 h-6" />,
   action: 'Aggiungi Documenti',
   href: '/dashboard/bots',
   completed: hasDocuments,
  },
  {
   id: 'test-chat',
   title: 'Testa il tuo chatbot',
   description: 'Prova una conversazione per vedere come risponde il tuo assistente.',
   icon: <MessageSquare className="w-6 h-6" />,
   action: 'Inizia Chat',
   href: '/dashboard/bots',
   completed: hasConversations,
  },
 ];

 const completedSteps = steps.filter((s) => s.completed).length;
 const progress = (completedSteps / steps.length) * 100;

 // Find first incomplete step
 useEffect(() => {
  const firstIncomplete = steps.findIndex((s) => !s.completed);
  if (firstIncomplete !== -1) {
   setCurrentStep(firstIncomplete);
  }
 }, [hasBots, hasDocuments, hasConversations]);

 const handleStepClick = (step: OnboardingStep) => {
  if (!step.completed) {
   router.push(step.href);
  }
 };

 // Welcome screen for first-time users
 if (showWelcome && !hasBots) {
  return (
   <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
   >
    <motion.div
     initial={{ scale: 0.9, opacity: 0 }}
     animate={{ scale: 1, opacity: 1 }}
     transition={{ delay: 0.1 }}
     className="relative max-w-lg w-full mx-4 bg-pearl-50 border border-silver-200/70 rounded-2xl p-8 shadow-silver-lg"
    >
     <button
      onClick={onDismiss}
      className="absolute top-4 right-4 p-2 text-silver-500 hover:text-charcoal transition-colors"
     >
      <X size={20} />
     </button>

     <div className="text-center">
      <motion.div
       initial={{ scale: 0 }}
       animate={{ scale: 1 }}
       transition={{ delay: 0.2, type: 'spring' }}
       className="w-20 h-20 mx-auto mb-6 bg-charcoal rounded-2xl flex items-center justify-center shadow-pearl"
      >
       <Sparkles className="w-10 h-10 text-pearl" />
      </motion.div>

      <h1 className="text-2xl font-bold text-charcoal mb-2">
       Benvenuto{userName ? `, ${userName.split(' ')[0]}` : ''}!
      </h1>
      <p className="text-silver-600 mb-8">
       Sei a pochi passi dal creare il tuo primo chatbot AI. Ti guideremo attraverso il processo.
      </p>

      <div className="space-y-3 mb-8 text-left">
       {steps.map((step, index) => (
        <div
         key={step.id}
         className="flex items-center gap-3 p-3 rounded-lg bg-pearl-50 border border-silver-200/70"
        >
         <div className="w-8 h-8 rounded-full bg-pearl-100 flex items-center justify-center text-silver-700 text-sm font-medium">
          {index + 1}
         </div>
         <span className="text-silver-700 text-sm">{step.title}</span>
        </div>
       ))}
      </div>

      <button
       onClick={() => setShowWelcome(false)}
       className="w-full px-6 py-3 bg-charcoal text-pearl rounded-lg hover:bg-charcoal/90 font-medium transition-all shadow-lg flex items-center justify-center gap-2"
      >
       <Rocket className="w-5 h-5" />
       Inizia Ora
      </button>
     </div>
    </motion.div>
   </motion.div>
  );
 }

 // Compact progress card for dashboard
 return (
  <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   className="bg-pearl-50/90 backdrop-blur-md border border-silver-200/70 rounded-2xl p-6 mb-6"
  >
   <div className="flex items-start justify-between mb-4">
    <div>
     <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-silver-700" />
      Inizia con OMNICAL STUDIO
     </h2>
     <p className="text-sm text-silver-600 mt-1">
      Completa questi passaggi per configurare il tuo primo chatbot
     </p>
    </div>
    <button
     onClick={onDismiss}
     className="p-1.5 text-silver-500 hover:text-charcoal transition-colors"
     title="Nascondi guida"
    >
     <X size={18} />
    </button>
   </div>

   {/* Progress bar */}
   <div className="mb-6">
    <div className="flex justify-between text-xs text-silver-600 mb-2">
     <span>Progresso</span>
     <span>{completedSteps}/{steps.length} completati</span>
    </div>
    <div className="h-2 bg-pearl-200/70 rounded-full overflow-hidden">
     <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="h-full bg-charcoal"
     />
    </div>
   </div>

   {/* Steps */}
   <div className="space-y-3">
    {steps.map((step, index) => (
     <motion.button
      key={step.id}
      onClick={() => handleStepClick(step)}
      disabled={step.completed}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
       step.completed
        ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default'
        : index === currentStep
        ? 'bg-pearl-100/60 border-silver-300 hover:bg-pearl-100/80'
        : 'bg-pearl-50 border-silver-200/70 hover:bg-pearl-100/60'
      }`}
      whileHover={!step.completed ? { scale: 1.01 } : {}}
      whileTap={!step.completed ? { scale: 0.99 } : {}}
     >
      <div
       className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        step.completed
         ? 'bg-emerald-500/10 text-emerald-700'
         : index === currentStep
         ? 'bg-charcoal/5 text-charcoal'
         : 'bg-pearl-100 text-silver-700'
       }`}
      >
       {step.completed ? <Check className="w-5 h-5" /> : step.icon}
      </div>

      <div className="flex-1 min-w-0">
       <h3
        className={`font-medium ${
         step.completed ? 'text-emerald-700' : 'text-charcoal'
        }`}
       >
        {step.title}
       </h3>
       <p className="text-xs text-silver-600 mt-0.5 truncate">
        {step.description}
       </p>
      </div>

      {!step.completed && (
       <div className="flex items-center gap-2 text-sm font-medium text-charcoal whitespace-nowrap">
        {step.action}
        <ArrowRight className="w-4 h-4" />
       </div>
      )}

      {step.completed && (
       <span className="text-xs font-medium text-emerald-700 bg-emerald-500/10 px-2 py-1 rounded">
        Completato
       </span>
      )}
     </motion.button>
    ))}
   </div>

   {/* All done message */}
   {completedSteps === steps.length && (
    <motion.div
     initial={{ opacity: 0, y: 10 }}
     animate={{ opacity: 1, y: 0 }}
     className="mt-4 p-4 bg-pearl-50 border border-silver-200/70 rounded-xl text-center"
    >
     <p className="text-emerald-700 font-medium">
      Fantastico! Hai completato tutti i passaggi iniziali.
     </p>
     <button
      onClick={onDismiss}
      className="mt-2 text-sm text-silver-600 hover:text-charcoal underline"
     >
      Nascondi questa guida
     </button>
    </motion.div>
   )}
  </motion.div>
 );
}




