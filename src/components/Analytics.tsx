import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from "recharts";
import { 
  BarChart3, 
  Sprout, 
  FileCheck, 
  Percent, 
  History, 
  Filter, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { getAllRecords } from "../db";
import { Prediction } from "../types";

export default function Analytics() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [cropFilter, setCropFilter] = useState("all");
  const [diseaseFilter, setDiseaseFilter] = useState("all");

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

  // 1. Calculate Aggregates
  const totalScans = predictions.length;
  
  const avgConfidence = totalScans > 0 
    ? Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / totalScans)
    : 0;

  // Most common crop
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

  // Most common disease
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

  // 2. Prepare Chart Data
  // Crop Distribution Data
  const cropChartData = Object.entries(cropCounts).map(([name, count]) => ({
    name,
    scans: count
  }));

  // Confidence Timeline Data (ordered oldest to newest)
  const sortedPredictions = [...predictions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const timelineData = sortedPredictions.map((p, idx) => ({
    index: idx + 1,
    date: new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    confidence: p.confidence,
    crop: p.crop
  }));

  // Disease Distribution Data (for distribution rails)
  const diseaseSummary = Object.entries(diseaseCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (totalScans || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Filter Table predictions
  const filteredPredictions = predictions.filter(p => {
    const matchesCrop = cropFilter === "all" || p.crop.toLowerCase() === cropFilter.toLowerCase();
    const matchesDisease = diseaseFilter === "all" || p.disease.toLowerCase() === diseaseFilter.toLowerCase();
    return matchesCrop && matchesDisease;
  });

  // Get unique crops and diseases in history for filter selections
  const uniqueCrops = Array.from(new Set(predictions.map(p => p.crop)));
  const uniqueDiseases = Array.from(new Set(predictions.map(p => p.disease)));

  return (
    <div className="space-y-8 animate-fade-in" id="analytics_tab">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
            <BarChart3 className="text-[#2E7D32]" size={28} />
            Agri Analytics Dashboard
          </h1>
          <p className="text-[#5D6B5F] font-sans">
            Explore diagnosis frequency, confidence patterns, crop breakdowns, and crop pathology timelines.
          </p>
        </div>
        <button 
          onClick={loadData}
          className="p-2 rounded-xl border border-[#E8E5DF] bg-white hover:bg-[#FDFBF7] text-[#1B3022] transition flex items-center gap-2 text-xs font-semibold"
          title="Reload metrics"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-24 text-[#5D6B5F] font-medium animate-pulse">
          Recalculating database ledger metrics...
        </div>
      ) : totalScans === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#E8E5DF] bg-white p-12 text-center text-[#5D6B5F]/80">
          <BarChart3 className="mx-auto text-[#C2C9C3] mb-4" size={48} />
          <h3 className="font-display text-lg font-bold text-[#1B3022]">No Analytics Available</h3>
          <p className="text-sm max-w-sm mx-auto mt-2 text-[#5D6B5F]">
            Analytics metrics will generate once you complete your first crop leaf disease diagnosis scans.
          </p>
        </div>
      ) : (
        <>
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
                  <div className="text-sm font-semibold text-[#5D6B5F]">{card.label}</div>
                  <div className="text-xl font-bold text-[#1B3022] font-sans truncate mt-0.5">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-12">
            {/* Crop scans count */}
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

            {/* Confidence trend area chart */}
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

          <div className="grid gap-6 md:grid-cols-12">
            {/* Pathology Distribution Share */}
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

            {/* Prediction History Table */}
            <div className="md:col-span-7 bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-[#1B3022] flex items-center gap-1.5">
                    <History size={16} className="text-[#2E7D32]" />
                    Diagnostic Ledger
                  </h3>
                  <p className="text-xs text-[#5D6B5F] font-sans">Local log of leaf scan records</p>
                </div>
                {/* Micro filters */}
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

              {/* Table wrapper */}
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
        </>
      )}
    </div>
  );
}
