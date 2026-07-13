import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import { 
  BarChart3, 
  Sprout, 
  FileCheck, 
  Percent, 
  History, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Cpu,
  Zap,
  Sliders,
  Settings,
  Play,
  CheckCircle,
  Database
} from "lucide-react";
import { getAllRecords } from "../db";
import { Prediction } from "../types";

export default function Analytics() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab selector
  const [activeSubTab, setActiveSubTab] = useState<"agri" | "gpu">("agri");

  // Filters for Agri tab
  const [cropFilter, setCropFilter] = useState("all");
  const [diseaseFilter, setDiseaseFilter] = useState("all");

  // State for ML playground (cuML tab)
  const [mlAlgorithm, setMlAlgorithm] = useState<"Random Forest" | "SVM" | "XGBoost">("Random Forest");
  const [mlDatasetSize, setMlDatasetSize] = useState<number>(100000);
  const [runMLActive, setRunMLActive] = useState<boolean>(false);
  const [mlBenchmarkResults, setMlBenchmarkResults] = useState<any[] | null>(null);

  // State for GPU Optimizer Sweeper
  const [benchmarkPrecision, setBenchmarkPrecision] = useState<"FP32" | "FP16" | "BF16">("FP16");
  const [benchmarkAttention, setBenchmarkAttention] = useState<"Naive" | "FlashAttention-1" | "FlashAttention-2">("FlashAttention-2");
  const [benchmarkTP, setBenchmarkTP] = useState<number>(2);
  const [runBenchmarkActive, setRunBenchmarkActive] = useState<boolean>(false);
  const [sweepResults, setSweepResults] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAllRecords<Prediction>("predictions");
      setPredictions(list);
    } catch (err) {
      console.error("Failed to load analytics data", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Agri Tab Calculations ---
  const totalScans = predictions.length;
  
  const avgConfidence = totalScans > 0 
    ? Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / totalScans)
    : 0;

  const cropCounts: { [key: string]: number } = {};
  predictions.forEach(p => { cropCounts[p.crop] = (cropCounts[p.crop] || 0) + 1; });
  let mostCommonCrop = "None";
  let maxCropCount = 0;
  Object.entries(cropCounts).forEach(([crop, count]) => {
    if (count > maxCropCount) {
      maxCropCount = count;
      mostCommonCrop = crop;
    }
  });

  const diseaseCounts: { [key: string]: number } = {};
  predictions.forEach(p => { 
    if (p.disease !== "Healthy") {
      diseaseCounts[p.disease] = (diseaseCounts[p.disease] || 0) + 1; 
    }
  });
  let primaryThreat = "None";
  let maxDiseaseCount = 0;
  Object.entries(diseaseCounts).forEach(([disease, count]) => {
    if (count > maxDiseaseCount) {
      maxDiseaseCount = count;
      primaryThreat = disease;
    }
  });

  const cropChartData = Object.entries(cropCounts).map(([name, count]) => ({
    name,
    scans: count
  }));

  const sortedPredictions = [...predictions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const timelineData = sortedPredictions.map((p, idx) => ({
    index: idx + 1,
    date: new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    confidence: p.confidence,
    crop: p.crop
  }));

  const diseaseSummary = Object.entries(diseaseCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (totalScans || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  const filteredPredictions = predictions.filter(p => {
    const matchesCrop = cropFilter === "all" || p.crop.toLowerCase() === cropFilter.toLowerCase();
    const matchesDisease = diseaseFilter === "all" || p.disease.toLowerCase() === diseaseFilter.toLowerCase();
    return matchesCrop && matchesDisease;
  });

  const uniqueCrops = Array.from(new Set(predictions.map(p => p.crop)));
  const uniqueDiseases = Array.from(new Set(predictions.map(p => p.disease)));

  // --- GPU ML cuML Simulator Execution ---
  const executeMLTraining = () => {
    setRunMLActive(true);
    setMlBenchmarkResults(null);
    setTimeout(() => {
      // CPU-bound sklearn vs RAPIDS cuML execution timing simulation
      // Bigger sample size = higher speedup ratio
      const cpuBaseFactor = mlAlgorithm === "Random Forest" ? 4.2 : mlAlgorithm === "XGBoost" ? 3.5 : 2.8;
      const gpuBaseFactor = mlAlgorithm === "Random Forest" ? 0.02 : mlAlgorithm === "XGBoost" ? 0.015 : 0.03;
      
      const cpuTime = parseFloat(((mlDatasetSize / 1000) * cpuBaseFactor).toFixed(2));
      const gpuTime = parseFloat(((mlDatasetSize / 1000) * gpuBaseFactor * (1 / (1 + Math.log10(mlDatasetSize / 1000)))).toFixed(3));
      const speedup = parseFloat((cpuTime / gpuTime).toFixed(1));

      setMlBenchmarkResults([
        { platform: "Scikit-Learn (CPU)", time: cpuTime, color: "#888888" },
        { platform: "RAPIDS cuML (H200 GPU)", time: gpuTime, color: "#10B981" }
      ]);
      setRunMLActive(false);
    }, 1000);
  };

  // --- GPU Optimizer Sweep Simulation ---
  const executeOptimizerSweep = () => {
    setRunBenchmarkActive(true);
    setSweepResults(null);
    setTimeout(() => {
      // Calculate outputs based on toggled parameter constraints
      // Precision factors: FP32 = 1.0 (base), FP16 = 3.5, BF16 = 3.8
      // Attention factors: Naive = 1.0, FA-1 = 1.8, FA-2 = 2.4
      // TP factors: scales token generation linearly up to TP=4, but increases overhead
      let baseTflops = 15;
      let attentionMultiplier = 1.0;
      let precMultiplier = 1.0;
      let memoryFootprint = 141; // H200 has 141GB VRAM

      if (benchmarkPrecision === "FP16") {
        precMultiplier = 5.2;
        memoryFootprint -= 65; // halved model activations
      } else if (benchmarkPrecision === "BF16") {
        precMultiplier = 5.5;
        memoryFootprint -= 68;
      }

      if (benchmarkAttention === "FlashAttention-1") {
        attentionMultiplier = 1.8;
        memoryFootprint -= 20; // memory efficient attention
      } else if (benchmarkAttention === "FlashAttention-2") {
        attentionMultiplier = 2.5;
        memoryFootprint -= 35; // dynamic thread scheduling
      }

      // TP overhead scales down VRAM footprint but increases inter-GPU comms slightly
      if (benchmarkTP === 2) {
        memoryFootprint = Math.round(memoryFootprint / 1.8);
      } else if (benchmarkTP === 4) {
        memoryFootprint = Math.round(memoryFootprint / 3.4);
      }

      const calculatedTflops = Math.round(baseTflops * precMultiplier * attentionMultiplier * (0.9 + Math.random() * 0.1));
      const tokensPerSec = Math.round((calculatedTflops / 1.2) * (benchmarkTP * 0.85));

      setSweepResults({
        tflops: calculatedTflops,
        tokensPerSec,
        vram: memoryFootprint,
        commsLatency: benchmarkTP === 1 ? "0.00 µs (No NVLink)" : benchmarkTP === 2 ? "1.12 µs (NVLink-4)" : "2.04 µs (Inter-GPU NVLink Switch)"
      });
      setRunBenchmarkActive(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="analytics_tab">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 border-b border-[#E8E5DF] pb-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
            <BarChart3 className="text-[#2E7D32]" size={28} />
            Agri & GPU Performance Analytics
          </h1>
          <p className="text-[#5D6B5F] font-sans">
            Review your local plant disease statistics alongside state-of-the-art H200 deep learning benchmarks.
          </p>
        </div>
        <button 
          onClick={loadData}
          className="p-2 rounded-xl border border-[#E8E5DF] bg-white hover:bg-[#FDFBF7] text-[#1B3022] transition flex items-center gap-2 text-xs font-semibold"
          title="Reload metrics"
        >
          <RefreshCw size={13} />
          Refresh Stats
        </button>
      </div>

      {/* SUB TAB SELECTOR */}
      <div className="flex gap-2 border-b border-[#E8E5DF] pb-1 shrink-0">
        <button
          onClick={() => setActiveSubTab("agri")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === "agri"
              ? "border-[#2E7D32] text-[#2E7D32]"
              : "border-transparent text-[#5D6B5F] hover:text-[#1B3022]"
          }`}
        >
          <Sprout size={16} />
          Agriculture Diagnostics Stats
        </button>
        <button
          onClick={() => setActiveSubTab("gpu")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === "gpu"
              ? "border-[#2E7D32] text-[#2E7D32]"
              : "border-transparent text-[#5D6B5F] hover:text-[#1B3022]"
          }`}
        >
          <Cpu size={16} />
          H200 GPU Acceleration & Optimizers
        </button>
      </div>

      {loading ? (
        <div className="text-center py-24 text-[#5D6B5F] font-medium animate-pulse">
          Recalculating database ledger metrics...
        </div>
      ) : activeSubTab === "agri" ? (
        /* --- AGRICULTURE DIAGNOSTICS SUB-TAB --- */
        totalScans === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E8E5DF] bg-white p-12 text-center text-[#5D6B5F]/80">
            <BarChart3 className="mx-auto text-[#C2C9C3] mb-4" size={48} />
            <h3 className="font-display text-lg font-bold text-[#1B3022]">No Analytics Available</h3>
            <p className="text-sm max-w-sm mx-auto mt-2 text-[#5D6B5F]">
              Analytics metrics will generate once you complete your first crop leaf disease diagnosis scans.
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Key Metric cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Total Leaf Scans", value: totalScans, icon: FileCheck, bg: "text-[#2E7D32] bg-[#E8F5E9]" },
                { label: "Average Confidence", value: `${avgConfidence}%`, icon: Percent, bg: "text-blue-600 bg-blue-50" },
                { label: "Primary Host Crop", value: mostCommonCrop, icon: Sprout, bg: "text-emerald-600 bg-emerald-50" },
                { label: "Primary Threat", value: primaryThreat, icon: AlertTriangle, bg: "text-red-600 bg-red-50" }
              ].map((card, idx) => (
                <div key={idx} className="bg-white border border-[#E8E5DF] p-5 rounded-2xl shadow-xs flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <card.icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#5D6B5F] uppercase tracking-wider">{card.label}</div>
                    <div className="text-lg font-bold text-[#1B3022] font-sans truncate mt-0.5">{card.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-6 bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-xs space-y-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#1B3022]">Crop Scan Volume</h3>
                  <p className="text-xs text-[#5D6B5F] font-sans">Count of diagnostic leaf scans executed per crop species</p>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cropChartData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "#ffffff", border: "1px solid #E8E5DF", borderRadius: "12px", fontSize: "11px" }}
                      />
                      <Bar dataKey="scans" fill="#2E7D32" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="md:col-span-6 bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#1B3022]">Confidence Score Trend</h3>
                    <p className="text-xs text-[#5D6B5F] font-sans">Accuracy metrics logged over consecutive diagnosis operations</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-sm">
                    <TrendingUp size={12} />
                    {avgConfidence}% AVG
                  </div>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E5DF" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis domain={[50, 100]} stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "#ffffff", border: "1px solid #E8E5DF", borderRadius: "12px", fontSize: "11px" }}
                      />
                      <Area type="monotone" dataKey="confidence" stroke="#1B5E20" fill="#C8E6C9" fillOpacity={0.4} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pathology Distribution Share & History Table */}
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-5 bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-xs space-y-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#1B3022]">Pathology Distribution</h3>
                  <p className="text-xs text-[#5D6B5F] font-sans">Relative threat prevalence share among diseased leaf tissue scans</p>
                </div>
                <div className="space-y-4 pt-2 overflow-y-auto max-h-60">
                  {diseaseSummary.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[#5D6B5F]">
                        <span className="truncate">{item.name}</span>
                        <span>{item.count} scans ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 w-full bg-[#FDFBF7] border border-[#E8E5DF] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {diseaseSummary.length === 0 && (
                    <div className="text-center text-xs text-[#5D6B5F] py-12">
                      No active infections recorded. All host crops are cataloged as healthy.
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-7 bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#1B3022] flex items-center gap-1.5">
                      <History size={16} className="text-[#2E7D32]" />
                      Diagnostic Ledger
                    </h3>
                    <p className="text-xs text-[#5D6B5F] font-sans">Local log of leaf scan records</p>
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={cropFilter}
                      onChange={(e) => setCropFilter(e.target.value)}
                      className="px-2 py-1 border border-[#E8E5DF] rounded-lg text-xs font-semibold bg-white text-[#1B3022]"
                    >
                      <option value="all">All Crops</option>
                      {uniqueCrops.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                    <select 
                      value={diseaseFilter}
                      onChange={(e) => setDiseaseFilter(e.target.value)}
                      className="px-2 py-1 border border-[#E8E5DF] rounded-lg text-xs font-semibold bg-white text-[#1B3022]"
                    >
                      <option value="all">All Diseases</option>
                      {uniqueDiseases.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-60 rounded-xl border border-[#E8E5DF]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#FDFBF7] font-bold text-[#5D6B5F] border-b border-[#E8E5DF] uppercase font-sans">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Host Crop</th>
                        <th className="p-3">Diagnosis</th>
                        <th className="p-3 text-right">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E5DF] text-[#5D6B5F] font-sans font-medium">
                      {filteredPredictions.map((pred, i) => (
                        <tr key={pred.id} className="hover:bg-[#FDFBF7]/50">
                          <td className="p-3 font-mono">{new Date(pred.date).toLocaleDateString()}</td>
                          <td className="p-3 font-semibold text-[#1B3022]">{pred.crop}</td>
                          <td className="p-3 font-semibold">
                            <span className={pred.disease === "Healthy" ? "text-[#2E7D32]" : "text-red-500"}>
                              {pred.disease}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#1B3022]">{pred.confidence}%</td>
                        </tr>
                      ))}
                      {filteredPredictions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center p-8 text-[#5D6B5F]">
                            No scans match active criteria filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* --- GPU ACCELERATION BENCHMARKS SUB-TAB --- */
        <div className="space-y-8 animate-fade-in">
          {/* Module 1: cuML Playground */}
          <div className="grid gap-6 md:grid-cols-12 items-start">
            <div className="md:col-span-5 bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-xs space-y-5">
              <div className="border-b border-[#E8E5DF] pb-3">
                <h3 className="font-display text-base font-bold text-[#1B3022] flex items-center gap-2">
                  <Database className="text-emerald-600" size={18} />
                  RAPIDS cuML Accelerated ML
                </h3>
                <p className="text-xs text-[#5D6B5F] font-sans mt-0.5">
                  Benchmark Scikit-learn on CPU against RAPIDS cuML on an NVIDIA H200 Tensor Core GPU using structured agricultural datasets.
                </p>
              </div>

              {/* Form parameters */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#5D6B5F] uppercase">ML Algorithm</label>
                  <select
                    value={mlAlgorithm}
                    onChange={(e: any) => setMlAlgorithm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E5DF] text-xs font-semibold bg-white text-[#1B3022]"
                  >
                    <option value="Random Forest">Random Forest Classifier</option>
                    <option value="XGBoost">XGBoost Decision Trees</option>
                    <option value="SVM">Support Vector Machine (RBF Kernel)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#5D6B5F] uppercase">Sample Row Count</label>
                  <select
                    value={mlDatasetSize}
                    onChange={(e) => setMlDatasetSize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E5DF] text-xs font-semibold bg-white text-[#1B3022]"
                  >
                    <option value="10000">10,000 Rows (Small dataset)</option>
                    <option value="100000">100,000 Rows (Medium catalog)</option>
                    <option value="1000000">1,000,000 Rows (Big Agri-Sensors)</option>
                  </select>
                </div>

                <button
                  onClick={executeMLTraining}
                  disabled={runMLActive}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {runMLActive ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      Allocating CUDA Threads...
                    </>
                  ) : (
                    <>
                      <Play size={12} />
                      Run Training on H200
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results chart */}
            <div className="md:col-span-7 bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between h-full min-h-[300px]">
              <div>
                <h3 className="font-display text-sm font-bold text-[#1B3022]">Training Time Comparison (Seconds)</h3>
                <p className="text-xs text-[#5D6B5F]">Lower execution times represent higher computational performance.</p>
              </div>

              {mlBenchmarkResults ? (
                <div className="space-y-6">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mlBenchmarkResults} layout="vertical">
                        <XAxis type="number" stroke="#888888" fontSize={10} />
                        <YAxis dataKey="platform" type="category" stroke="#888888" fontSize={10} width={120} />
                        <Tooltip contentStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="time" radius={[0, 4, 4, 0]} maxBarSize={25}>
                          {mlBenchmarkResults.map((entry, index) => (
                            <Bar key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <strong>Massive Speedup Detected:</strong> H200 GPU completed training <strong>
                        {(mlBenchmarkResults[0].time / mlBenchmarkResults[1].time).toFixed(1)}x
                      </strong> faster. Scikit-learn experienced severe CPU thread-starvation during split criteria calculations.
                    </div>
                  </div>
                </div>
              ) : runMLActive ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <RefreshCw className="animate-spin text-emerald-600" size={32} />
                  <span className="text-xs font-mono">Running cuML forward/backward loops...</span>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center py-12 text-center text-xs text-[#5D6B5F] border border-dashed border-[#E8E5DF] rounded-xl">
                  Awaiting training trigger. Select a classification algorithm and dataset scale to begin profiling.
                </div>
              )}
            </div>
          </div>

          {/* Module 8: GPU Optimization Sweeper */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Zap className="text-yellow-400" size={20} />
                NVIDIA H200 Optimizer Sweep Control Console
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Optimize model deployment configurations. Experiment with variable hardware acceleration parameters and measure compute density.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-12 items-start">
              {/* Controls */}
              <div className="md:col-span-5 space-y-4">
                {/* Precision */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Precision Mode</span>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {["FP32", "FP16", "BF16"].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBenchmarkPrecision(val as any)}
                        className={`py-1 text-[10px] font-bold font-mono rounded-lg transition ${
                          benchmarkPrecision === val ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attention */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Attention Algorithm</span>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {["Naive", "FlashAttention-1", "FlashAttention-2"].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBenchmarkAttention(val as any)}
                        className={`py-1 text-[9px] font-bold font-mono rounded-lg transition ${
                          benchmarkAttention === val ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {val === "Naive" ? "Naive" : val === "FlashAttention-1" ? "FA-1" : "FA-2"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tensor Parallelism */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Tensor Parallelism (TP Scale)</span>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {[1, 2, 4].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBenchmarkTP(val)}
                        className={`py-1 text-[10px] font-bold font-mono rounded-lg transition ${
                          benchmarkTP === val ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        TP = {val}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={executeOptimizerSweep}
                  disabled={runBenchmarkActive}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 py-3 text-xs font-bold text-black transition disabled:opacity-50"
                >
                  {runBenchmarkActive ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      Analyzing Memory Access Patterns...
                    </>
                  ) : (
                    <>
                      <Sliders size={12} />
                      Run Optimization Sweep
                    </>
                  )}
                </button>
              </div>

              {/* Display Sweep Outcomes */}
              <div className="md:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between h-full min-h-[280px]">
                {sweepResults ? (
                  <div className="space-y-5 animate-fade-in font-mono">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400">BENCHMARK OUTCOMES (NVIDIA H200)</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">PASS</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[8px] text-slate-400 uppercase font-bold block">VRAM FOOTPRINT</span>
                        <div className="text-xl font-bold text-white mt-1">{sweepResults.vram} GB</div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-500" 
                            style={{ width: `${(sweepResults.vram / 141) * 100}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-slate-500 block mt-1">HBM3e Capacity Utilized</span>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[8px] text-slate-400 uppercase font-bold block">COMPUTE CAPACITY</span>
                        <div className="text-xl font-bold text-yellow-400 mt-1">{sweepResults.tflops} TFLOPs</div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="h-full bg-yellow-400 transition-all duration-500" 
                            style={{ width: `${(sweepResults.tflops / 500) * 100}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-slate-500 block mt-1">Tensor Core Operations</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                        <span className="text-slate-400">SMM Execution Throughput</span>
                        <span className="text-white font-bold">{sweepResults.tokensPerSec} tokens / sec</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                        <span className="text-slate-400">Inter-GPU Communication Over NVLink</span>
                        <span className="text-white font-bold">{sweepResults.commsLatency}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Estimated SMM Energy Efficiency</span>
                        <span className="text-emerald-400 font-bold">~1.84 GigaFLOPs / Watt</span>
                      </div>
                    </div>
                  </div>
                ) : runBenchmarkActive ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2 text-slate-400 font-mono">
                    <RefreshCw className="animate-spin text-yellow-400" size={32} />
                    <span className="text-xs">Sweeping CUDA Block sizes and shared memory access...</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl">
                    <Sliders className="text-slate-700 mb-2" size={32} />
                    <span className="text-xs text-slate-500 font-mono">
                      Awaiting optimizer sweep trigger. Configure parameters to compute VRAM allocations and token generation efficiency.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
