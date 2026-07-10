import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  FileCheck2,
  BookOpen
} from "lucide-react";
import { addRecord, getAllRecords, deleteRecord } from "../db";
import { extractTextFromPdf } from "../pdf";
import { DocumentRecord } from "../types";

export default function DocumentIntelligence() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [activeSummary, setActiveSummary] = useState<{ title: string; text: string } | null>(null);
  const [inspectingDoc, setInspectingDoc] = useState<DocumentRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const list = await getAllRecords<DocumentRecord>("documents");
      list.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setDocuments(list);
    } catch (err) {
      console.error("Failed to load documents list", err);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a valid PDF document.");
      return;
    }

    setLoading(true);
    try {
      // Extract text and chunk client-side using PDF.js CDN
      const { text, chunks } = await extractTextFromPdf(file);
      
      if (!text.trim() || chunks.length === 0) {
        throw new Error("No readable text found. Scanned or image-only PDFs are not supported. Please upload a standard text PDF.");
      }

      const docId = "doc_" + Date.now();
      const record: DocumentRecord = {
        id: docId,
        title: file.name.replace(/\.[^/.]+$/, ""), // remove extension
        fileName: file.name,
        extractedText: text,
        chunks: chunks,
        uploadDate: new Date().toISOString()
      };

      await addRecord("documents", record);
      loadDocuments();
    } catch (err: any) {
      console.error("PDF extraction failed", err);
      setError(err.message || "Failed to parse PDF text. Please check that the PDF contains actual text, not scanned images.");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePdfUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  const deleteDocumentRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document from your database? This will remove its chunks from the chatbot's grounding context.")) {
      try {
        await deleteRecord("documents", id);
        loadDocuments();
        if (inspectingDoc?.id === id) setInspectingDoc(null);
        if (activeSummary && summarizingId === id) setActiveSummary(null);
      } catch (err) {
        console.error("Failed to delete document", err);
      }
    }
  };

  const requestSummary = async (doc: DocumentRecord) => {
    setSummarizingId(doc.id);
    setActiveSummary(null);
    try {
      // Send first few chunks to fit within prompt context
      const textToSummarize = doc.chunks.slice(0, 10).join("\n\n");
      
      const response = await fetch("/api/chat-rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Please review the following crop research paper / agricultural extension bulletin, and generate a structured executive summary.
Highlight key takeaways in bullet points:
1. Primary Crops & Diseases Covered
2. Observed Symptoms & Pathogens
3. Recommended Organic & Integrated Pest Controls
4. Any innovative farmer takeaways

Text Context:
---
${textToSummarize}
---`
            }
          ]
        })
      });

      if (!response.ok) {
        let errMsg = "Summary service failed";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          const text = await response.text().catch(() => "");
          errMsg = text.substring(0, 150) || `Server error (${response.status})`;
        }
        throw new Error(errMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("Invalid response format received from summary service.");
      }
      setActiveSummary({
        title: doc.title,
        text: data.text
      });
    } catch (err: any) {
      console.error(err);
      setError("Failed to summarize: " + err.message);
    } finally {
      setSummarizingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="documents_tab">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
          <FileText className="text-[#2E7D32]" size={28} />
          Document Intelligence
        </h1>
        <p className="text-[#5D6B5F] font-sans">
          Upload PDF pamphlets, journals, or extension circulars. Extracted text chunks are securely compiled into IndexedDB to expand the RAG Chatbot's intelligence.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Document List & Upload */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-6">
            <h2 className="font-display text-lg font-bold text-[#1B3022]">Add Reference PDF</h2>
            
            {/* Drag drop */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-[#E8E5DF] hover:border-[#2E7D32] rounded-xl p-8 text-center bg-[#FDFBF7]/50 hover:bg-[#E8F5E9]/10 transition group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8E5DF]/50 text-[#5D6B5F] group-hover:bg-[#E8F5E9] group-hover:text-[#2E7D32] transition">
                <Upload size={22} />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#1B3022]">Drag & drop your research PDF here</p>
              <p className="text-xs text-[#5D6B5F]/80 mt-1">or click to browse local files</p>
            </div>

            {loading && (
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#5D6B5F]">
                  <RefreshCw size={14} className="animate-spin text-[#2E7D32]" />
                  Extracting PDF text nodes and building sliding window chunks...
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                <div>{error}</div>
              </div>
            )}
          </div>

          {/* Uploaded List */}
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-[#1B3022]">Indexed Library</h2>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => setInspectingDoc(doc)}
                  className={`group cursor-pointer rounded-xl border p-4 transition flex items-center justify-between gap-2 ${
                    inspectingDoc?.id === doc.id 
                      ? "border-[#2E7D32] bg-[#E8F5E9]/20" 
                      : "border-[#E8E5DF]/60 bg-white hover:border-[#2E7D32]/85"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg p-2 bg-red-50 text-red-600 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display text-sm font-bold text-[#1B3022] truncate leading-snug group-hover:text-[#2E7D32]">
                        {doc.title}
                      </h4>
                      <p className="text-[10px] font-semibold text-[#5D6B5F]/80">
                        {doc.chunks.length} semantic chunks • Indexed {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={(e) => { e.stopPropagation(); requestSummary(doc); }}
                      className="rounded-md p-1.5 text-[#5D6B5F] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition"
                      title="Summarize with Gemini"
                      disabled={summarizingId === doc.id}
                    >
                      {summarizingId === doc.id ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} />
                      )}
                    </button>
                    <button 
                      onClick={(e) => deleteDocumentRecord(doc.id, e)}
                      className="rounded-md p-1.5 text-[#5D6B5F] hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-10 text-[#5D6B5F] text-sm border border-dashed border-[#E8E5DF] rounded-xl bg-[#FDFBF7]/40">
                  No reference bulletins loaded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Display Summary/Preview */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary Box */}
          {activeSummary && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8E5DF] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-amber-500 animate-pulse" size={20} />
                  <h3 className="font-display text-base font-bold text-[#1B3022]">
                    Gemini Executive Summary: {activeSummary.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveSummary(null)}
                  className="text-xs font-semibold text-[#5D6B5F]/80 hover:text-[#1B3022]"
                >
                  Clear Summary
                </button>
              </div>
              <p className="text-sm text-[#5D6B5F] leading-relaxed whitespace-pre-wrap font-sans bg-[#FDFBF7] p-4 rounded-xl border border-[#E8E5DF]">
                {activeSummary.text}
              </p>
            </div>
          )}

          {/* Inspecting Chunks Preview */}
          {inspectingDoc ? (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8E5DF] pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-[#2E7D32]" size={20} />
                  <h3 className="font-display text-base font-bold text-[#1B3022]">
                    Inspecting Doc Chunks: {inspectingDoc.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setInspectingDoc(null)}
                  className="text-xs font-semibold text-[#5D6B5F]/80 hover:text-[#1B3022]"
                >
                  Hide Preview
                </button>
              </div>

              {/* Chunks List */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                {inspectingDoc.chunks.map((chunk, i) => (
                  <div key={i} className="bg-[#FDFBF7]/50 p-4 rounded-xl border border-[#E8E5DF] text-xs text-[#5D6B5F] space-y-1.5">
                    <div className="font-bold text-[9px] text-[#5D6B5F]/85 font-mono uppercase">
                      CHUNK #{i + 1}
                    </div>
                    <p className="leading-relaxed font-sans">{chunk}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : !activeSummary && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center text-[#5D6B5F]/80">
              <FileCheck2 className="mx-auto text-[#C2C9C3] mb-3" size={44} />
              <h3 className="font-display text-base font-bold text-[#1B3022]">Document Reader Workspace</h3>
              <p className="text-xs max-w-xs mx-auto mt-2 text-[#5D6B5F]">
                Inspect structured sliding chunks or request executive summaries of your agronomic references.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
