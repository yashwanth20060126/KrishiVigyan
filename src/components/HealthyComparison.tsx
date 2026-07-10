import React, { useState } from "react";
import { Sprout, AlertCircle, HelpCircle, Layers, CheckCircle2 } from "lucide-react";

interface LeafAtlasItem {
  cropName: string;
  scientificName: string;
  diseaseName: string;
  healthyDesc: string;
  infectedDesc: string;
  visualHealthyColor: string;
  visualInfectedColor: string;
  spotsHtml: React.ReactNode;
}

export default function HealthyComparison() {
  const [selectedCrop, setSelectedCrop] = useState<string>("all");

  const atlasItems: LeafAtlasItem[] = [
    {
      cropName: "Tomato",
      scientificName: "Solanum lycopersicum",
      diseaseName: "Early Blight",
      healthyDesc: "Lush deep-green divided compound leaflets with distinct ridges. Free of brown patches, lesions, or yellowing margins. Sturdy erect petiole.",
      infectedDesc: "Concentric 'target-board' dark brown rings on lower leaflets first. Surrounded by chlorotic yellow halos. Severely infected leaflets shrivel and drop off prematurely.",
      visualHealthyColor: "from-emerald-500 to-green-600",
      visualInfectedColor: "from-amber-700 via-yellow-600 to-amber-900",
      spotsHtml: (
        <div className="absolute inset-0 flex flex-wrap justify-around items-center p-4">
          <div className="w-12 h-12 rounded-full bg-slate-900/40 border border-slate-900/60 flex items-center justify-center text-[5px] text-yellow-300 font-bold">●</div>
          <div className="w-8 h-8 rounded-full bg-slate-900/30 border border-slate-900/50 translate-x-4 translate-y-2" />
          <div className="w-6 h-6 rounded-full bg-slate-900/50 border border-slate-900/70 -translate-x-3 -translate-y-4" />
        </div>
      )
    },
    {
      cropName: "Potato",
      scientificName: "Solanum tuberosum",
      diseaseName: "Late Blight",
      healthyDesc: "Ovate, medium-to-large light green leaves with fuzzy veins beneath. Smooth texture, uniform color distribution, no dark spotting.",
      infectedDesc: "Large dark-brown water-soaked spots spreading from leaf margins. White mildew fuzz gathers on leaf undersides in humid dew. Stems turn black and rot.",
      visualHealthyColor: "from-green-500 to-emerald-600",
      visualInfectedColor: "from-zinc-800 via-stone-700 to-neutral-900",
      spotsHtml: (
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-1/2 h-10 bg-black/60 rounded-full blur-xs" />
          <div className="absolute bottom-1/4 right-1/4 w-1/3 h-12 bg-stone-900/70 rounded-full blur-xs" />
          <div className="absolute inset-0 border-4 border-dashed border-stone-150/40 animate-pulse" />
        </div>
      )
    },
    {
      cropName: "Rice",
      scientificName: "Oryza sativa",
      diseaseName: "Rice Blast",
      healthyDesc: "Elongated, slender blade-like grass leaves with strong vertical parallel veins. Light-to-dark emerald green, flexible yet erect stalks.",
      infectedDesc: "Spindle-shaped (diamond-like) necrotic spots with greyish-white ash centers and broad dark reddish-brown margins. Leaves buckle and snap under pressure.",
      visualHealthyColor: "from-emerald-400 to-green-500",
      visualInfectedColor: "from-yellow-700 via-amber-800 to-yellow-900",
      spotsHtml: (
        <div className="absolute inset-0 flex flex-col justify-around items-center py-6">
          <div className="w-14 h-4 rounded-full bg-slate-900/60 rotate-12 border border-yellow-600/30" />
          <div className="w-10 h-3 rounded-full bg-slate-800/70 -rotate-12 border border-yellow-600/40" />
        </div>
      )
    },
    {
      cropName: "Cassava",
      scientificName: "Manihot esculenta",
      diseaseName: "Cassava Mosaic Virus",
      healthyDesc: "Hand-shaped (palmate) leaf clusters with 5 to 9 deep lobes branching outward from a central stem. Smooth red-to-green petioles.",
      infectedDesc: "Mottled yellow-and-green mosaic patterns across all lobes. Severe leaf puckering, leaf distortion, curled margins, and highly stunted, deformed growth.",
      visualHealthyColor: "from-emerald-600 to-green-700",
      visualInfectedColor: "from-yellow-400 via-green-500 to-yellow-500",
      spotsHtml: (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.4)_10%,transparent_60%)] flex flex-wrap p-2 justify-between">
          <div className="w-4 h-4 bg-yellow-400/50 rounded-full blur-xs" />
          <div className="w-6 h-6 bg-yellow-300/60 rounded-full blur-xs translate-y-8" />
          <div className="w-5 h-5 bg-yellow-400/40 rounded-full blur-xs translate-x-12" />
        </div>
      )
    }
  ];

  const filteredItems = selectedCrop === "all" 
    ? atlasItems 
    : atlasItems.filter(item => item.cropName.toLowerCase() === selectedCrop.toLowerCase());

  return (
    <div className="space-y-8 animate-fade-in" id="comparison_tab">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
          <Layers className="text-[#2E7D32]" size={28} />
          Healthy vs Diseased Leaf Atlas
        </h1>
        <p className="text-[#5D6B5F]">
          A visual training guide designed to assist in leaf identification. Contrast healthy crops with infected specimen morphologies side-by-side.
        </p>
      </div>

      {/* Select Filter */}
      <div className="flex gap-2 border-b border-[#E8E5DF] pb-1 overflow-x-auto">
        {["all", "tomato", "potato", "rice", "cassava"].map((crop) => (
          <button
            key={crop}
            onClick={() => setSelectedCrop(crop)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition capitalize whitespace-nowrap ${
              selectedCrop === crop 
                ? "border-[#2E7D32] text-[#2E7D32]" 
                : "border-transparent text-[#5D6B5F] hover:text-[#1B3022]"
            }`}
          >
            {crop === "all" ? "All Crops" : crop}
          </button>
        ))}
      </div>

      {/* Comparison Grid */}
      <div className="space-y-12">
        {filteredItems.map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-[#E8E5DF] bg-white overflow-hidden shadow-xs">
            {/* Crop Header */}
            <div className="bg-[#FDFBF7] border-b border-[#E8E5DF] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-[#1B3022] flex items-center gap-2">
                  <Sprout className="text-[#2E7D32]" size={20} />
                  {item.cropName} Leaf Comparative Atlas
                </h3>
                <p className="text-xs text-[#5D6B5F]/80 font-mono italic">{item.scientificName}</p>
              </div>
              <div className="text-xs text-red-600 font-bold bg-red-50 border border-red-100 rounded-lg px-3 py-1 self-start sm:self-auto">
                Pathology Focus: {item.diseaseName}
              </div>
            </div>

            {/* Side by Side Panel */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E8E5DF]">
              {/* Healthy Leaf Section */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-[#2E7D32] font-bold text-sm">
                  <CheckCircle2 size={18} />
                  HEALTHY MORPHOLOGY
                </div>

                {/* Leaf Visualizer (CSS Illustrated) */}
                <div className="h-44 rounded-xl bg-gradient-to-tr from-[#FDFBF7] to-[#E8E5DF]/50 border border-[#E8E5DF] relative flex items-center justify-center overflow-hidden">
                  {/* Styled leaf */}
                  <div className={`w-32 h-20 rounded-full bg-gradient-to-tr ${item.visualHealthyColor} shadow-md relative rotate-45 flex items-center justify-center`}>
                    {/* leaf veins */}
                    <div className="absolute w-28 h-0.5 bg-white/30" />
                    <div className="absolute w-12 h-0.5 bg-white/20 rotate-45 translate-y-3" />
                    <div className="absolute w-12 h-0.5 bg-white/20 -rotate-45 -translate-y-3" />
                  </div>
                </div>

                <p className="text-sm text-[#5D6B5F] leading-relaxed font-sans">
                  {item.healthyDesc}
                </p>
              </div>

              {/* Diseased Leaf Section */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                  <AlertCircle size={18} />
                  INFECTED PATHOLOGY
                </div>

                {/* Leaf Visualizer (CSS Illustrated with Spot Overlay) */}
                <div className="h-44 rounded-xl bg-gradient-to-tr from-[#FDFBF7] to-[#E8E5DF]/50 border border-[#E8E5DF] relative flex items-center justify-center overflow-hidden">
                  <div className={`w-32 h-20 rounded-full bg-gradient-to-tr ${item.visualInfectedColor} shadow-md relative rotate-45 flex items-center justify-center`}>
                    {/* leaf veins */}
                    <div className="absolute w-28 h-0.5 bg-white/10" />
                    {/* Spotted html */}
                    {item.spotsHtml}
                  </div>
                </div>

                <p className="text-sm text-[#5D6B5F] leading-relaxed font-sans">
                  {item.infectedDesc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
