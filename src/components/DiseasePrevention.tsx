import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Sprout, 
  Settings, 
  Trash2, 
  CheckSquare, 
  Plus, 
  Leaf, 
  Flame, 
  Wrench,
  BookOpen
} from "lucide-react";
import { getAllRecords } from "../db";
import { Crop, Disease } from "../types";

export default function DiseasePrevention() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"organic" | "chemical" | "cultural">("organic");

  // Interactive sanitation checklist state
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Sanitize hand shears and cutting tools with 70% isopropyl alcohol after pruning infected crops.", checked: false },
    { id: 2, text: "Uproot and bury/burn highly symptomatic virus-hosting plants in the early weeks.", checked: false },
    { id: 3, text: "Establish organic straw or plastic mulch around the soil bed to block fungal splash.", checked: false },
    { id: 4, text: "Clear weedy borders around the fields to deprive whiteflies and aphids of intermediate breeding sites.", checked: false },
    { id: 5, text: "Test irrigation schedule to water crops early in the morning so the sun dries leaves quickly.", checked: false },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const cropsList = await getAllRecords<Crop>("crops");
        const diseasesList = await getAllRecords<Disease>("diseases");
        setCrops(cropsList);
        setDiseases(diseasesList);
        if (diseasesList.length > 0) {
          setSelectedDiseaseId(diseasesList[0].id);
        }
      } catch (err) {
        console.error("Failed to load prevention data", err);
      }
    }
    loadData();
  }, []);

  const toggleChecklist = (id: number) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const selectedDisease = diseases.find(d => d.id === selectedDiseaseId);
  const associatedCrop = selectedDisease ? crops.find(c => c.id === selectedDisease.cropId) : null;

  return (
    <div className="space-y-8 animate-fade-in" id="prevention_tab">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
          <ShieldAlert className="text-[#2E7D32]" size={28} />
          Integrated Prevention Therapy
        </h1>
        <p className="text-[#5D6B5F]">
          Proactive field management strategies. Review organic, chemical, and cultural pest controls, and complete daily field hygiene audits.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Selection Pane */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-4">
            <h2 className="font-display text-base font-bold text-[#1B3022]">Select Pathology Threat</h2>
            <div className="space-y-2">
              <label className="text-xs text-[#5D6B5F] font-semibold uppercase">Pathogen Species</label>
              <select
                value={selectedDiseaseId}
                onChange={(e) => setSelectedDiseaseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] text-sm font-sans bg-white"
              >
                {diseases.map(d => (
                  <option key={d.id} value={d.id}>
                    {crops.find(c => c.id === d.cropId)?.name} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDisease && (
              <div className="rounded-xl bg-[#FDFBF7] p-4 border border-[#E8E5DF] space-y-2 text-xs text-[#5D6B5F]">
                <div className="font-semibold text-[#1B3022]">Pathology At-A-Glance</div>
                <div><span className="font-bold">Family:</span> {associatedCrop?.family || "Solanaceae"}</div>
                <div className="italic"><span className="font-bold font-sans not-italic">Cause:</span> {selectedDisease.cause}</div>
              </div>
            )}
          </div>

          {/* Daily Field Sanitation Checklist */}
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-4">
            <h2 className="font-display text-base font-bold text-[#1B3022]">Field Hygiene Audit</h2>
            <p className="text-xs text-[#5D6B5F]">Mark off daily sanitation items to minimize spore and vector transmissions.</p>
            
            <div className="space-y-3 pt-2">
              {checklist.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className="flex items-start gap-2.5 cursor-pointer select-none group text-xs text-[#5D6B5F] leading-normal"
                >
                  <input 
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}} // toggled on container click
                    className="mt-0.5 rounded text-[#2E7D32] focus:ring-[#2E7D32] accent-[#2E7D32] cursor-pointer h-3.5 w-3.5"
                  />
                  <span className={`transition group-hover:text-[#1B3022] ${item.checked ? "line-through text-slate-400" : ""}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preventative Protocol Display */}
        <div className="lg:col-span-8">
          {selectedDisease ? (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white overflow-hidden shadow-xs">
              {/* Card title banner */}
              <div className="bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white p-6 space-y-2">
                <div className="inline-block rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold backdrop-blur-xs text-[#E8F5E9]">
                  {associatedCrop?.name} Leaf Care Plan
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight">{selectedDisease.name} IPM Guide</h2>
                <p className="text-xs text-[#E8F5E9]/80 font-mono flex items-center gap-1">
                  <BookOpen size={12} /> Resource Citation: {selectedDisease.reference}
                </p>
              </div>

              {/* Subtabs controls */}
              <div className="grid grid-cols-3 border-b border-[#E8E5DF] bg-[#FDFBF7] text-center">
                {[
                  { id: "organic", label: "Organic Therapy", icon: Leaf, color: "text-emerald-700" },
                  { id: "chemical", label: "Chemical Limits", icon: Flame, color: "text-amber-700" },
                  { id: "cultural", label: "Cultural Farming", icon: Wrench, color: "text-blue-700" }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id as any)}
                      className={`py-3.5 text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                        activeSubTab === tab.id 
                          ? "bg-white border-b-2 border-[#2E7D32] text-[#2E7D32]" 
                          : "text-[#5D6B5F] hover:text-[#1B3022]"
                      }`}
                    >
                      <Icon size={14} className={tab.color} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Protocol Content */}
              <div className="p-6">
                {activeSubTab === "organic" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex gap-2 items-center text-sm font-bold text-emerald-850">
                      <Leaf size={18} className="text-emerald-600" />
                      Organic Management & Biological Solutions
                    </div>
                    <p className="text-xs text-[#5D6B5F] leading-normal">
                      Leverage eco-friendly biological spray cultures and safe botanical extracts to manage pathogen spread without chemical run-offs.
                    </p>
                    <div className="space-y-3 pt-2">
                      {selectedDisease.preventionOrganic.map((org, i) => (
                        <div key={i} className="flex items-start gap-3 bg-emerald-50/20 border border-emerald-100/30 p-3 rounded-xl">
                          <span className="text-emerald-600 font-bold shrink-0">✓</span>
                          <span className="text-sm text-[#5D6B5F] leading-relaxed font-sans">{org}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSubTab === "chemical" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex gap-2 items-center text-sm font-bold text-amber-850">
                      <Flame size={18} className="text-amber-600" />
                      Targeted Chemical Controls & Spray Limits
                    </div>
                    <p className="text-xs text-[#5D6B5F] leading-normal">
                      Use fungicides and target bactericides as a last resort, strictly adhering to spray dosages and regional safety intervals to prevent soil toxicity.
                    </p>
                    <div className="space-y-3 pt-2">
                      {selectedDisease.preventionChemical.map((chem, i) => (
                        <div key={i} className="flex items-start gap-3 bg-amber-50/20 border border-amber-100/30 p-3 rounded-xl">
                          <span className="text-amber-600 font-bold shrink-0">⚠</span>
                          <span className="text-sm text-[#5D6B5F] leading-relaxed font-sans">{chem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSubTab === "cultural" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex gap-2 items-center text-sm font-bold text-blue-850">
                      <Wrench size={18} className="text-blue-600" />
                      Cultural Practices & Soil Health Care
                    </div>
                    <p className="text-xs text-[#5D6B5F] leading-normal">
                      Structural agronomic habits such as crop rotation, strategic field spacing, proper drainage channels, and healthy weeding to break pathogen lifecycle naturally.
                    </p>
                    <div className="space-y-3 pt-2">
                      {selectedDisease.preventionCultural.map((cult, i) => (
                        <div key={i} className="flex items-start gap-3 bg-blue-50/20 border border-blue-100/30 p-3 rounded-xl">
                          <span className="text-blue-600 font-bold shrink-0">⚙</span>
                          <span className="text-sm text-[#5D6B5F] leading-relaxed font-sans">{cult}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center text-[#5D6B5F]">
              Select a disease threat from the left menu to view the full integrated care plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
