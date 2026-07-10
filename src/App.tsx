import React, { useState } from "react";
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
  Menu,
  X,
  Home as HomeIcon,
  Key
} from "lucide-react";
import Home from "./components/Home";
import DiseaseDetection from "./components/DiseaseDetection";
import DiseaseExplorer from "./components/DiseaseExplorer";
import HealthyComparison from "./components/HealthyComparison";
import DiseasePrevention from "./components/DiseasePrevention";
import Analytics from "./components/Analytics";
import AIChatbot from "./components/AIChatbot";
import DocumentIntelligence from "./components/DocumentIntelligence";
import QuizGenerator from "./components/QuizGenerator";
import TrendSimulation from "./components/TrendSimulation";
import About from "./components/About";

type TabId = 
  | "home" 
  | "detect" 
  | "explorer" 
  | "comparison" 
  | "prevention" 
  | "analytics" 
  | "chatbot" 
  | "documents" 
  | "quiz" 
  | "simulation" 
  | "about";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem("gemini_api_key") || "");

  const navigationItems = [
    { id: "home", label: "Dashboard", icon: HomeIcon, desc: "Main landing & db overview" },
    { id: "detect", label: "AI Leaf Diagnosis", icon: ScanLine, desc: "Symptom capture and vision scan" },
    { id: "explorer", label: "Crop Encyclopedia", icon: BookOpen, desc: "Searchable pathology database" },
    { id: "comparison", label: "Healthy vs Infected", icon: Layers, desc: "Comparative morphology guide" },
    { id: "prevention", label: "Prevention Therapy", icon: ShieldCheck, desc: "IPM controls & field sanitation" },
    { id: "analytics", label: "Agri Analytics", icon: BarChart3, desc: "Diagnosis counts and timelines" },
    { id: "chatbot", label: "Agronomist Chatbot", icon: MessageSquare, desc: "Grounded conversational expert" },
    { id: "documents", label: "Doc Intelligence", icon: FileText, desc: "PDF research text parsing" },
    { id: "quiz", label: "Extension Quiz", icon: GraduationCap, desc: "Bespeake classroom classrooms" },
    { id: "simulation", label: "Risk Simulator", icon: ThermometerSun, desc: "Test weather disease outbreaks" },
    { id: "about", label: "About Platform", icon: Info, desc: "Tech specs and spec models" }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabId);
    setMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "home":
        return <Home setActiveTab={handleTabChange} />;
      case "detect":
        return <DiseaseDetection />;
      case "explorer":
        return <DiseaseExplorer />;
      case "comparison":
        return <HealthyComparison />;
      case "prevention":
        return <DiseasePrevention />;
      case "analytics":
        return <Analytics />;
      case "chatbot":
        return <AIChatbot />;
      case "documents":
        return <DocumentIntelligence />;
      case "quiz":
        return <QuizGenerator />;
      case "simulation":
        return <TrendSimulation />;
      case "about":
        return <About />;
      default:
        return <Home setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B3022] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-[#2E7D32] text-white min-h-screen sticky top-0 p-6 space-y-8 shadow-md">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#388E3C]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#2E7D32] shadow-sm">
            <Sprout size={24} />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white leading-none">KrishiVigyan</span>
            <p className="text-[10px] text-[#A5D6A7] font-mono tracking-wider font-bold mt-0.5">AGRI INTELLIGENCE</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition group ${
                  isActive 
                    ? "bg-[#1B5E20] text-white shadow-xs" 
                    : "text-[#E8F5E9]/80 hover:text-white hover:bg-[#388E3C]"
                }`}
                id={`sidebar_btn_${item.id}`}
              >
                <IconComponent 
                  size={18} 
                  className={`transition shrink-0 ${
                    isActive ? "text-white" : "text-[#C2C9C3] group-hover:text-white"
                  }`} 
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Pro Tip bottom card */}
        <div className="pt-4 border-t border-[#388E3C]">
          <div className="bg-[#F1F8E9] text-[#2E7D32] p-4 rounded-xl text-xs">
            <p className="font-bold uppercase tracking-wider mb-1">Pro Tip</p>
            <p className="opacity-90 leading-relaxed">Use natural sunlight for clearer leaf photos.</p>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden bg-[#2E7D32] text-white px-5 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#2E7D32] shadow-sm">
            <Sprout size={20} />
          </div>
          <span className="font-display font-bold text-lg text-white">KrishiVigyan</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-[#388E3C] bg-[#1B5E20] text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-sm bg-[#2E7D32] text-white h-full p-6 space-y-6 shadow-2xl flex flex-col justify-between animate-fade-in">
            <div className="space-y-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center border-b border-[#388E3C] pb-4">
                <span className="font-display font-bold text-lg text-white">Extension Modules</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#388E3C] text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Links */}
              <nav className="space-y-1.5">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        isActive 
                          ? "bg-[#1B5E20] text-white shadow-sm" 
                          : "text-[#E8F5E9]/80 hover:text-white hover:bg-[#388E3C]"
                      }`}
                    >
                      <IconComponent size={18} className="shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            
            <div className="border-t border-[#388E3C] pt-4 font-mono text-[9px] text-[#A5D6A7] text-center">
              KRISHIVIGYAN v1.0.0
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 px-6 md:px-8 flex items-center justify-between border-b border-[#E8E5DF] bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-[#5D6B5F] font-semibold">
            <span className="font-medium">Station: Vidarbha Center</span>
            <span className="w-1.5 h-1.5 bg-[#C2C9C3] rounded-full"></span>
            <span>Temp: 32°C</span>
            <span className="w-1.5 h-1.5 bg-[#C2C9C3] rounded-full"></span>
            <span>Humidity: 65%</span>
          </div>
          <div className="flex items-center gap-4">
            {/* API Key configuration button */}
            <button 
              onClick={() => {
                setApiKeyInput(localStorage.getItem("gemini_api_key") || "");
                setShowKeyModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E5DF] hover:border-[#2E7D32] hover:bg-[#F1F8E9] text-xs font-semibold text-[#5D6B5F] hover:text-[#2E7D32] transition"
              title="Configure Gemini API Key"
              id="header_key_config_btn"
            >
              <Key size={14} className={localStorage.getItem("gemini_api_key") ? "text-[#2E7D32] fill-[#2E7D32]/20" : "text-[#EF6C00]"} />
              <span className="hidden sm:inline">
                {localStorage.getItem("gemini_api_key") ? "API Key Configured" : "Add API Key"}
              </span>
            </button>
            <button className="p-2 text-[#5D6B5F] hover:bg-[#F5F3EF] rounded-full transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF6C00] rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#795548] border-2 border-white shadow-xs flex items-center justify-center text-white text-xs font-bold">AM</div>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-5 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* API Key Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8E5DF] shadow-2xl p-6 relative animate-fade-in space-y-4">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5D6B5F] hover:bg-[#F5F3EF] hover:text-[#1B3022]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F8E9] text-[#2E7D32]">
                <Key size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[#1B3022]">Gemini API Configuration</h3>
                <p className="text-xs text-[#5D6B5F]">Securely store your API key locally in the browser</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs text-[#5D6B5F] leading-relaxed">
                If your host deployment (like Vercel) does not have the <code className="bg-[#F5F3EF] px-1 py-0.5 rounded font-mono font-bold text-red-600">GEMINI_API_KEY</code> environment variable configured, you can enter your personal Gemini API key here.
              </p>
              <p className="text-xs text-[#5D6B5F] leading-relaxed">
                Your key will only be stored in your browser's local storage and is sent as a secure request header to authorize your backend API calls.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5D6B5F] uppercase tracking-wider block">Gemini API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] text-sm bg-white text-[#1B3022] font-mono"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Key size={14} className="text-[#A5A5A5]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 text-[11px]">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#2E7D32] hover:underline font-semibold flex items-center gap-1"
                >
                  Get a free Gemini API Key
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                
                {localStorage.getItem("gemini_api_key") && (
                  <button 
                    onClick={() => {
                      localStorage.removeItem("gemini_api_key");
                      setApiKeyInput("");
                      setShowKeyModal(false);
                      window.location.reload();
                    }}
                    className="text-red-600 hover:underline font-semibold"
                  >
                    Clear Saved Key
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#E8E5DF]">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="flex-1 py-2 rounded-xl border border-[#E8E5DF] hover:bg-[#F5F3EF] text-sm font-semibold text-[#5D6B5F]"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (apiKeyInput.trim()) {
                    localStorage.setItem("gemini_api_key", apiKeyInput.trim());
                  } else {
                    localStorage.removeItem("gemini_api_key");
                  }
                  setShowKeyModal(false);
                  window.location.reload();
                }}
                className="flex-1 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-sm font-bold text-white shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
