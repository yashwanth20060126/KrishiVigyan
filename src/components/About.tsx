import React from "react";
import { 
  Cpu, 
  Database, 
  FileText, 
  Sprout, 
  Layers 
} from "lucide-react";

export default function About() {
  return (
    <div className="space-y-8 animate-fade-in" id="about_tab">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
          <Layers className="text-[#2E7D32]" size={28} />
          About KrishiVigyan
        </h1>
        <p className="text-[#5D6B5F] font-sans">
          Discover the technology stack, dual-model architecture, and security design underlying our AI-based crop intelligence platform.
        </p>
      </div>

      {/* Main layout */}
      <div className="grid gap-8 md:grid-cols-12">
        {/* Core Description */}
        <div className="md:col-span-8 space-y-6">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="font-display text-xl font-bold text-[#1B3022]">Agricultural Intelligence Redefined</h2>
            <p className="text-sm text-[#5D6B5F] leading-relaxed font-sans">
              <strong>KrishiVigyan</strong> is an advanced, offline-first digital agricultural platform designed to empower farmers, extension agents, and agronomy researchers. By merging fast, locally embedded databases with Gemini's state-of-the-art multimodal vision and text-reasoning intelligence, KrishiVigyan delivers immediate crop pathology diagnoses, interactive weather-risk simulators, and automated educational classrooms directly in the field.
            </p>
            <p className="text-sm text-[#5D6B5F] leading-relaxed font-sans">
              To guarantee absolute data privacy and offline integrity, all crops, disease catalogs, user leaf diagnoses, training summaries, and leaderboard statistics are securely stored on your own device using browser-native <strong>IndexedDB</strong>. Data models mirror SQLite-style relational entities, which can be exported or imported as structured files at any time.
            </p>
          </div>

          {/* Dual-Model Strategy */}
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-[#1B3022] flex items-center gap-2">
              <Cpu className="text-[#2E7D32]" size={20} />
              Dual-Model AI Architecture Strategy
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-[#E8E5DF]/60 rounded-xl p-4 bg-[#FDFBF7]/50 space-y-1.5">
                <div className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-sm inline-block">
                  Gemini 2.5 Flash
                </div>
                <div className="text-sm font-bold text-[#1B3022]">High-Speed & Interactive Tasks</div>
                <p className="text-xs text-[#5D6B5F] leading-normal font-sans">
                  Allocated to generate randomized multi-format extension quizzes, drive fluid RAG conversational chatbots, and handle real-time simulation weather-risk explanations.
                </p>
              </div>

              <div className="border border-[#E8E5DF]/60 rounded-xl p-4 bg-[#FDFBF7]/50 space-y-1.5">
                <div className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-sm inline-block">
                  Gemini 2.5 Pro
                </div>
                <div className="text-sm font-bold text-[#1B3022]">Pathology Diagnosis</div>
                <p className="text-xs text-[#5D6B5F] leading-normal font-sans">
                  Deployed for high-accuracy crop leaf symptom identification and complex scientific reasoning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="md:col-span-4 space-y-6">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-display text-base font-bold text-[#1B3022]">System Information</h3>
            
            <div className="space-y-4">
              {[
                { label: "Data Persistence", value: "Browser IndexedDB (W3C Standard)", icon: Database, color: "text-blue-500" },
                { label: "AI Engine", value: "Google Gemini (Secure Express Proxy)", icon: Cpu, color: "text-purple-500" },
                { label: "Crop Pathology Coverage", value: "Tomato, Potato, Rice, Cassava", icon: Sprout, color: "text-[#2E7D32]" }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs border-b border-[#E8E5DF]/50 pb-3 last:border-0 last:pb-0">
                  <div className={`p-1.5 rounded-lg bg-[#FDFBF7] ${item.color}`}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-[#5D6B5F]/80">{item.label}</div>
                    <div className="font-bold text-[#1B3022] mt-0.5 leading-snug">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credits and Open Source */}
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-2 text-xs text-[#5D6B5F]">
            <div className="font-bold text-[#1B3022]">Credits & License</div>
            <p className="leading-relaxed font-sans">
              Developed for AI Studio Build as a full-stack proof-of-concept agronomic intelligence platform. No user telemetry is uploaded to external corporate trackers.
            </p>
            <div className="pt-2 font-mono text-[9px] text-[#5D6B5F]/70">
              V.1.0.0-PROD • GOOGLE AI STUDIO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
