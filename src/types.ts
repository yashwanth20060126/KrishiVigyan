// Centralized TypeScript definitions for KrishiVigyan

export interface Crop {
  id: string;
  name: string;
  scientificName: string;
  family: string;
}

export interface Disease {
  id: string;
  cropId: string;
  name: string;
  symptoms: string;
  cause: string;
  preventionOrganic: string[];
  preventionChemical: string[];
  preventionCultural: string[];
  reference: string;
}

export interface Prediction {
  id: string;
  crop: string;
  disease: string;
  confidence: number;
  imageThumbnail: string; // base64 thumbnail string
  reasoning: string;
  date: string;
}

export interface QuizRecord {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  date: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[]; // chunk snippets used to answer this message
}

export interface QuizQuestion {
  type: "mcq" | "true-false" | "fill-in";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface WeatherParams {
  temp: number; // 10 to 45 °C
  humidity: number; // 20 to 100 %
  rainfall: number; // 0 to 400 mm
}

export interface SimulatedRisk {
  score: number; // 0 - 100
  level: "Low" | "Medium" | "High" | "Critical";
  color: string;
}
