import React, { useEffect, useState } from "react";
import { 
  Sprout, 
  ScanLine, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  GraduationCap, 
  ThermometerSun, 
  Info,
  ArrowRight
} from "lucide-react";
import { getAllRecords, seedDatabaseIfEmpty } from "../db";
import { Crop, Disease, Prediction, DocumentRecord } from "../types";

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export default function Home({ setActiveTab }: HomeProps) {
  const [stats, setStats] = useState({
    crops: 0,
    diseases: 0,
    predictions: 0,
    documents: 0
  });

  useEffect(() => {
    async function loadStats() {
      try {
        await seedDatabaseIfEmpty();
        const crops = await getAllRecords<Crop>("crops");
        const diseases = await getAllRecords<Disease>("diseases");
        const predictions = await getAllRecords<Prediction>("predictions");
        const documents = await getAllRecords<DocumentRecord>("documents");

        setStats({
          crops: crops.length,
          diseases: diseases.length,
          predictions: predictions.length,
          documents: documents.length
        });
      } catch (err) {
        console.error("Failed to load home statistics", err);
      }
    }
    loadStats();
  }, []);

  const modules = [
    {
      id: "detect",
      title: "Disease Diagnosis",
      desc: "Upload or capture crop leaf images using Gemini's high-accuracy multimodal vision.",
      icon: ScanLine,
      color: "bg-[#2E7D32] text-white",
      hoverColor: "hover:border-[#2E7D32]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "explorer",
      title: "Crop Encyclopedia",
      desc: "Browse a filterable directory of leaf anomalies, symptoms, pathogens, and citations.",
      icon: BookOpen,
      color: "bg-[#1B5E20] text-white",
      hoverColor: "hover:border-[#1B5E20]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "comparison",
      title: "Healthy vs Infected",
      desc: "Side-by-side comparative atlas to visually study pathogen leaf patterns.",
      icon: Layers,
      color: "bg-[#795548] text-white",
      hoverColor: "hover:border-[#795548]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "prevention",
      title: "Prevention Therapy",
      desc: "Discover organic controls, bio-pesticides, integrated chemical limits, and soil care.",
      icon: ShieldCheck,
      color: "bg-[#388E3C] text-white",
      hoverColor: "hover:border-[#388E3C]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "analytics",
      title: "Agri Analytics",
      desc: "Interactive data dashboards with distribution charts, timeline counters, and risk filters.",
      icon: BarChart3,
      color: "bg-[#2E7D32] text-white",
      hoverColor: "hover:border-[#2E7D32]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "chatbot",
      title: "Agronomist Chatbot",
      desc: "Ask general crop health queries backed by automatic reference document context.",
      icon: MessageSquare,
      color: "bg-[#1B5E20] text-white",
      hoverColor: "hover:border-[#1B5E20]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "documents",
      title: "Doc Intelligence",
      desc: "Upload PDFs (agri pamphlets or scientific bulletins) for client-side parsing & semantic Q&A.",
      icon: FileText,
      color: "bg-[#795548] text-white",
      hoverColor: "hover:border-[#795548]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "quiz",
      title: "Extension Quiz",
      desc: "Generate custom, AI-powered multi-format quizzes with in-depth scientific answers.",
      icon: GraduationCap,
      color: "bg-[#388E3C] text-white",
      hoverColor: "hover:border-[#388E3C]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "simulation",
      title: "Risk Simulator",
      desc: "Manipulate environment variables (rain, heat, dew) to test rule-based pathogen outbreak.",
      icon: ThermometerSun,
      color: "bg-[#EF6C00] text-white",
      hoverColor: "hover:border-[#EF6C00]/50 hover:bg-[#FDFBF7]"
    },
    {
      id: "about",
      title: "About Platform",
      desc: "Technical details, project stack specifications, and development architecture roadmap.",
      icon: Info,
      color: "bg-[#5D6B5F] text-white",
      hoverColor: "hover:border-[#5D6B5F]/50 hover:bg-[#FDFBF7]"
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in" id="home_tab">
      {/* Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#795548] p-8 md:p-12 text-white shadow-xl shadow-[#2E7D32]/10">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
          <Sprout size={400} />
        </div>
        <div className="relative max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-[#F1F8E9] backdrop-blur-sm">
            <Sprout size={14} />
            AI-Driven Agronomic Intelligence
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl text-white">
            KrishiVigyan
          </h1>
          <p className="text-[#F1F8E9]/95 text-lg leading-relaxed font-sans">
            Empowering growers, students, and agronomists with server-side Gemini crop diagnosis, 
            local PDF document intelligence, risk simulations, and interactive learning.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => setActiveTab("detect")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B5E20] px-5 py-3 font-semibold text-white shadow-lg shadow-[#1B5E20]/25 transition hover:bg-[#2E7D32] hover:scale-[1.02] active:scale-[0.98]"
            >
              <ScanLine size={18} />
              Diagnose a Leaf Spot
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => setActiveTab("chatbot")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              Consult AI Expert
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Crops Cataloged", value: stats.crops, icon: Sprout, color: "text-[#2E7D32] bg-[#F1F8E9]" },
          { label: "Outbreaks Tracked", value: stats.diseases, icon: ShieldCheck, color: "text-[#EF6C00] bg-[#FFF3E0]" },
          { label: "AI Diagnoses Made", value: stats.predictions, icon: ScanLine, color: "text-[#2E7D32] bg-[#E8F5E9]" },
          { label: "Reference Docs Loaded", value: stats.documents, icon: FileText, color: "text-[#0277BD] bg-[#E1F5FE]" }
        ].map((m, idx) => (
          <div key={idx} className="flex items-center gap-4 rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs">
            <div className={`rounded-xl p-3 ${m.color}`}>
              <m.icon size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1B3022] font-mono">{m.value}</div>
              <div className="text-xs font-semibold text-[#5D6B5F]">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Module Navigation Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#1B3022]">Explore Agricultural Intelligence</h2>
          <p className="text-sm text-[#5D6B5F]">Access and coordinate KrishiVigyan's functional research suites</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const IconComponent = m.icon;
            return (
              <div 
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                className={`group cursor-pointer rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-md ${m.hoverColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-3 ${m.color} shadow-xs`}>
                    <IconComponent size={22} />
                  </div>
                  <div className="rounded-full bg-[#FDFBF7] p-1.5 text-slate-400 transition group-hover:bg-[#E8F5E9] group-hover:text-[#2E7D32]">
                    <ArrowRight size={14} className="transition duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
                <h3 className="font-display mt-5 text-lg font-bold text-[#1B3022] group-hover:text-[#2E7D32]">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm text-[#5D6B5F] leading-relaxed">
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
