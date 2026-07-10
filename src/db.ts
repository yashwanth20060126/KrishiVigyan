// Database management for KrishiVigyan using IndexedDB
import { Crop, Disease, Prediction, DocumentRecord, QuizRecord } from "./types";

const DB_NAME = "KrishiVigyanDB";
const DB_VERSION = 1;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject(request.error);
    request.onsuccess = (e) => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Create Crop store
      if (!db.objectStoreNames.contains("crops")) {
        db.createObjectStore("crops", { keyPath: "id" });
      }
      
      // Create Disease store
      if (!db.objectStoreNames.contains("diseases")) {
        const diseaseStore = db.createObjectStore("diseases", { keyPath: "id" });
        diseaseStore.createIndex("cropId", "cropId", { unique: false });
      }

      // Create Prediction store
      if (!db.objectStoreNames.contains("predictions")) {
        db.createObjectStore("predictions", { keyPath: "id" });
      }

      // Create Document store
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id" });
      }

      // Create Quiz store
      if (!db.objectStoreNames.contains("quizzes")) {
        db.createObjectStore("quizzes", { keyPath: "id" });
      }
    };
  });
}

// Seed Database with illustrative agricultural knowledge base
export async function seedDatabaseIfEmpty() {
  const db = await openDatabase();
  
  // Check if crops are already seeded
  const existingCrops = await getAllRecords<Crop>("crops");
  if (existingCrops.length > 0) return; // already seeded

  const seedCrops: Crop[] = [
    { id: "tomato", name: "Tomato", scientificName: "Solanum lycopersicum", family: "Solanaceae" },
    { id: "potato", name: "Potato", scientificName: "Solanum tuberosum", family: "Solanaceae" },
    { id: "rice", name: "Rice", scientificName: "Oryza sativa", family: "Poaceae" },
    { id: "cassava", name: "Cassava", scientificName: "Manihot esculenta", family: "Euphorbiaceae" }
  ];

  const seedDiseases: Disease[] = [
    {
      id: "t_early_blight",
      cropId: "tomato",
      name: "Early Blight",
      symptoms: "Circular, dark brown spots with concentric rings resembling a 'target board' appear on older leaves first. Leaves eventually turn yellow and drop off.",
      cause: "Fungal pathogen Alternaria solani, which thrives in warm, wet conditions with heavy dew or rain.",
      preventionOrganic: [
        "Apply organic copper fungicide spray immediately upon spotting symptoms.",
        "Use neem oil or liquid seaweed extract to boost plant disease resistance."
      ],
      preventionChemical: [
        "Apply chlorothalonil, mancozeb, or azoxystrobin fungicides as directed by safety guidelines."
      ],
      preventionCultural: [
        "Rotate crops: do not plant tomatoes, potatoes, or peppers in the same spot for at least 3 years.",
        "Keep foliage dry: use drip irrigation rather than overhead watering.",
        "Prune lower branches of the plant to keep leaves from touching the soil."
      ],
      reference: "USDA Extension Bulletin, Plant Pathology No. 42"
    },
    {
      id: "t_late_blight",
      cropId: "tomato",
      name: "Late Blight",
      symptoms: "Water-soaked dark green-to-black lesions on leaves and stems. In humid conditions, a white, fuzzy fungal-like growth appears on the underside of infected leaves.",
      cause: "Oomycete pathogen Phytophthora infestans. It is highly destructive and spreads rapidly in cool, wet weather.",
      preventionOrganic: [
        "Apply preventive copper hydroxide sprays before humid rainy seasons.",
        "Use Bacillus subtilis biological control sprays to inhibit pathogen spores."
      ],
      preventionChemical: [
        "Apply systemic fungicides like metalaxyl-M or cymoxanil formulated for late blight control."
      ],
      preventionCultural: [
        "Destroy infected plant remains immediately: do not compost infected material.",
        "Select disease-resistant tomato varieties.",
        "Ensure wide planting spacing to encourage rapid leaf drying."
      ],
      reference: "FAO Integrated Pest Management Guidelines for Tomato"
    },
    {
      id: "t_yellow_curl",
      cropId: "tomato",
      name: "Yellow Leaf Curl",
      symptoms: "Severe upward leaf curling, yellowing of leaf margins, abnormally small leaves, and a bushy appearance. Plants become severely stunted and stop setting fruit.",
      cause: "Tomato Yellow Leaf Curl Virus (TYLCV), transmitted exclusively by silverleaf whiteflies (Bemisia tabaci).",
      preventionOrganic: [
        "Spray plants with organic insecticidal soap or horticultural mineral oil to suffocate whiteflies.",
        "Use yellow sticky traps to catch adult whiteflies early."
      ],
      preventionChemical: [
        "Apply systemic insecticides like imidacloprid or dinotefuran to suppress the whitefly vector population."
      ],
      preventionCultural: [
        "Install fine insect-proof mesh row covers over young tomato seedlings.",
        "Grow virus-resistant cultivars.",
        "Remove host weeds around tomato plots to eliminate whitefly breeding grounds."
      ],
      reference: "International Potato Center (CIP) Virus Manual"
    },
    {
      id: "p_late_blight",
      cropId: "potato",
      name: "Potato Late Blight",
      symptoms: "Similar to tomato late blight: dark lesions on leaves, white powdery growth underneath, and rotting tubers with brown, corky tissue beneath the skin.",
      cause: "Phytophthora infestans oomycete pathogen, famous for causing the Irish Potato Famine.",
      preventionOrganic: [
        "Preventive copper fungicide treatments during prolonged periods of cool, wet weather.",
        "Compost extracts and biological sprays to build foliage microflora."
      ],
      preventionChemical: [
        "Prophylactic or systemic fungicide sprays containing cyazofamid or fluazinam."
      ],
      preventionCultural: [
        "Plant certified disease-free seed tubers.",
        "Hill potato plants: keep tubers covered with deep soil to protect them from spores washed from leaves.",
        "Kill vines 2 weeks before harvesting tubers to allow skins to harden."
      ],
      reference: "Cornell University Extension, Potato Pathology Guide"
    },
    {
      id: "p_rhizoctonia",
      cropId: "potato",
      name: "Black Scurf & Stem Canker",
      symptoms: "Black, dirt-like crusts (sclerotia) on tuber surfaces that do not wash off. Reddish-brown sunken lesions (cankers) on underground stems and stolons.",
      cause: "Soil-borne fungus Rhizoctonia solani, which attacks potato sprouts before emergence.",
      preventionOrganic: [
        "Treat seed tubers with biological antagonist Trichoderma harzianum formulation.",
        "Apply mustard green manure cover crops to suppress soil fungus."
      ],
      preventionChemical: [
        "Treat seed potatoes with fludioxonil or pencycuron powder before planting."
      ],
      preventionCultural: [
        "Plant tubers in warm, well-drained soils (above 8°C) to speed up sprout emergence.",
        "Practice long crop rotations (3-5 years) with non-host crops like corn or rye.",
        "Harvest tubers promptly once vine death occurs."
      ],
      reference: "Agronomy Journal, Soil-Borne Pathogens Section"
    },
    {
      id: "r_rice_blast",
      cropId: "rice",
      name: "Rice Blast",
      symptoms: "Spindle-shaped (diamond) lesions on leaves with grey centers and dark reddish-brown borders. Can also attack nodes and neck of grain pans, causing them to break.",
      cause: "Fungus Magnaporthe oryzae. It is one of the most critical rice diseases globally.",
      preventionOrganic: [
        "Apply silicon fertilizer to strengthen leaf cell walls and block fungal penetration.",
        "Spray organic biological fungicidal solutions based on Streptomyces spp."
      ],
      preventionChemical: [
        "Apply systemic fungicides like tricyclazole, edifenphos, or azoxystrobin during critical flowering stages."
      ],
      preventionCultural: [
        "Avoid applying excessive nitrogen fertilizer, which makes leaves soft and susceptible.",
        "Maintain appropriate water levels in fields; drought-stressed rice is more prone to blast.",
        "Use wider seedbed spacing to prevent overcrowded seedlings."
      ],
      reference: "IRRI (International Rice Research Institute) Rice Doctor"
    },
    {
      id: "r_bacterial_blight",
      cropId: "rice",
      name: "Bacterial Leaf Blight",
      symptoms: "Water-soaked stripes starting from the leaf tips or margins, which turn yellow and then wavy greyish-white. Milky droplets of bacterial ooze may form on active leaves under humid mornings.",
      cause: "Bacterium Xanthomonas oryzae pv. oryzae, which enters through natural openings or wounds.",
      preventionOrganic: [
        "Spray with neem seed kernel extract or wild garlic solution to inhibit bacterial growth.",
        "Encourage biological control with antagonistic Pseudomonas fluorescens strains."
      ],
      preventionChemical: [
        "Apply bactericides containing copper hydroxide + streptomycin-oxytetracycline mixture if severe."
      ],
      preventionCultural: [
        "Use balanced crop nutrition with appropriate potassium doses, which builds defense.",
        "Keep fields drained: stagnant water and flooding propagate the bacteria rapidly.",
        "Ensure clean tools: sanitize harvesting equipment to avoid spreading bacteria field-to-field."
      ],
      reference: "IRRI Technical Bulletin Series, BLB Management"
    },
    {
      id: "c_mosaic",
      cropId: "cassava",
      name: "Cassava Mosaic Disease",
      symptoms: "Pronounced mosaic yellow-green patches on leaves, severe leaflet reduction, leaf curling and crinkling. Roots fail to accumulate starch, resulting in minimal yield.",
      cause: "Cassava Mosaic Geminivirus, spread by whitefly Bemisia tabaci and contaminated stem cuttings used for planting.",
      preventionOrganic: [
        "Use whitefly-repellent intercropping crops (e.g. coriander, mustard, lemongrass).",
        "Spray neem seed extracts to manage young whitefly larvae."
      ],
      preventionChemical: [
        "No chemical cure exists for viruses. Vector control is possible with pyrethroids."
      ],
      preventionCultural: [
        "Plant resistant or highly tolerant cassava varieties (like TMS series).",
        "Rigorous roguing: promptly pull out and burn any cassava plant showing mosaic symptoms in the first 2 months.",
        "Use only certified virus-free stem cuttings from verified healthy mother plants."
      ],
      reference: "IITA (International Institute of Tropical Agriculture) Cassava Guide"
    }
  ];

  // Batch insert
  const tx = db.transaction(["crops", "diseases"], "readwrite");
  const cropStore = tx.objectStore("crops");
  const diseaseStore = tx.objectStore("diseases");

  for (const crop of seedCrops) {
    cropStore.put(crop);
  }
  for (const disease of seedDiseases) {
    diseaseStore.put(disease);
  }

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// General IndexedDB Utilities
export async function getAllRecords<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addRecord<T>(storeName: string, record: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(storeName: string, id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getRecordById<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Import-Export Utility
export interface DatabaseExportData {
  crops: Crop[];
  diseases: Disease[];
  predictions: Prediction[];
  documents: DocumentRecord[];
  quizzes: QuizRecord[];
}

export async function exportDatabaseToJSONString(): Promise<string> {
  const crops = await getAllRecords<Crop>("crops");
  const diseases = await getAllRecords<Disease>("diseases");
  const predictions = await getAllRecords<Prediction>("predictions");
  const documents = await getAllRecords<DocumentRecord>("documents");
  const quizzes = await getAllRecords<QuizRecord>("quizzes");

  const exportData: DatabaseExportData = {
    crops,
    diseases,
    predictions,
    documents,
    quizzes
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importDatabaseFromJSON(jsonString: string): Promise<void> {
  try {
    const importData = JSON.parse(jsonString) as DatabaseExportData;
    const db = await openDatabase();

    const stores: Array<keyof DatabaseExportData> = ["crops", "diseases", "predictions", "documents", "quizzes"];
    const tx = db.transaction(stores, "readwrite");

    for (const storeName of stores) {
      const store = tx.objectStore(storeName);
      store.clear(); // Clear existing
      
      const records = importData[storeName];
      if (Array.isArray(records)) {
        for (const rec of records) {
          store.put(rec);
        }
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err: any) {
    throw new Error("Invalid backup JSON format: " + err.message);
  }
}

// Convert Prediction array to CSV string
export function convertPredictionsToCSV(predictions: Prediction[]): string {
  if (predictions.length === 0) {
    return "id,date,crop,disease,confidence,reasoning\n";
  }

  const headers = ["id", "date", "crop", "disease", "confidence", "reasoning"];
  const csvRows = [headers.join(",")];

  for (const pred of predictions) {
    // Escape quotes and commas in fields
    const escapedReasoning = `"${(pred.reasoning || "").replace(/"/g, '""')}"`;
    const escapedCrop = `"${(pred.crop || "").replace(/"/g, '""')}"`;
    const escapedDisease = `"${(pred.disease || "").replace(/"/g, '""')}"`;
    
    const row = [
      pred.id,
      pred.date,
      escapedCrop,
      escapedDisease,
      pred.confidence,
      escapedReasoning
    ];
    csvRows.push(row.join(","));
  }

  return csvRows.join("\n");
}
