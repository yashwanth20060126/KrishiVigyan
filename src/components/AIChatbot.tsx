import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  FileText,
  Lightbulb,
  GitBranch,
  Layers,
  Settings,
  Play,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { getAllRecords } from "../db";
import { retrieveRelevantChunks } from "../search";
import { Message, Disease } from "../types";

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am KrishiVigyan, your AI Agricultural Advisor. I am grounded in our crop pathology encyclopedia. Ask me anything, or toggle LoRA fine-tuning in the Engineering Studio on the right!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  
  // LoRA Parameter States
  const [loraRank, setLoraRank] = useState<number>(8); // r=4, 8, 16, 32
  const [loraAlpha, setLoraAlpha] = useState<number>(16); // alpha=16, 32
  const [loraTarget, setLoraTarget] = useState<string>("q_proj, v_proj");
  const [loraTraining, setLoraTraining] = useState<boolean>(false);
  const [loraTrained, setLoraTrained] = useState<boolean>(false);
  const [activeModelMode, setActiveModelMode] = useState<"base" | "lora">("base");
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [trainingEpoch, setTrainingEpoch] = useState<number>(0);

  // Attention map states
  const [hoveredTokenIndex, setHoveredTokenIndex] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I am KrishiVigyan, your AI Agricultural Advisor. I am grounded in our crop pathology encyclopedia. Ask me anything, or toggle LoRA fine-tuning in the Engineering Studio on the right!",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setActiveSources([]);
  };

  const handleSuggestion = (prompt: string) => {
    setInput(prompt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setActiveSources([]);

    try {
      // --- RAG Grounding ---
      const diseases = await getAllRecords<Disease>("diseases");
      const textChunks: string[] = [];
      const chunkSourceMapping: { [chunk: string]: string } = {};

      diseases.forEach(d => {
        const text = `Crop: ${d.cropId}. Disease: ${d.name}. Symptoms: ${d.symptoms}. Causes: ${d.cause}. Organic Treatment: ${d.preventionOrganic.join(", ")}. Chemical: ${d.preventionChemical.join(", ")}. Cultural: ${d.preventionCultural.join(", ")}. Reference: ${d.reference}`;
        textChunks.push(text);
        chunkSourceMapping[text] = `Encyclopedia: ${d.name}`;
      });

      const matchedChunks = retrieveRelevantChunks(textChunks, userMessage.content, 4);
      const groundedContext = matchedChunks.join("\n\n---\n\n");
      const sourceTitles = Array.from(new Set(matchedChunks.map(chunk => chunkSourceMapping[chunk])));
      setActiveSources(sourceTitles);

      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Adjust prompt slightly if LoRA mode is enabled to showcase PEFT fine-tuning results
      let systemModifier = "";
      if (activeModelMode === "lora") {
        systemModifier = "\n\n[LoRA ADAPTER TRIGGERED: Respond as an elite, academic crop pathologist using high-level botanical and cellular nomenclature. Emphasize cellular pathogenesis, fungal spore structures, and advanced biochemistry options where applicable.]";
      }

      const response = await fetch("/api/chat-rag", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Api-Key": localStorage.getItem("gemini_api_key") || ""
        },
        body: JSON.stringify({
          messages: history,
          context: groundedContext + systemModifier
        })
      });

      if (!response.ok) {
        throw new Error("RAG chat pipeline failed");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: "msg_" + Date.now(),
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString(),
        sources: sourceTitles.length > 0 ? sourceTitles : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: "err_" + Date.now(),
        role: "assistant",
        content: "I ran into a server communication error while answering. Please verify your connection or check that the Gemini API key is configured.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // --- Run Hugging Face LoRA training simulation ---
  const triggerLoRATraining = () => {
    setLoraTraining(true);
    setTrainingEpoch(0);
    setLoraTrained(false);
    setTrainingLogs([]);

    const logs = [
      `[INFO] Initializing Hugging Face PEFT Trainer on H200 node...`,
      `[INFO] Loading pre-trained base model layers...`,
      `[PEFT] Injecting LoRA adapter rank r=${loraRank}, alpha=${loraAlpha} to layers: [${loraTarget}]`,
      `[PEFT] Total parameters: 7,242,104,832 | Trainable parameters: ${((loraRank * 16384 * 2 / 7242104832) * 100).toFixed(4)}%`,
      `[TRAIN] Epoch 1/3 | Batch Loss: 2.144 | Lr: 2e-4`,
      `[TRAIN] Epoch 2/3 | Batch Loss: 1.221 | Lr: 1.2e-4`,
      `[TRAIN] Epoch 3/3 | Batch Loss: 0.452 | Lr: 4.5e-5`,
      `[PEFT] Merging adapter weights with frozen base attention matrices...`,
      `[PEFT] LoRA training completed successfully! Model serialized to /checkpoints/lora-adapter-last/`
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < logs.length) {
        setTrainingLogs(prev => [...prev, logs[currentLogIdx]]);
        if (logs[currentLogIdx].includes("Epoch")) {
          setTrainingEpoch(prev => prev + 1);
        }
        currentLogIdx++;
      } else {
        clearInterval(interval);
        setLoraTraining(false);
        setLoraTrained(true);
        setActiveModelMode("lora");
      }
    }, 450);
  };

  const suggestions = [
    "What are early blight symptoms on Tomato?",
    "How do I naturally control potato blight?",
    "Tell me about organic control for Rice Blast",
    "What spreads Cassava Mosaic Disease?"
  ];

  // Token list for Attention Map Matrix
  const attentionTokens = ["[CLS]", "Tomato", "blight", "fungal", "spots", "chlorotic", "halo", "copper", "organic", "[SEP]"];
  
  // Dummy attention weights matrix for 10x10 representation
  // Each row i attends to column j. Normalizing roughly.
  const getAttentionWeight = (i: number, j: number) => {
    // Highlight strong links (like Tomato and blight, spots and chlorotic, copper and organic)
    if (i === j) return 0.25; // self-attention
    if (hoveredTokenIndex !== null && i === hoveredTokenIndex) {
      // row is highlighted
      return (i + j) % 3 === 0 ? 0.65 : 0.15;
    }
    const strongPairs = [
      [1, 2], [2, 1], // Tomato -> blight
      [2, 3], [3, 2], // blight -> fungal
      [4, 5], [5, 4], // spots -> chlorotic
      [5, 6], [6, 5], // chlorotic -> halo
      [7, 8], [8, 7]  // copper -> organic
    ];
    const isStrong = strongPairs.some(p => (p[0] === i && p[1] === j) || (p[0] === j && p[1] === i));
    return isStrong ? 0.8 : 0.08;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-stretch" id="chatbot_tab">
      {/* LEFT COLUMN: GROUNDED RAG CHATBOT */}
      <div className="lg:col-span-7 rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs flex flex-col justify-between h-[80vh]">
        {/* Chat Header */}
        <div className="flex justify-between items-center shrink-0 border-b border-[#E8E5DF] pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1B3022] flex items-center gap-2">
              <MessageSquare className="text-[#2E7D32]" size={20} />
              Agronomist Chatbot
            </h2>
            <p className="text-xs text-[#5D6B5F] font-sans">
              Grounded in the encyclopedia. Running: <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded capitalize">{activeModelMode === "base" ? "Base LLM Model" : "PEFT LoRA Model"}</span>
            </p>
          </div>
          <button 
            onClick={clearChat}
            className="rounded-xl border border-[#E8E5DF] bg-white px-2.5 py-1 text-xs font-semibold text-[#5D6B5F] hover:bg-[#FDFBF7] transition flex items-center gap-1.5"
            title="Clear chat history"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>

        {/* Chat Message Scrollport */}
        <div className="flex-1 overflow-y-auto pr-2 my-4 space-y-4 min-h-0 min-w-0">
          {messages.map((m) => (
            <div 
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div className={`max-w-[90%] rounded-2xl p-4 space-y-2 border shadow-xs ${
                m.role === "user" 
                  ? "bg-[#2E7D32] border-[#1B5E20] text-white" 
                  : "bg-[#FDFBF7] border-[#E8E5DF] text-[#1B3022]"
              }`}>
                {/* Meta */}
                <div className="flex items-center gap-2 justify-between text-[10px] font-bold">
                  <span className={`uppercase font-mono ${m.role === "user" ? "text-[#E8F5E9]" : "text-[#2E7D32]"}`}>
                    {m.role === "user" ? "Grower" : activeModelMode === "base" ? "KrishiVigyan Base" : "KrishiVigyan LoRA"}
                  </span>
                  <span className={m.role === "user" ? "text-[#E8F5E9]/80" : "text-[#5D6B5F]/80"}>
                    {m.timestamp}
                  </span>
                </div>

                {/* Body */}
                <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {m.content}
                </p>

                {/* Grounding references */}
                {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                  <div className="border-t border-[#E8E5DF] pt-2 mt-2 space-y-1">
                    <div className="text-[8px] font-extrabold text-[#5D6B5F] uppercase tracking-wider flex items-center gap-1">
                      <BookOpen size={9} />
                      Context Grounding vectors:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.sources.map((source, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[8px] font-bold text-[#5D6B5F] bg-[#E8E5DF]/60 rounded px-1.5 py-0.5">
                          <FileText size={7} />
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#FDFBF7] border border-[#E8E5DF] rounded-2xl p-4 space-y-2 max-w-sm flex items-center gap-3 shadow-xs">
                <RefreshCw className="animate-spin text-[#2E7D32] shrink-0" size={16} />
                <div className="text-xs font-semibold text-[#5D6B5F] flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500 animate-pulse" />
                  Retrieving vectors & computing attention logits...
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Inputs */}
        <div className="shrink-0 space-y-3 pt-2 border-t border-[#E8E5DF]">
          {messages.length === 1 && !loading && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold text-[#5D6B5F] uppercase tracking-wider flex items-center gap-1">
                <Lightbulb size={11} className="text-amber-500" /> Grounded Prompts:
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    className="text-left text-[11px] bg-[#FDFBF7] border border-[#E8E5DF] hover:bg-[#E8F5E9]/40 hover:border-[#2E7D32] p-2 rounded-lg text-[#5D6B5F] font-semibold transition truncate"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text"
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask an agronomy question (e.g., tomato late blight treatments)..."
              className="w-full bg-white pl-4 pr-12 py-2.5 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] font-sans text-xs md:text-sm shadow-xs"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D32] text-white transition hover:bg-[#1B5E20] disabled:opacity-40"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: TRANSFORER & LoRA ENGINEERING COCKPIT */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-[80vh] overflow-y-auto pr-1">
        {/* 1. Multi-Head Attention Map Card */}
        <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-[#E8E5DF] pb-2.5">
            <h3 className="font-display text-sm font-bold text-[#1B3022] flex items-center gap-2">
              <Layers className="text-[#2E7D32]" size={16} />
              Multi-Head Attention Map (Q × K^T)
            </h3>
            <p className="text-[10px] text-[#5D6B5F] mt-0.5">
              Hover over token triggers on the left row to highlight key-value associations mapped in the transformer head.
            </p>
          </div>

          <div className="space-y-3">
            {/* Horizontal matrix labels */}
            <div className="grid grid-cols-11 gap-0.5 text-center font-mono text-[8px] font-bold text-[#5D6B5F]">
              <span className="text-[6px] self-end uppercase text-slate-400">Tokens</span>
              {attentionTokens.map((t, idx) => (
                <span key={idx} className="truncate select-none">{t}</span>
              ))}
            </div>

            {/* Matrix grid rows */}
            <div className="space-y-0.5">
              {attentionTokens.map((rowToken, rIdx) => (
                <div 
                  key={rIdx} 
                  className="grid grid-cols-11 gap-0.5 items-center text-center"
                  onMouseEnter={() => setHoveredTokenIndex(rIdx)}
                  onMouseLeave={() => setHoveredTokenIndex(null)}
                >
                  <span className="text-[8px] font-mono font-bold text-left text-[#1B3022] truncate pr-1">{rowToken}</span>
                  {attentionTokens.map((colToken, cIdx) => {
                    const weight = getAttentionWeight(rIdx, cIdx);
                    return (
                      <div
                        key={cIdx}
                        title={`Attention [${rowToken} -> ${colToken}]: ${weight.toFixed(3)}`}
                        className="aspect-square rounded-xs transition duration-150"
                        style={{
                          backgroundColor: `rgba(46, 125, 50, ${weight})`,
                          border: hoveredTokenIndex === rIdx ? "0.5px solid rgba(16,185,129,0.4)" : "none"
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="text-[9px] font-semibold text-slate-500 font-sans flex items-center justify-between">
              <span>Low Score (Sparse)</span>
              <div className="h-1.5 w-20 rounded bg-gradient-to-r from-[#2E7D32]/10 to-[#2E7D32]" />
              <span>High Score (Attended)</span>
            </div>
          </div>
        </div>

        {/* 2. Hugging Face LoRA Fine-Tuning Cockpit */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 text-white p-5 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-2.5">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="text-emerald-400" size={16} />
              Hugging Face LoRA Adapter Cockpit
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Configure adapters to run fine-tuning on a virtual H200 node. Test how weights grounding edits chatbot behavior.
            </p>
          </div>

          {loraTraining ? (
            /* Training active log visualizer */
            <div className="flex-1 flex flex-col justify-between space-y-3 font-mono">
              <div className="flex justify-between items-center bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px]">
                <span className="text-slate-400">EPOCH PROGRESS</span>
                <span className="text-yellow-400 font-bold">{trainingEpoch} / 3</span>
              </div>
              
              {/* Log window */}
              <div className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800 text-[8px] text-emerald-400 overflow-y-auto max-h-36 space-y-1">
                {trainingLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </div>
          ) : (
            /* Parameters config form */
            <div className="space-y-3 text-xs flex-1">
              {/* Rank & Alpha */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Adapter Rank (r)</span>
                  <select
                    value={loraRank}
                    onChange={(e) => setLoraRank(Number(e.target.value))}
                    disabled={loraTrained}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white font-mono"
                  >
                    <option value={4}>r = 4 (Ultra light)</option>
                    <option value={8}>r = 8 (Recommended)</option>
                    <option value={16}>r = 16 (Heavy Adapter)</option>
                    <option value={32}>r = 32 (Max Capacity)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Scaling Alpha (α)</span>
                  <select
                    value={loraAlpha}
                    onChange={(e) => setLoraAlpha(Number(e.target.value))}
                    disabled={loraTrained}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white font-mono"
                  >
                    <option value={16}>alpha = 16</option>
                    <option value={32}>alpha = 32</option>
                  </select>
                </div>
              </div>

              {/* Target weights */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Target Weights Modules</span>
                <input 
                  type="text" 
                  value={loraTarget}
                  onChange={(e) => setLoraTarget(e.target.value)}
                  disabled={loraTrained}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Toggle switch for active model if trained */}
              {loraTrained && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5 mt-2 animate-fade-in">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Active Inference Mode</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveModelMode("base")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition ${
                        activeModelMode === "base"
                          ? "bg-slate-800 text-white border border-slate-700"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Frozen Base LLM
                    </button>
                    <button
                      onClick={() => setActiveModelMode("lora")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition flex items-center justify-center gap-1 ${
                        activeModelMode === "lora"
                          ? "bg-emerald-500 text-black shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sparkles size={10} />
                      PEFT LoRA Mode
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Trigger button */}
          <button
            onClick={triggerLoRATraining}
            disabled={loraTraining}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs py-2.5 shadow-md mt-4 disabled:opacity-50"
          >
            {loraTraining ? (
              <>
                <RefreshCw className="animate-spin" size={12} />
                Executing PEFT Backpropagation...
              </>
            ) : loraTrained ? (
              <>
                <RefreshCw size={12} />
                Retrain LoRA Adapter
              </>
            ) : (
              <>
                <Play size={10} />
                Start LoRA Fine-Tuning
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
