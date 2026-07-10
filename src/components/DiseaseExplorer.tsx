import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Sprout, 
  Plus, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  ChevronRight, 
  ExternalLink 
} from "lucide-react";
import { getAllRecords, addRecord } from "../db";
import { Crop, Disease } from "../types";

export default function DiseaseExplorer() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCropFilter, setSelectedCropFilter] = useState("all");
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  
  // Custom disease adding modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDisease, setNewDisease] = useState({
    name: "",
    cropId: "",
    symptoms: "",
    cause: "",
    preventionOrganic: "",
    preventionChemical: "",
    preventionCultural: "",
    reference: ""
  });
  const [addError, setAddError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cropsList = await getAllRecords<Crop>("crops");
      const diseasesList = await getAllRecords<Disease>("diseases");
      setCrops(cropsList);
      setDiseases(diseasesList);
    } catch (err) {
      console.error("Failed to load explorer data", err);
    }
  };

  const handleAddDiseaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");

    if (!newDisease.name || !newDisease.cropId || !newDisease.symptoms || !newDisease.cause) {
      setAddError("Please fill out all required fields (*).");
      return;
    }

    try {
      const cleanOrganic = newDisease.preventionOrganic
        .split("\n")
        .map(p => p.trim())
        .filter(p => p.length > 0);
      const cleanChemical = newDisease.preventionChemical
        .split("\n")
        .map(p => p.trim())
        .filter(p => p.length > 0);
      const cleanCultural = newDisease.preventionCultural
        .split("\n")
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const customId = `d_custom_${Date.now()}`;
      const record: Disease = {
        id: customId,
        cropId: newDisease.cropId,
        name: newDisease.name,
        symptoms: newDisease.symptoms,
        cause: newDisease.cause,
        preventionOrganic: cleanOrganic.length ? cleanOrganic : ["Contact an agronomist for organic controls"],
        preventionChemical: cleanChemical.length ? cleanChemical : ["Integrated pest management advised"],
        preventionCultural: cleanCultural.length ? cleanCultural : ["Follow standard field sanitation"],
        reference: newDisease.reference || "User Submitted"
      };

      await addRecord("diseases", record);
      setShowAddModal(false);
      // Reset form
      setNewDisease({
        name: "",
        cropId: "",
        symptoms: "",
        cause: "",
        preventionOrganic: "",
        preventionChemical: "",
        preventionCultural: "",
        reference: ""
      });
      loadData();
    } catch (err: any) {
      setAddError("Database save failed: " + err.message);
    }
  };

  // Filter diseases based on search and crop dropdown
  const filteredDiseases = diseases.filter((d) => {
    const matchesCrop = selectedCropFilter === "all" || d.cropId === selectedCropFilter;
    
    const cropName = crops.find(c => c.id === d.cropId)?.name || "";
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cropName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCrop && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in" id="explorer_tab">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
            <BookOpen className="text-[#2E7D32]" size={28} />
            Crop Encyclopedia
          </h1>
          <p className="text-[#5D6B5F] font-sans">
            Browse through common diseases, structural symptoms, pathogenic agents, and organic or chemical treatment regimens.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#1B5E20] transition self-start md:self-auto"
        >
          <Plus size={16} />
          Add Disease
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid gap-4 sm:grid-cols-12 bg-white border border-[#E8E5DF] p-4 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5D6B5F]" size={18} />
          <input 
            type="text"
            placeholder="Search catalog by disease, symptoms, cause or host crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] font-sans text-sm"
          />
        </div>
        
        {/* Crop Filter */}
        <div className="sm:col-span-4 relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5D6B5F]" size={16} />
          <select 
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] font-sans text-sm appearance-none bg-white"
          >
            <option value="all">All Host Crops</option>
            {crops.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Diseases List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDiseases.map((d) => {
          const associatedCrop = crops.find(c => c.id === d.cropId);
          return (
            <div 
              key={d.id}
              onClick={() => setSelectedDisease(d)}
              className="group cursor-pointer rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs hover:shadow-md transition hover:border-[#2E7D32] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full">
                    <Sprout size={12} />
                    {associatedCrop?.name || "Crop"}
                  </div>
                  <span className="text-xs text-[#5D6B5F] font-mono italic">
                    {associatedCrop?.scientificName ? `(${associatedCrop.scientificName})` : ""}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#1B3022] group-hover:text-[#2E7D32] leading-snug">
                  {d.name}
                </h3>
                <p className="text-xs text-[#5D6B5F] line-clamp-3 leading-relaxed">
                  {d.symptoms}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E8E5DF] flex items-center justify-between text-xs font-semibold text-[#2E7D32]">
                <span>View pathogen profile</span>
                <ChevronRight size={14} className="transition group-hover:translate-x-0.5" />
              </div>
            </div>
          );
        })}

        {filteredDiseases.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-[#5D6B5F]/80 border border-dashed border-[#E8E5DF] rounded-2xl bg-[#FDFBF7]">
            No disease records found matching those query terms.
          </div>
        )}
      </div>

      {/* Disease Detail Slide-over / Modal */}
      {selectedDisease && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in border border-slate-100">
            <button 
              onClick={() => setSelectedDisease(null)}
              className="absolute top-6 right-6 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>

            {/* Disease Profile Header */}
            <div className="space-y-2 border-b border-[#E8E5DF] pb-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full">
                <Sprout size={12} />
                {crops.find(c => c.id === selectedDisease.cropId)?.name} (Host)
              </div>
              <h2 className="font-display text-2xl font-bold text-[#1B3022]">{selectedDisease.name}</h2>
              <p className="text-xs text-[#5D6B5F] flex items-center gap-1 font-mono">
                <BookOpen size={12} /> Pathogen Reference: {selectedDisease.reference}
              </p>
            </div>

            {/* Detailed Content */}
            <div className="mt-6 space-y-6">
              {/* Pathogen / Cause */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5D6B5F]">Biological Agent / Etiology</h4>
                <p className="text-sm text-[#1B3022] bg-[#FDFBF7] p-3 rounded-xl border border-[#E8E5DF] flex gap-2">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                  <span>{selectedDisease.cause}</span>
                </p>
              </div>

              {/* Symptoms */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5D6B5F]">Diagnostic Symptoms</h4>
                <p className="text-sm text-[#5D6B5F] leading-relaxed">{selectedDisease.symptoms}</p>
              </div>

              {/* Integrated Prevention Guidelines */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5D6B5F]">Prevention & Management Protocols</h4>
                
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Organic */}
                  <div className="border border-[#E8E5DF] rounded-xl p-4 bg-white space-y-2">
                    <div className="text-xs font-bold text-emerald-750 bg-emerald-50 px-2 py-0.5 rounded-sm inline-block">Organic Methods</div>
                    <ul className="space-y-1.5 text-xs text-[#5D6B5F]">
                      {selectedDisease.preventionOrganic.map((p, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-[#2E7D32]">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Chemical */}
                  <div className="border border-[#E8E5DF] rounded-xl p-4 bg-white space-y-2">
                    <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm inline-block">Chemical Controls</div>
                    <ul className="space-y-1.5 text-xs text-[#5D6B5F]">
                      {selectedDisease.preventionChemical.map((p, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-amber-500">⚠</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cultural */}
                  <div className="border border-[#E8E5DF] rounded-xl p-4 bg-white space-y-2">
                    <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm inline-block">Cultural / Agronomic</div>
                    <ul className="space-y-1.5 text-xs text-[#5D6B5F]">
                      {selectedDisease.preventionCultural.map((p, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-blue-500">⚙</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="mt-8 pt-4 border-t border-[#E8E5DF] flex justify-end">
              <button 
                onClick={() => setSelectedDisease(null)}
                className="rounded-xl bg-[#FDFBF7] border border-[#E8E5DF] hover:bg-[#E8E5DF] px-5 py-2.5 text-sm font-semibold text-[#1B3022] transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Disease Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in border border-slate-100">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>

            <div className="space-y-2 border-b border-[#E8E5DF] pb-4">
              <h2 className="font-display text-xl font-bold text-[#1B3022]">Add Disease Record</h2>
              <p className="text-xs text-[#5D6B5F]">Add a custom agronomic pathology report to the local IndexedDB system.</p>
            </div>

            <form onSubmit={handleAddDiseaseSubmit} className="mt-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#5D6B5F] mb-1">Disease Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Septoria Leaf Spot"
                  value={newDisease.name}
                  onChange={(e) => setNewDisease({ ...newDisease, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-sm font-sans"
                />
              </div>

              {/* Host Crop */}
              <div>
                <label className="block text-xs font-bold text-[#5D6B5F] mb-1">Host Crop *</label>
                <select 
                  required
                  value={newDisease.cropId}
                  onChange={(e) => setNewDisease({ ...newDisease, cropId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-sm font-sans bg-white"
                >
                  <option value="">Select Host Crop...</option>
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Pathogen / Cause */}
              <div>
                <label className="block text-xs font-bold text-[#5D6B5F] mb-1">Pathogen / Primary Cause *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Fungus Septoria lycopersici"
                  value={newDisease.cause}
                  onChange={(e) => setNewDisease({ ...newDisease, cause: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-sm font-sans"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-xs font-bold text-[#5D6B5F] mb-1">Diagnostic Symptoms *</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Describe leaf spots, concentric rings, coloration, or stem lesions..."
                  value={newDisease.symptoms}
                  onChange={(e) => setNewDisease({ ...newDisease, symptoms: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-sm font-sans"
                />
              </div>

              {/* Preventions */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-[#5D6B5F] mb-1">Organic Control (one per line)</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Copper fungicide"
                    value={newDisease.preventionOrganic}
                    onChange={(e) => setNewDisease({ ...newDisease, preventionOrganic: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5D6B5F] mb-1">Chemical Options (one per line)</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Chlorothalonil"
                    value={newDisease.preventionChemical}
                    onChange={(e) => setNewDisease({ ...newDisease, preventionChemical: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5D6B5F] mb-1">Cultural Practice (one per line)</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Crop rotation"
                    value={newDisease.preventionCultural}
                    onChange={(e) => setNewDisease({ ...newDisease, preventionCultural: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-xs font-sans"
                  />
                </div>
              </div>

              {/* Citation */}
              <div>
                <label className="block text-xs font-bold text-[#5D6B5F] mb-1">Scientific Reference / Source Citation</label>
                <input 
                  type="text"
                  placeholder="e.g. Local University Research, 2025"
                  value={newDisease.reference}
                  onChange={(e) => setNewDisease({ ...newDisease, reference: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] text-sm font-sans"
                />
              </div>

              {addError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {addError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3 border-t border-[#E8E5DF]">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-[#FDFBF7] border border-[#E8E5DF] hover:bg-[#E8E5DF] px-4 py-2 text-sm font-semibold text-[#1B3022] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] px-4 py-2 text-sm font-semibold text-white transition shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
