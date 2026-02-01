"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LayoutGrid, FileText, Globe, Lightbulb, HelpCircle, MessageSquare, BarChart2 } from "lucide-react";
import BotOverviewTab from "../BotOverviewTab";
import DocumentsTab from "../DocumentsTab";
import IntentsTab from "../IntentsTab";
import FaqTab from "../FaqTab";
import TestChatTab from "../TestChatTab";
import WebScrapingTab from "../WebScrapingTab";
import AnalyticsTab from "../AnalyticsTab";
import { GlassCard } from "@/components/dashboard/ui";

type TabKey = "overview" | "documents" | "scraping" | "intents" | "faqs" | "analytics" | "test";

const tabs = [
  { key: "overview" as TabKey, label: "Overview", icon: LayoutGrid },
  { key: "documents" as TabKey, label: "Documents", icon: FileText },
  { key: "scraping" as TabKey, label: "Web Scraping", icon: Globe },
  { key: "intents" as TabKey, label: "Intents", icon: Lightbulb },
  { key: "faqs" as TabKey, label: "FAQ", icon: HelpCircle },
  { key: "analytics" as TabKey, label: "Analytics", icon: BarChart2 },
  { key: "test" as TabKey, label: "Test", icon: MessageSquare },
];

export default function BotPage() {
  const params = useParams();
  const botId = params.botId as string;
  const [activeTab, setActiveTab] = useState<TabKey>("documents");

  const apiBaseUrl = useMemo(() => {
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_API_URL;
    const fallbackUrl = process.env.NEXT_PUBLIC_API_URL;
    return workerUrl || fallbackUrl || "";
  }, []);

  if (!botId) {
    return (
      <div className="p-16 text-sm text-red-400">Bot ID mancante</div>
    );
  }

  if (!apiBaseUrl) {
    return (
      <div className="p-16 text-sm text-red-400">
        Configura NEXT_PUBLIC_WORKER_API_URL o NEXT_PUBLIC_API_URL per usare le API.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard className="flex gap-2 p-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? "bg-charcoal text-white"
                  : "text-silver-700 hover:text-charcoal hover:bg-pearl-100/60"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </GlassCard>

      {activeTab === "overview" && <BotOverviewTab botId={botId} />}

      {activeTab === "documents" && (
        <DocumentsTab botId={botId} apiBaseUrl={apiBaseUrl} />
      )}

      {activeTab === "scraping" && (
        <WebScrapingTab botId={botId} apiBaseUrl={apiBaseUrl} />
      )}

      {activeTab === "intents" && (
        <IntentsTab botId={botId} apiBaseUrl={apiBaseUrl} />
      )}

      {activeTab === "faqs" && <FaqTab botId={botId} apiBaseUrl={apiBaseUrl} />}

      {activeTab === "analytics" && (
        <AnalyticsTab botId={botId} apiBaseUrl={apiBaseUrl} />
      )}

      {activeTab === "test" && (
        <TestChatTab botId={botId} apiBaseUrl={apiBaseUrl} />
      )}
    </div>
  );
}
