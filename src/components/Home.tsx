import React, { useEffect, useState } from "react";
import { 
  Sprout, 
  ScanLine, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  BarChart3, 
  MessageSquare, 
  GraduationCap, 
  ThermometerSun, 
  Info,
  ArrowRight,
  Cpu,
  Zap,
  Network,
  RotateCw,
  GitBranch
} from "lucide-react";
import { getAllRecords, seedDatabaseIfEmpty } from "../db";
import { Crop, Disease, Prediction } from "../types";

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export default function Home({ setActiveTab }: HomeProps) {
  const [stats, setStats] = useState({
    crops: 0,
    diseases: 0,
    predictions: 0
  });

  useEffect(() => {
    async function loadStats() {
      try {
        await seedDatabaseIfEmpty();
        const crops = await getAllRecords<Crop>("crops");
        const diseases = await getAllRecords<Disease>("diseases");
        const predictions = await getAllRecords<Prediction>("predictions");

        setStats({
          crops: crops.length,
          diseases: diseases.length,
          predictions: predictions.length
        });
      } catch (err) {
        console.error("Failed to load home statistics", err);
      }
    }
    loadStats();
  }, []);

  const dLModules = [
    {
      id: "analytics",
      moduleNum: "M1",
      title: "ML Fundamentals & cuML GPU",
      desc: "Compare CPU-bound Scikit-Learn with RAPIDS cuML. Execute GPU-accelerated algorithms on custom agricultural datasets.",
      techs: ["RAPIDS cuML", "Scikit-Learn", "H200 Tensor Cores"],
      icon: Cpu
    },
    {
      id: "quiz",
      moduleNum: "M2",
      title: "PyTorch Basics & Neural Networks",
      desc: "Deconstruct feedforward propagation, SGD, and loss optimization from scratch. Run custom PyTorch tensor evaluations on H200.",
      techs: ["PyTorch Core", "Neural Networks", "SGD Optimizer"],
      icon: Network
    },
    {
      id: "detect",
      moduleNum: "M3",
      title: "CNNs & GPU Nsight Profiling",
      desc: "Perform AI Leaf spot detection. Visualize deep CNN feature maps and profile CUDA kernels (GEMM, MaxPool) via simulated NVIDIA Nsight.",
      techs: ["CNN (Conv2D)", "NVIDIA Nsight", "CUDA Kernels"],
      icon: ScanLine
    },
    {
      id: "quiz",
      moduleNum: "M4",
      title: "Antigravity & Foundation Quiz",
      desc: "Validate mastery over deep learning hardware, kernels, and Google Antigravity core patterns inside our interactive exam console.",
      techs: ["Google Antigravity", "Hardware-Aware AI", "Bootcamp Quiz"],
      icon: GraduationCap
    },
    {
      id: "chatbot",
      moduleNum: "M5",
      title: "Transformer Attention Engine",
      desc: "Interact with local grounding documents and explore dynamically computed Multi-Head Query-Key-Value Attention Maps.",
      techs: ["Transformer Encoder", "QKV Attention", "RAG Engine"],
      icon: Layers
    },
    {
      id: "chatbot",
      moduleNum: "M6",
      title: "LLM Fine-Tuning with LoRA & PEFT",
      desc: "Simulate fine-tuning on a high-end H200 node. Configure Rank and Alpha parameters, view trainer epochs, and test Grounded LoRA mode.",
      techs: ["PEFT", "LoRA Adapters", "Hugging Face"],
      icon: GitBranch
    },
    {
      id: "simulation",
      moduleNum: "M7",
      title: "Stable Diffusion XL Generation",
      desc: "Leverage SDXL synthetic data augmentation to generate realistic leaf anomalies. Track how synthetic images optimize PyTorch training.",
      techs: ["SDXL", "Latent Diffusion", "Synthetic Data"],
      icon: RotateCw
    },
    {
      id: "analytics",
      moduleNum: "M8",
      title: "GPU Optimization & FlashAttention-2",
      desc: "Run benchmarks sweeping Mixed Precision (FP32 vs BF16), FlashAttention-2, and Tensor Parallelism. Observe H200 memory profiles.",
      techs: ["FlashAttention-2", "Tensor Parallelism", "BF16 Mixed"],
      icon: Zap
    }
  ];

  const coreSuites = [
    { id: "detect", title: "AI Leaf Diagnosis", desc: "Upload and scan infected plant leaves with Gemini Vision + Nsight GPU Profiling.", icon: ScanLine },
    { id: "chatbot", title: "Transformer RAG Chat", desc: "Consult the agronomist chatbot with active attention map visualizations & LoRA training.", icon: MessageSquare },
    { id: "simulation", title: "Risk & SDXL Simulator", desc: "Test weather disease outbreaks and synthesize custom leaf datasets via Stable Diffusion XL.", icon: ThermometerSun },
    { id: "analytics", title: "Accelerated Analytics", desc: "Run RAPIDS cuML benchmarks and model optimization sweeps (FlashAttention, TP).", icon: BarChart3 },
    { id: "explorer", title: "Crop Encyclopedia", desc: "Browse a detailed filterable directory of plant anomalies, pathogens, and biological papers.", icon: BookOpen },
    { id: "quiz", title: "Foundation Quiz Hub", desc: "Take core curriculum tests or build custom, AI-generated quizzes with deep scientific feedback.", icon: GraduationCap }
  ];

  return (
    <div className="space-y-10 animate-fade-in" id="home_tab">
      {/* Hero / Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B3022] via-[#2E7D32] to-[#4E342E] p-8 md:p-12 text-white shadow-xl shadow-[#2E7D32]/10">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
          <Sprout size={350} />
        </div>
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-[#E8F5E9] backdrop-blur-sm border border-emerald-500/30">
            <Cpu size={12} className="text-emerald-400" />
            H200 GPU Accelerated Agriculture & Deep Learning Platform
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl text-white">
            KrishiVigyan <span className="text-emerald-400">DL Lab</span>
          </h1>
          <p className="text-[#F1F8E9]/90 text-base md:text-lg leading-relaxed font-sans max-w-2xl">
            A state-of-the-art agricultural research and training sandbox. Grounded in plant pathology, this workspace integrates 
            <strong> accelerated GPU machine learning, convolutional vision systems, NVIDIA Nsight profiling, transformers with LoRA, and generative diffusion models.</strong>
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => setActiveTab("detect")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ScanLine size={18} />
              Open Leaf Vision Lab
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => setActiveTab("about")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              <Info size={16} />
              Hardware Specifications
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Hardware & Catalog Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Crops Grounded", value: stats.crops, icon: Sprout, color: "text-[#2E7D32] bg-[#F1F8E9]" },
          { label: "Active Pathology Catalog", value: stats.diseases, icon: ShieldCheck, color: "text-[#EF6C00] bg-[#FFF3E0]" },
          { label: "Research Diagnostics Logged", value: stats.predictions, icon: Cpu, color: "text-blue-700 bg-blue-50" }
        ].map((m, idx) => (
          <div key={idx} className="flex items-center gap-4 rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs">
            <div className={`rounded-xl p-3 ${m.color}`}>
              <m.icon size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1B3022] font-mono">{m.value}</div>
              <div className="text-xs font-bold text-[#5D6B5F] uppercase tracking-wider">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced DL Core Curriculum Syllabus */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#1B3022]">Deep Learning & AI Lab Syllabus</h2>
          <p className="text-sm text-[#5D6B5F]">
            Master advanced AI principles by running real-time benchmarks and visualizations across these 8 core curriculum modules:
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dLModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div 
                key={mod.moduleNum}
                onClick={() => setActiveTab(mod.id)}
                className="group cursor-pointer rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-md hover:border-emerald-500/50 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#F1F8E9] text-[#1B5E20] font-mono border border-emerald-100">
                      {mod.moduleNum}
                    </span>
                    <div className="rounded-full bg-slate-50 p-1.5 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                      <Icon size={16} />
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#1B3022] group-hover:text-emerald-700 leading-snug">
                      {mod.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#5D6B5F] leading-relaxed font-sans">
                    {mod.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E8E5DF]/50 flex flex-wrap gap-1">
                  {mod.techs.map((t) => (
                    <span key={t} className="text-[9px] font-semibold font-mono bg-slate-100 text-slate-600 rounded px-1 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Launch Suite Navigation */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="font-display text-xl font-bold text-[#1B3022]">Primary Research Modules</h2>
          <p className="text-sm text-[#5D6B5F]">Direct structural gateways to run KrishiVigyan's core services:</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coreSuites.map((suite) => {
            const SuiteIcon = suite.icon;
            return (
              <div 
                key={suite.id}
                onClick={() => setActiveTab(suite.id)}
                className="group cursor-pointer rounded-xl border border-[#E8E5DF] bg-white p-5 shadow-xs transition hover:bg-[#FDFBF7] hover:border-emerald-600/30 flex items-start gap-4"
              >
                <div className="rounded-lg bg-[#E8F5E9] text-[#2E7D32] p-2.5 shrink-0 group-hover:bg-[#1B5E20] group-hover:text-white transition duration-200">
                  <SuiteIcon size={18} />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-display text-sm font-bold text-[#1B3022] group-hover:text-emerald-700 transition">
                    {suite.title}
                  </h3>
                  <p className="text-xs text-[#5D6B5F] leading-snug font-sans">
                    {suite.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
