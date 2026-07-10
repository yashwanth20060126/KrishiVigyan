import React, { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";
import { 
  ThermometerSun, 
  CloudRain, 
  Droplets, 
  RefreshCw, 
  Sparkles, 
  Info,
  TrendingUp
} from "lucide-react";
import { getAllRecords } from "../db";
import { Crop, Disease } from "../types";

export default function TrendSimulation() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  
  // Selection
  const [selectedCropId, setSelectedCropId] = useState("");
  const [selectedDiseaseId, setSelectedDiseaseId] = useState("");

  // Environmental Sliders
  const [temp, setTemp] = useState(26); // 10 to 45 °C
  const [humidity, setHumidity] = useState(78); // 20 to 100%
  const [rainfall, setRainfall] = useState(150); // 0 to 400mm

  const [explainLoading, setExplainLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const cropsList = await getAllRecords<Crop>("crops");
        const diseasesList = await getAllRecords<Disease>("diseases");
        setCrops(cropsList);
        setDiseases(diseasesList);
        if (cropsList.length > 0) setSelectedCropId(cropsList[0].id);
      } catch (err) {
        console.error("Failed to load sim catalog", err);
      }
    }
    loadData();
  }, []);

  // Update disease select when crop changes
  useEffect(() => {
    if (selectedCropId) {
      const cropDiseases = diseases.filter(d => d.cropId === selectedCropId);
      if (cropDiseases.length > 0) {
        setSelectedDiseaseId(cropDiseases[0].id);
      } else {
        setSelectedDiseaseId("");
      }
    }
  }, [selectedCropId, diseases]);

  const activeDisease = diseases.find(d => d.id === selectedDiseaseId);
  const activeCrop = crops.find(c => c.id === selectedCropId);

  // --- HEURISTIC RISK ENGINE ---
  const calculateRisk = (t: number, h: number, r: number) => {
    // Fungal and bacterial pathogens thrive in warm (20-35°C), humid (>75%), rainy weather.
    let score = 0;

    // 1. Humidity factor (up to 40 points)
    score += (h / 100) * 40;

    // 2. Rainfall factor (up to 30 points)
    score += (r / 400) * 30;

    // 3. Temperature factor (up to 30 points)
    // Most pathogens have optimal growth around 22°C to 32°C
    if (t >= 22 && t <= 32) {
      score += 30;
    } else if ((t >= 16 && t < 22) || (t > 32 && t <= 38)) {
      score += 15;
    } else {
      score += 5;
    }

    const finalScore = Math.min(100, Math.round(score));

    let level: "Low" | "Medium" | "High" | "Critical" = "Low";
    let color = "text-[#2E7D32] bg-[#E8F5E9] border-[#E8E5DF]";
    let progressColor = "bg-[#2E7D32]";

    if (finalScore >= 80) {
      level = "Critical";
      color = "text-red-700 bg-red-50 border-red-200";
      progressColor = "bg-red-600";
    } else if (finalScore >= 60) {
      level = "High";
      color = "text-orange-700 bg-orange-50 border-orange-200";
      progressColor = "bg-orange-500";
    } else if (finalScore >= 35) {
      level = "Medium";
      color = "text-amber-700 bg-amber-50 border-amber-200";
      progressColor = "bg-amber-500";
    }

    return { score: finalScore, level, color, progressColor };
  };

  const currentRisk = calculateRisk(temp, humidity, rainfall);

  // Recharts simulation curve: Risk vs Temperature (from 10°C to 45°C) at constant humidity and rain
  const generateChartData = () => {
    const data = [];
    for (let t = 10; t <= 45; t += 2) {
      const risk = calculateRisk(t, humidity, rainfall);
      data.push({
        temp: `${t}°C`,
        riskScore: risk.score
      });
    }
    return data;
  };

  const explainRiskFactor = async () => {
    if (!activeCrop || !activeDisease) return;
    setExplainLoading(true);
    setExplanation(null);

    try {
      const response = await fetch("/api/simulate-explain", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Api-Key": localStorage.getItem("gemini_api_key") || ""
        },
        body: JSON.stringify({
          crop: activeCrop.name,
          disease: activeDisease.name,
          temp,
          humidity,
          rainfall,
          riskLevel: currentRisk.level,
          riskScore: currentRisk.score
        })
      });

      if (!response.ok) {
        let errMsg = "Simulation explanation failed";
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
        throw new Error("Invalid response format received from simulation service.");
      }
      setExplanation(data.explanation);
    } catch (err: any) {
      console.error(err);
      setExplanation(`Unable to generate AI explanation: ${err.message}`);
    } finally {
      setExplainLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="simulation_tab">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
          <ThermometerSun className="text-[#2E7D32]" size={28} />
          Pathogen Spread Simulator
        </h1>
        <p className="text-[#5D6B5F] font-sans">
          Simulate environmental threat vectors. Adjust sliders to see disease outbreak risks change on live temperature graphs, and consult Gemini for agronomist explanations.
        </p>
      </div>

      {/* Control panel and risk display */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Sliders controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-6">
            <h2 className="font-display text-base font-bold text-[#1B3022]">Environmental Parameters</h2>
            
            {/* Target selection */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#E8E5DF]">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5D6B5F]/85 uppercase">Host Crop</label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] text-xs font-semibold bg-white text-[#1B3022]"
                >
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5D6B5F]/85 uppercase">Pathology</label>
                <select
                  value={selectedDiseaseId}
                  onChange={(e) => setSelectedDiseaseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] text-xs font-semibold bg-white text-[#1B3022]"
                  disabled={!selectedDiseaseId}
                >
                  {diseases.filter(d => d.cropId === selectedCropId).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sliders list */}
            <div className="space-y-5">
              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#5D6B5F]">
                  <span className="flex items-center gap-1">
                    <ThermometerSun size={14} className="text-orange-500" />
                    Air Temperature
                  </span>
                  <span className="font-mono font-bold text-[#1B3022] bg-[#FDFBF7] px-2 py-0.5 rounded-sm border border-[#E8E5DF]">{temp}°C</span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="45"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E8E5DF]/50 rounded-lg appearance-none cursor-pointer accent-[#2E7D32]"
                />
                <div className="flex justify-between text-[10px] text-[#5D6B5F]/80 font-bold">
                  <span>10°C (Cold)</span>
                  <span>45°C (Extreme Heat)</span>
                </div>
              </div>

              {/* Humidity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#5D6B5F]">
                  <span className="flex items-center gap-1">
                    <Droplets size={14} className="text-blue-500" />
                    Relative Humidity
                  </span>
                  <span className="font-mono font-bold text-[#1B3022] bg-[#FDFBF7] px-2 py-0.5 rounded-sm border border-[#E8E5DF]">{humidity}%</span>
                </div>
                <input 
                  type="range"
                  min="20"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E8E5DF]/50 rounded-lg appearance-none cursor-pointer accent-[#2E7D32]"
                />
                <div className="flex justify-between text-[10px] text-[#5D6B5F]/80 font-bold">
                  <span>20% (Dry)</span>
                  <span>100% (Saturated)</span>
                </div>
              </div>

              {/* Rainfall */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#5D6B5F]">
                  <span className="flex items-center gap-1">
                    <CloudRain size={14} className="text-sky-500" />
                    Accumulated Rainfall
                  </span>
                  <span className="font-mono font-bold text-[#1B3022] bg-[#FDFBF7] px-2 py-0.5 rounded-sm border border-[#E8E5DF]">{rainfall}mm</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="400"
                  value={rainfall}
                  onChange={(e) => setRainfall(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E8E5DF]/50 rounded-lg appearance-none cursor-pointer accent-[#2E7D32]"
                />
                <div className="flex justify-between text-[10px] text-[#5D6B5F]/80 font-bold">
                  <span>0mm (Arid)</span>
                  <span>400mm (Heavy Monsoon)</span>
                </div>
              </div>
            </div>

            {/* Risk Heuristic Output */}
            <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${currentRisk.color}`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Calculated Outbreak Risk</span>
                <span className="text-lg font-bold font-sans">{currentRisk.level} ({currentRisk.score}/100)</span>
              </div>
              <div className="w-16 h-2.5 bg-slate-200/25 rounded-full overflow-hidden shrink-0">
                <div className={`h-full ${currentRisk.progressColor}`} style={{ width: `${currentRisk.score}%` }} />
              </div>
            </div>

            {activeDisease && (
              <button
                onClick={explainRiskFactor}
                disabled={explainLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] py-3 text-sm font-semibold text-white shadow-lg shadow-[#2E7D32]/10 transition hover:bg-[#1B5E20] disabled:opacity-55 hover:scale-[1.01]"
              >
                {explainLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Explain Environmental Risk
              </button>
            )}
          </div>
        </div>

        {/* Live chart and explanation display */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recharts Curve Graph */}
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-[#1B3022] flex items-center gap-1.5">
                <TrendingUp size={16} className="text-[#2E7D32]" />
                Temp-Outbreak Response Curve
              </h3>
              <p className="text-xs text-[#5D6B5F]/80 font-sans">Risk dynamics across temperature scale (10°C - 45°C) at constant humidity and rainfall</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateChartData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E5DF" />
                  <XAxis dataKey="temp" stroke="#5D6B5F" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#5D6B5F" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "#FDFBF7", border: "1px solid #E8E5DF", borderRadius: "12px", fontSize: "11px" }}
                  />
                  <Line type="monotone" dataKey="riskScore" stroke="#2E7D32" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Explanation details block */}
          {explainLoading && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 animate-pulse space-y-3">
              <div className="h-4 w-1/3 bg-[#E8E5DF]" />
              <div className="h-3 w-full bg-[#FDFBF7]" />
              <div className="h-3 w-5/6 bg-[#FDFBF7]" />
            </div>
          )}

          {explanation && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-4 animate-fade-in">
              <div className="flex gap-2 items-center border-b border-[#E8E5DF] pb-3">
                <Sparkles className="text-amber-500 animate-pulse" size={18} />
                <h3 className="font-display text-sm font-bold text-[#1B3022]">
                  Agronomist Assessment: {activeDisease?.name} in {temp}°C
                </h3>
              </div>
              <p className="text-sm text-[#5D6B5F] leading-relaxed whitespace-pre-wrap font-sans bg-[#FDFBF7] p-4 rounded-xl border border-[#E8E5DF]">
                {explanation}
              </p>
            </div>
          )}

          {!explanation && !explainLoading && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 text-center text-[#5D6B5F]/80 text-xs flex items-center gap-2 justify-center border-dashed">
              <Info size={14} className="text-[#5D6B5F]" />
              Click "Explain Environmental Risk" to invoke Gemini for real-time biological reasoning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
