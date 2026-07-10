// Client-side PDF text extraction and chunking utility using CDN PDF.js

export interface PdfChunk {
  text: string;
  pageNumber: number;
}

export async function loadPdfJs(): Promise<any> {
  const win = window as any;
  if (win.pdfjsLib) {
    return win.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = win.pdfjsLib;
      // Configure CDN worker path
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => {
      reject(new Error("Failed to load PDF.js library from secure CDN. Please check your internet connection."));
    };
    document.head.appendChild(script);
  });
}

export async function extractTextFromPdf(file: File): Promise<{ text: string; chunks: string[] }> {
  const pdfjsLib = await loadPdfJs();
  const fileReader = new FileReader();

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
    fileReader.onerror = () => reject(new Error("Failed to read file buffer"));
    fileReader.readAsArrayBuffer(file);
  });

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  const pageChunks: PdfChunk[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    
    fullText += `[Page ${i}]\n${pageText}\n\n`;
    
    if (pageText.trim()) {
      pageChunks.push({
        text: pageText.trim(),
        pageNumber: i
      });
    }
  }

  // Generate chunks with word-based sliding window (approx 200 words per chunk, 50 words overlap)
  const allText = pageChunks.map(c => `[Page ${c.pageNumber}] ${c.text}`).join("\n\n");
  const words = allText.split(/\s+/);
  const chunks: string[] = [];
  
  const chunkSize = 200;
  const overlap = 50;

  if (words.length <= chunkSize) {
    if (allText.trim()) {
      chunks.push(allText.trim());
    }
  } else {
    let index = 0;
    while (index < words.length) {
      const chunkWords = words.slice(index, index + chunkSize);
      if (chunkWords.length > 0) {
        chunks.push(chunkWords.join(" "));
      }
      index += (chunkSize - overlap);
    }
  }

  return {
    text: fullText,
    chunks: chunks.filter(c => c.trim().length > 10)
  };
}

/**
 * Searches the list of chunks for the most relevant ones matching a query.
 * Uses a simple keyword density TF-IDF overlap model as a secure, fast, 
 * zero-cost client-side semantic pre-filter before feeding context to Gemini.
 */
export function retrieveRelevantChunks(chunks: string[], query: string, maxResults = 4): string[] {
  if (!query || chunks.length === 0) return [];

  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  if (queryWords.length === 0) {
    // Return first few chunks if query is empty or too short
    return chunks.slice(0, maxResults);
  }

  const scoredChunks = chunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    
    for (const word of queryWords) {
      // Basic term occurrence counting
      const regex = new RegExp(`\\b${word}\\b`, "g");
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length * 1.5; // full match weight
      } else if (chunkLower.includes(word)) {
        score += 0.5; // partial match weight
      }
    }

    return { chunk, score };
  });

  // Sort by score and filter out zero scores unless we have too few results
  const sorted = scoredChunks
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.chunk);

  if (sorted.length === 0) {
    return chunks.slice(0, maxResults);
  }

  return sorted.slice(0, maxResults);
}
