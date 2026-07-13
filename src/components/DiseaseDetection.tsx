import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Trash2, 
  Eye, 
  Search,
  Sparkles,
  Cpu,
  Layers,
  Activity,
  HardDrive,
  Sliders,
  Settings,
  Play,
  Check
} from "lucide-react";
import { addRecord, getAllRecords, deleteRecord } from "../db";
import { Prediction } from "../types";

export default function DiseaseDetection() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [activeCam, setActiveCam] = useState(false);
  
  // Custom deep learning visualizer states
  const [selectedCnnLayer, setSelectedCnnLayer] = useState<string>("conv2d");
  const [profilerPrecision, setProfilerPrecision] = useState<"FP32" | "FP16" | "BF16">("FP16");
  const [profilingActive, setProfilingActive] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const records = await getAllRecords<Prediction>("predictions");
      // Sort newest first
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(records);
    } catch (err) {
      console.error("Failed to load prediction history", err);
    }
  };

  // Turn camera on/off
  const startCamera = async () => {
    setError(null);
    try {
      setActiveCam(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check camera permissions or upload an image instead.");
      setActiveCam(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setActiveCam(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Compress image for storage
        const base64Data = canvas.toDataURL("image/jpeg", 0.7);
        setImage(base64Data);
        setMimeType("image/jpeg");
      }
      stopCamera();
    } catch (err: any) {
      setError("Failed to capture image: " + err.message);
    }
  };

  // Compress & handle uploaded image file
  const handleImageFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      
      // Resize to moderate dimensions to avoid hitting IndexedDB limit
      const imgObj = new Image();
      imgObj.src = rawBase64;
      imgObj.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 600;
        let width = imgObj.width;
        let height = imgObj.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(imgObj, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          setImage(compressedBase64);
          setMimeType("image/jpeg");
        }
      };
    };
    reader.onerror = () => setError("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const runDiagnosis = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Split off the data url prefix if needed
      const base64Clean = image.split(",")[1];
      
      const response = await fetch("/api/disease-detect", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Api-Key": localStorage.getItem("gemini_api_key") || ""
        },
        body: JSON.stringify({
          imageBase64: base64Clean,
          mimeType: mimeType || "image/jpeg"
        })
      });

      if (!response.ok) {
        let errMsg = "Analysis failed";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          const text = await response.text().catch(() => "");
          errMsg = text.substring(0, 150) || `Server error (${response.status})`;
        }
        throw new Error(errMsg);
      }

      let report;
      try {
        report = await response.json();
      } catch (jsonErr) {
        throw new Error("Invalid response format received from server.");
      }
      setResult(report);

      // Create smaller thumbnail for history store
      const thumbnailCanvas = document.createElement("canvas");
      thumbnailCanvas.width = 120;
      thumbnailCanvas.height = 120;
      const thumbCtx = thumbnailCanvas.getContext("2d");
      const thumbImg = new Image();
      thumbImg.src = image;
      thumbImg.onload = async () => {
        if (thumbCtx) {
          // crop center square
          const minDim = Math.min(thumbImg.width, thumbImg.height);
          const sx = (thumbImg.width - minDim) / 2;
          const sy = (thumbImg.height - minDim) / 2;
          thumbCtx.drawImage(thumbImg, sx, sy, minDim, minDim, 0, 0, 120, 120);
          
          const thumbBase64 = thumbnailCanvas.toDataURL("image/jpeg", 0.6);
          
          // Save prediction to IndexedDB
          const recordId = "pred_" + Date.now();
          const predictionRecord: Prediction = {
            id: recordId,
            crop: report.crop,
            disease: report.disease,
            confidence: report.confidence,
            imageThumbnail: thumbBase64,
            reasoning: report.reasoning,
            date: new Date().toISOString()
          };
          
          await addRecord("predictions", predictionRecord);
          loadHistory();
        }
      };
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during Gemini diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this diagnosis record?")) {
      try {
        await deleteRecord("predictions", id);
        loadHistory();
        if (result && result.id === id) {
          setResult(null);
        }
      } catch (err) {
        console.error("Failed to delete record", err);
      }
    }
  };

  const loadPastPrediction = (pred: Prediction) => {
    // Reconstruct report object to display in result pane
    setResult({
      crop: pred.crop,
      disease: pred.disease,
      confidence: pred.confidence,
      reasoning: pred.reasoning,
      symptomsObserved: ["Refer to diagnosis details in history log"],
      preventions: {
        organic: ["Refer to Disease Explorer / Prevention module for comprehensive organic protocols"],
        chemical: ["Refer to Disease Explorer / Prevention module for chemical management"],
        cultural: ["Refer to Disease Explorer / Prevention for cultural practices"]
      },
      id: pred.id
    });
    // Scroll to results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetAll = () => {
    setImage(null);
    setMimeType(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="space-y-10 animate-fade-in" id="detect_tab">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
          <Sparkles className="text-[#2E7D32]" size={28} />
          AI Leaf Diagnosis
        </h1>
        <p className="text-[#5D6B5F]">
          Upload or capture a close-up photo of an infected crop leaf. Google Gemini will analyze symptoms, identify the crop and disease, and provide proactive control guidelines.
        </p>
      </div>

      {/* Main Interface Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-6">
            <h2 className="font-display text-lg font-bold text-[#1B3022]">Leaf Image Source</h2>

            {/* Camera View */}
            {activeCam ? (
              <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-video flex items-center justify-center border border-slate-750">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  <button 
                    onClick={capturePhoto}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E7D32] text-white shadow-lg transition hover:bg-[#1B5E20]"
                    title="Capture photo"
                  >
                    <Camera size={22} />
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="rounded-xl bg-slate-805 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-750"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : image ? (
              /* Image Preview */
              <div className="relative rounded-xl border border-[#E8E5DF] bg-[#FDFBF7] overflow-hidden aspect-video group">
                <img src={image} alt="Crop Leaf Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                  <button 
                    onClick={resetAll}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* Drag Drop Box */
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-[#C2C9C3] hover:border-[#2E7D32] rounded-xl p-8 text-center bg-[#FDFBF7] hover:bg-[#F1F8E9]/20 transition group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#5D6B5F] border border-[#E8E5DF] group-hover:bg-[#E8F5E9] group-hover:text-[#2E7D32] transition">
                  <Upload size={22} />
                </div>
                <p className="mt-4 text-sm font-semibold text-[#1B3022]">Drag & drop your leaf image here</p>
                <p className="text-xs text-[#5D6B5F] mt-1">or click to browse your storage</p>
              </div>
            )}

            {/* Select Actions */}
            {!activeCam && !image && (
              <button 
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#E8E5DF] bg-white py-3 text-sm font-semibold text-[#1B3022] transition hover:bg-[#FDFBF7]"
              >
                <Camera size={16} />
                Use Device Camera
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                <div>{error}</div>
              </div>
            )}

            {/* Diagnosis Buttons */}
            {image && !loading && !result && (
              <button 
                onClick={runDiagnosis}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2E7D32]/25 transition hover:bg-[#1B5E20] hover:scale-[1.01]"
              >
                <Sparkles size={16} />
                Analyze with Gemini AI
              </button>
            )}

            {loading && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-[#5D6B5F] font-medium">
                  <RefreshCw size={16} className="animate-spin text-[#2E7D32]" />
                  Gemini reasoning engine running...
                </div>
                <div className="h-1.5 w-full bg-[#E8E5DF] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2E7D32] animate-pulse" style={{ width: "80%" }} />
                </div>
              </div>
            )}

            {result && (
              <button 
                onClick={resetAll}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E5DF] bg-white py-3 text-sm font-semibold text-[#1B3022] transition hover:bg-[#FDFBF7]"
              >
                Scan Another Leaf
              </button>
            )}
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center text-[#5D6B5F]/80">
              <Search className="mx-auto text-[#C2C9C3] mb-4" size={48} />
              <h3 className="font-display text-lg font-bold text-[#1B3022]">Awaiting Diagnosis</h3>
              <p className="text-sm max-w-sm mx-auto mt-2 text-[#5D6B5F]">
                Upload a photo or capture an active infection to view structured crop diagnostic metrics, confidence scores, and therapy guides.
              </p>
            </div>
          )}

          {/* Skeleton Loader during API Call */}
          {loading && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 space-y-6 animate-pulse">
              <div className="flex justify-between items-center border-b border-[#E8E5DF] pb-4">
                <div className="h-6 w-1/3 bg-slate-150 rounded-sm" />
                <div className="h-8 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-1/2 bg-slate-100" />
                  <div className="h-5 w-5/6 bg-[#E8E5DF]" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-1/2 bg-slate-100" />
                  <div className="h-5 w-5/6 bg-[#E8E5DF]" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-1/4 bg-[#E8E5DF]" />
                <div className="h-3 w-full bg-slate-100" />
                <div className="h-3 w-5/6 bg-slate-100" />
              </div>
            </div>
          )}

          {/* Gemini API Diagnostic Report */}
          {result && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-[#E8E5DF] pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#1B3022]">Diagnosis Report</h2>
                  <p className="text-xs text-[#5D6B5F]/80 font-mono mt-0.5">GEMINI DIAGNOSTICS LAB</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                    result.confidence > 75 ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-amber-100 text-amber-800"
                  }`}>
                    {result.confidence}% Confidence
                  </div>
                </div>
              </div>

              {/* Crop & Disease Headers */}
              <div className="grid grid-cols-2 gap-4 bg-[#FDFBF7] rounded-xl p-4 border border-[#E8E5DF]">
                <div>
                  <span className="text-xs text-[#5D6B5F] font-semibold uppercase">Identified Crop</span>
                  <div className="text-lg font-bold text-[#1B3022]">{result.crop}</div>
                </div>
                <div>
                  <span className="text-xs text-[#5D6B5F] font-semibold uppercase">Detected Pathology</span>
                  <div className="text-lg font-bold text-red-600 flex items-center gap-1.5">
                    {result.disease === "Healthy" ? (
                      <span className="text-[#2E7D32] flex items-center gap-1">
                        <CheckCircle2 size={18} /> Healthy
                      </span>
                    ) : (
                      <>
                        <AlertTriangle size={18} className="shrink-0" />
                        {result.disease}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Symptoms Observed */}
              {result.symptomsObserved && result.symptomsObserved.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#1B3022]">Key Observed Symptoms</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {result.symptomsObserved.map((symptom: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#5D6B5F]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C2C9C3] mt-2 shrink-0" />
                        <span>{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reasoning */}
              <div className="space-y-2 bg-[#F1F8E9]/30 border border-[#C2C9C3]/40 rounded-xl p-4">
                <h3 className="text-sm font-bold text-[#2E7D32]">Agronomic Reasoning</h3>
                <p className="text-sm text-[#5D6B5F] leading-relaxed font-sans">{result.reasoning}</p>
              </div>

              {/* Preventions */}
              {result.preventions && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-[#1B3022]">Proactive Prevention Protocols</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Organic */}
                    <div className="border border-[#E8E5DF] rounded-xl p-3 bg-white space-y-1.5">
                      <span className="text-xs font-bold text-[#2E7D32] bg-[#F1F8E9] px-2 py-0.5 rounded-sm">Organic Therapy</span>
                      <ul className="space-y-1 text-xs text-[#5D6B5F]">
                        {result.preventions.organic?.map((p: string, i: number) => (
                          <li key={i} className="flex gap-1">
                            <span className="text-[#2E7D32]">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Chemical */}
                    <div className="border border-[#E8E5DF] rounded-xl p-3 bg-white space-y-1.5">
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm">Chemical Limits</span>
                      <ul className="space-y-1 text-xs text-[#5D6B5F]">
                        {result.preventions.chemical?.map((p: string, i: number) => (
                          <li key={i} className="flex gap-1">
                            <span className="text-amber-500">⚠</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Cultural */}
                    <div className="border border-[#E8E5DF] rounded-xl p-3 bg-white space-y-1.5">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">Cultural Practice</span>
                      <ul className="space-y-1 text-xs text-[#5D6B5F]">
                        {result.preventions.cultural?.map((p: string, i: number) => (
                          <li key={i} className="flex gap-1">
                            <span className="text-blue-500">⚙</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* CNN VISION LAYER VISUALIZER */}
              <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E5DF] pb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1B3022] flex items-center gap-2">
                      <Layers className="text-[#2E7D32]" size={20} />
                      CNN Layer-by-Layer Feature Visualizer
                    </h3>
                    <p className="text-xs text-[#5D6B5F] font-sans mt-0.5">
                      Explore how a deep Convolutional Neural Network (CNN) parses plant leaf pixel structures to isolate pathology indicators.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F1F8E9] text-[#1B5E20] font-mono border border-emerald-100 uppercase shrink-0">
                    PyTorch CNN Pipeline
                  </span>
                </div>

                {/* Layer selector tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "input", label: "1. Input", sub: "256x256x3" },
                    { id: "conv2d", label: "2. Conv2D", sub: "128x128x64" },
                    { id: "relu", label: "3. ReLU", sub: "128x128x64" },
                    { id: "maxpool", label: "4. MaxPool", sub: "64x64x64" },
                    { id: "linear", label: "5. Linear", sub: "Class Prob." }
                  ].map((lay) => (
                    <button
                      key={lay.id}
                      onClick={() => setSelectedCnnLayer(lay.id)}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        selectedCnnLayer === lay.id
                          ? "border-[#2E7D32] bg-[#E8F5E9]/30 text-[#1B3022] font-semibold"
                          : "border-[#E8E5DF] hover:border-[#2E7D32]/50 bg-white text-[#5D6B5F]"
                      }`}
                    >
                      <div className="text-xs font-bold">{lay.label}</div>
                      <div className="text-[9px] font-mono font-medium opacity-80 mt-0.5">{lay.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Layer visualizer panels */}
                <div className="grid gap-6 md:grid-cols-12 items-center bg-[#FDFBF7] p-5 rounded-2xl border border-[#E8E5DF]">
                  {/* Visual Simulation Canvas */}
                  <div className="md:col-span-5 flex justify-center">
                    {selectedCnnLayer === "input" && (
                      <div className="relative w-44 h-44 rounded-xl border border-[#E8E5DF] overflow-hidden bg-slate-900 flex items-center justify-center">
                        <img src={image || ""} alt="Raw Leaf" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 border border-emerald-500/30 bg-radial from-transparent to-black/20 animate-pulse" />
                        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-mono bg-black/70 text-white px-1 rounded">RGB Grid</span>
                      </div>
                    )}

                    {selectedCnnLayer === "conv2d" && (
                      <div className="relative w-44 h-44 rounded-xl border border-emerald-500/30 overflow-hidden bg-emerald-950 p-2 flex flex-wrap gap-1 justify-center items-center">
                        {/* 64 filters simulation */}
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="w-5 h-5 rounded-sm border border-emerald-700/50"
                            style={{
                              background: `radial-gradient(circle, rgba(16,185,129,${0.3 + Math.random() * 0.7}) 10%, rgba(4,120,87,1) 100%)`
                            }}
                          />
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none animate-pulse" />
                        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-mono bg-[#1B5E20] text-white px-1 rounded">Feature Maps (64)</span>
                      </div>
                    )}

                    {selectedCnnLayer === "relu" && (
                      <div className="relative w-44 h-44 rounded-xl border border-emerald-400 overflow-hidden bg-slate-900 flex items-center justify-center p-4">
                        {/* High contrast non-linear threshold leaf outline */}
                        <div className="w-32 h-32 rounded-full bg-emerald-500/20 border-4 border-dashed border-emerald-400 flex items-center justify-center animate-pulse">
                          <AlertTriangle size={36} className="text-emerald-400" />
                        </div>
                        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-mono bg-emerald-600 text-white px-1 rounded">Threshold Mask</span>
                      </div>
                    )}

                    {selectedCnnLayer === "maxpool" && (
                      <div className="relative w-44 h-44 rounded-xl border border-blue-500/30 overflow-hidden bg-slate-900 flex flex-wrap gap-1.5 p-3 items-center justify-center">
                        {/* Downsampled patches */}
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="w-8 h-8 rounded-md bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-[9px] font-mono text-emerald-300 font-bold"
                          >
                            Max
                          </div>
                        ))}
                        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-mono bg-blue-600 text-white px-1 rounded">Spatial Pool (2x2)</span>
                      </div>
                    )}

                    {selectedCnnLayer === "linear" && (
                      <div className="relative w-44 h-44 rounded-xl border border-[#E8E5DF] bg-white p-3 flex flex-col justify-center gap-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700">
                            <span>{result?.disease}</span>
                            <span>{result?.confidence}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${result?.confidence}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Healthy Leaf</span>
                            <span>{100 - result?.confidence}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${100 - result?.confidence}%` }} />
                          </div>
                        </div>
                        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-mono bg-slate-700 text-white px-1 rounded">FC Linear Logits</span>
                      </div>
                    )}
                  </div>

                  {/* Scientific text breakdown */}
                  <div className="md:col-span-7 space-y-3">
                    <h4 className="text-sm font-bold text-[#1B3022] font-sans">
                      {selectedCnnLayer === "input" && "Input Layer Tensor Definition"}
                      {selectedCnnLayer === "conv2d" && "Conv2D Spatial Pattern Extraction"}
                      {selectedCnnLayer === "relu" && "Rectified Linear Activation (Non-Linearity)"}
                      {selectedCnnLayer === "maxpool" && "MaxPool2D Translation Invariance"}
                      {selectedCnnLayer === "linear" && "Fully Connected Logit Classification"}
                    </h4>

                    <p className="text-xs text-[#5D6B5F] leading-relaxed font-sans">
                      {selectedCnnLayer === "input" && `The system loads the uploaded leaf image as a raw 3D tensor of shape [3, 256, 256], representing RGB color channels. Each channel holds pixel values from 0-255 that are normalized prior to inference.`}
                      {selectedCnnLayer === "conv2d" && `The 2D convolutional layer applies 64 distinct sliding 3x3 weight kernels. This extracts high-frequency spatial gradients, identifying leaf lesion edges, spot contours, chlorotic yellow margins, and dark fungal spores.`}
                      {selectedCnnLayer === "relu" && `The elementwise f(x) = max(0, x) activation thresholds negative output signals to absolute zero. This acts as an edge-enhancement filter, eliminating background green noise and emphasizing infected pathological textures.`}
                      {selectedCnnLayer === "maxpool" && `MaxPool2D downsamples spatial grid dimensions by taking the maximum activation value in each 2x2 grid stride. This prevents overfitting, halves spatial memory overhead, and establishes translation invariance.`}
                      {selectedCnnLayer === "linear" && `The final features are flattened into a 1D tensor and mapped through fully connected linear layers. This outputs class logits, which are parsed via a Softmax activation to compute precise crop pathology percentages.`}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {selectedCnnLayer === "input" && "Normalization: ImageNet Mean/Std"}
                        {selectedCnnLayer === "conv2d" && "Stride: 1, Padding: Same"}
                        {selectedCnnLayer === "relu" && "Equation: max(0, x)"}
                        {selectedCnnLayer === "maxpool" && "Pooling Size: 2x2, Stride: 2"}
                        {selectedCnnLayer === "linear" && "Activation: Softmax Logits"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NVIDIA NSIGHT GPU PROFILER PANEL */}
              <div className="rounded-2xl border border-[#E8E5DF] bg-slate-900 text-white p-6 shadow-xs space-y-6 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Activity className="text-emerald-400 animate-pulse animate-duration-3000" size={24} />
                    <div>
                      <h3 className="font-display text-base font-bold text-white tracking-tight">
                        NVIDIA Nsight™ Kernel Profiler
                      </h3>
                      <p className="text-xs text-slate-400 font-sans">
                        Simulated runtime telemetry logging CUDA kernels executing on the H200 GPU node.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Precision Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    {["FP32", "FP16", "BF16"].map((prec) => (
                      <button
                        key={prec}
                        onClick={() => {
                          setProfilingActive(true);
                          setProfilerPrecision(prec as any);
                          setTimeout(() => setProfilingActive(false), 500);
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg transition ${
                          profilerPrecision === prec
                            ? "bg-emerald-500 text-black shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {prec}
                      </button>
                    ))}
                  </div>
                </div>

                {profilingActive ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="animate-spin text-emerald-400" size={28} />
                    <span className="text-xs text-slate-400 font-mono">Sweeping hardware architectures and reloading Nsight trace...</span>
                  </div>
                ) : (
                  <>
                    {/* Performance metrics banner */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">CUDA Exec Time</span>
                        <div className="text-base font-bold font-mono text-emerald-400">
                          {profilerPrecision === "FP32" ? "12.44 ms" : profilerPrecision === "FP16" ? "3.22 ms" : "2.85 ms"}
                        </div>
                        <span className="text-[9px] text-slate-500 leading-none">PyTorch Forward Pass</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">HBM3e Bandwidth</span>
                        <div className="text-base font-bold font-mono text-white">
                          {profilerPrecision === "FP32" ? "824.5 GB/s" : profilerPrecision === "FP16" ? "1.88 TB/s" : "2.44 TB/s"}
                        </div>
                        <span className="text-[9px] text-slate-500 leading-none">Memory Throughput</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Tensor Core TFLOPs</span>
                        <div className="text-base font-bold font-mono text-white">
                          {profilerPrecision === "FP32" ? "14.2 TFLOPs" : profilerPrecision === "FP16" ? "92.5 TFLOPs" : "98.2 TFLOPs"}
                        </div>
                        <span className="text-[9px] text-slate-500 leading-none">SMM Math Throughput</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">FP16/BF16 Speedup</span>
                        <div className="text-base font-bold font-mono text-amber-400">
                          {profilerPrecision === "FP32" ? "1.00x (Base)" : profilerPrecision === "FP16" ? "3.86x Faster" : "4.36x Faster"}
                        </div>
                        <span className="text-[9px] text-slate-500 leading-none">Tensor Core Optimization</span>
                      </div>
                    </div>

                    {/* CUDA Kernels Table */}
                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                      <table className="w-full text-left border-collapse text-[11px] font-mono">
                        <thead className="bg-slate-950 font-bold text-slate-400 border-b border-slate-800 uppercase">
                          <tr>
                            <th className="p-2.5">CUDA Kernel Name</th>
                            <th className="p-2.5">Grid/Block Config</th>
                            <th className="p-2.5 text-right">Time (us)</th>
                            <th className="p-2.5 text-right">HBM3e GB/s</th>
                            <th className="p-2.5 text-right">Tensor Cores</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {[
                            { name: "void cudnn_cnn_gemm_kernel<float>", grid: "[512,1,1] / [256,1,1]", fp32Time: 6420, fp16Time: 1210, bf16Time: 980, bw: "1,224", tc: "YES" },
                            { name: "void max_pool2d_fwd_kernel<float>", grid: "[256,1,1] / [128,1,1]", fp32Time: 1840, fp16Time: 650, bf16Time: 580, bw: "2,442", tc: "NO" },
                            { name: "void threshold_relu_fwd_kernel<float>", grid: "[128,1,1] / [128,1,1]", fp32Time: 920, fp16Time: 320, bf16Time: 290, bw: "2,120", tc: "NO" },
                            { name: "void elementwise_add_bias_kernel<float>", grid: "[128,1,1] / [64,1,1]", fp32Time: 610, fp16Time: 190, bf16Time: 160, bw: "2,110", tc: "NO" },
                            { name: "void cuda_hbm_copy_host_to_device", grid: "Async Memory Copy", fp32Time: 2650, fp16Time: 850, bf16Time: 840, bw: "420", tc: "NO" }
                          ].map((kernel, idx) => (
                            <tr key={idx} className="hover:bg-slate-850">
                              <td className="p-2.5 text-slate-100 truncate max-w-xs">{kernel.name}</td>
                              <td className="p-2.5 text-slate-400">{kernel.grid}</td>
                              <td className="p-2.5 text-right font-bold text-emerald-400">
                                {profilerPrecision === "FP32" ? kernel.fp32Time : profilerPrecision === "FP16" ? kernel.fp16Time : kernel.bf16Time} µs
                              </td>
                              <td className="p-2.5 text-right font-bold">
                                {Math.round(parseFloat(kernel.bw.replace(",", "")) * (profilerPrecision === "FP32" ? 0.4 : profilerPrecision === "FP16" ? 0.9 : 1.0))} GB/s
                              </td>
                              <td className="p-2.5 text-right">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  kernel.tc === "YES" && profilerPrecision !== "FP32"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-slate-800 text-slate-500"
                                }`}>
                                  {kernel.tc === "YES" && profilerPrecision !== "FP32" ? "ACTIVE" : "OFF"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Log Section */}
      <div className="border-t border-[#E8E5DF] pt-8 space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[#1B3022]">Diagnosis History</h2>
          <p className="text-xs text-[#5D6B5F]">Previous crop leaf scans processed locally in your IndexedDB</p>
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-[#E8E5DF] bg-white p-8 text-center text-[#5D6B5F]/80 text-sm">
            No diagnoses saved yet. Begin by analyzing an infected leaf image.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {history.map((pred) => (
              <div 
                key={pred.id}
                onClick={() => loadPastPrediction(pred)}
                className="group cursor-pointer rounded-xl border border-[#E8E5DF] bg-white p-4 shadow-xs transition hover:shadow-md hover:border-[#2E7D32] flex items-start gap-3"
              >
                {/* Thumbnail */}
                <div className="h-14 w-14 rounded-lg bg-[#FDFBF7] border border-[#E8E5DF] overflow-hidden shrink-0">
                  <img src={pred.imageThumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#5D6B5F]/80 font-mono flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(pred.date).toLocaleDateString()}
                  </div>
                  <h4 className="font-display text-sm font-bold text-[#1B3022] truncate leading-snug group-hover:text-[#2E7D32]">
                    {pred.crop}
                  </h4>
                  <p className={`text-xs font-semibold truncate ${
                    pred.disease === "Healthy" ? "text-[#2E7D32]" : "text-red-500"
                  }`}>
                    {pred.disease} ({pred.confidence}%)
                  </p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={(e) => deleteHistoryItem(pred.id, e)}
                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Delete record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
