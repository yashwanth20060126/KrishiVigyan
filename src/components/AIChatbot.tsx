import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  FileText,
  Lightbulb
} from "lucide-react";
import { getAllRecords } from "../db";
import { retrieveRelevantChunks } from "../pdf";
import { Message, DocumentRecord, Disease } from "../types";

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am KrishiVigyan, your AI Agricultural Advisor. I am grounded in our crop pathology encyclopedia and any research papers you upload under Document Intelligence. How can I help you today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I am KrishiVigyan, your AI Agricultural Advisor. I am grounded in our crop pathology encyclopedia and any research papers you upload under Document Intelligence. How can I help you today?",
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
      // --- RAG PIPELINE ---
      // 1. Gather all documents from IndexedDB
      const documents = await getAllRecords<DocumentRecord>("documents");
      const diseases = await getAllRecords<Disease>("diseases");

      // 2. Build full chunk corpus
      const textChunks: string[] = [];
      const chunkSourceMapping: { [chunk: string]: string } = {};

      // Map document chunks
      documents.forEach(doc => {
        doc.chunks.forEach(chunk => {
          textChunks.push(chunk);
          chunkSourceMapping[chunk] = `PDF: ${doc.title}`;
        });
      });

      // Map seeded disease profiles as chunks to ground chatbot general knowledge!
      diseases.forEach(d => {
        const text = `Crop: ${d.cropId}. Disease: ${d.name}. Symptoms: ${d.symptoms}. Causes: ${d.cause}. Organic Treatment: ${d.preventionOrganic.join(", ")}. Chemical: ${d.preventionChemical.join(", ")}. Cultural: ${d.preventionCultural.join(", ")}. Reference: ${d.reference}`;
        textChunks.push(text);
        chunkSourceMapping[text] = `Encyclopedia: ${d.name}`;
      });

      // 3. Search and Retrieve relevant chunks
      const matchedChunks = retrieveRelevantChunks(textChunks, userMessage.content, 4);
      const groundedContext = matchedChunks.join("\n\n---\n\n");
      
      // Map back to titles for UI source display
      const sourceTitles = Array.from(new Set(matchedChunks.map(chunk => chunkSourceMapping[chunk])));
      setActiveSources(sourceTitles);

      // 4. Send chat logs + grounding context to backend
      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/chat-rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          context: groundedContext
        })
      });

      if (!response.ok) {
        throw new Error("Chat service responded with an error");
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

  const suggestions = [
    "What are early blight symptoms on Tomato?",
    "How do I naturally control potato blight?",
    "Tell me about organic control for Rice Blast",
    "What spreads Cassava Mosaic Disease?"
  ];

  return (
    <div className="space-y-6 animate-fade-in h-[80vh] flex flex-col justify-between" id="chatbot_tab">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 border-b border-[#E8E5DF] pb-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
            <MessageSquare className="text-[#2E7D32]" size={28} />
            Agronomist RAG Chatbot
          </h1>
          <p className="text-[#5D6B5F] font-sans text-xs">
            Ask complex agronomy questions. Your queries are grounded in our local encyclopedia and custom PDF publications.
          </p>
        </div>
        <button 
          onClick={clearChat}
          className="rounded-xl border border-[#E8E5DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#5D6B5F] hover:bg-[#FDFBF7] transition flex items-center gap-1.5"
          title="Clear chat history"
        >
          <Trash2 size={13} />
          Clear
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0 min-w-0">
        {messages.map((m) => (
          <div 
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 space-y-2 border shadow-xs ${
              m.role === "user" 
                ? "bg-[#2E7D32] border-[#1B5E20] text-white" 
                : "bg-white border-[#E8E5DF] text-[#1B3022]"
            }`}>
              {/* Header meta */}
              <div className="flex items-center gap-2 justify-between text-[10px] font-semibold">
                <span className={`uppercase font-mono ${m.role === "user" ? "text-[#E8F5E9]" : "text-[#2E7D32]"}`}>
                  {m.role === "user" ? "Farmer" : "KrishiVigyan AI"}
                </span>
                <span className={m.role === "user" ? "text-[#E8F5E9]/80" : "text-[#5D6B5F]/80"}>
                  {m.timestamp}
                </span>
              </div>

              {/* Message Content */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {m.content}
              </p>

              {/* Sources badges */}
              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                <div className="border-t border-[#E8E5DF] pt-2 space-y-1">
                  <div className="text-[9px] font-bold text-[#5D6B5F] uppercase tracking-wider flex items-center gap-1">
                    <BookOpen size={10} />
                    Grounding References:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {m.sources.map((source, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-bold text-[#5D6B5F] bg-[#E8E5DF]/50 rounded-sm px-2 py-0.5">
                        <FileText size={8} />
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
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 space-y-2 max-w-sm flex items-center gap-3 shadow-xs">
              <RefreshCw className="animate-spin text-[#2E7D32] shrink-0" size={16} />
              <div className="text-xs font-semibold text-[#5D6B5F] flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500 animate-pulse" />
                Retrieving references & generating grounded response...
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Footer Suggestions & Inputs */}
      <div className="shrink-0 space-y-3 pt-3 border-t border-[#E8E5DF]">
        {messages.length === 1 && !loading && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-[#5D6B5F] uppercase tracking-wider flex items-center gap-1">
              <Lightbulb size={12} className="text-amber-500" /> Suggested Prompts:
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(s)}
                  className="text-left text-xs bg-[#FDFBF7] border border-[#E8E5DF] hover:bg-[#E8F5E9]/40 hover:border-[#2E7D32] p-2.5 rounded-xl text-[#5D6B5F] font-semibold transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your agricultural inquiry (e.g. crop rotation, early spots, copper limits)..."
            className="w-full bg-white pl-4 pr-12 py-3 rounded-2xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] font-sans text-sm shadow-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#2E7D32] text-white shadow-xs transition hover:bg-[#1B5E20] disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
