import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Sparkles, 
  RefreshCw, 
  Award, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  HelpCircle,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { addRecord, getAllRecords } from "../db";
import { QuizRecord, QuizQuestion } from "../types";

export default function QuizGenerator() {
  const [topic, setTopic] = useState("Tomato Pathology");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [idx: number]: string }>({});
  const [submitted, setSubmitted] = useState<{ [idx: number]: boolean }>({});
  const [fillInput, setFillInput] = useState("");
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const records = await getAllRecords<QuizRecord>("quizzes");
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setQuizHistory(records);
    } catch (err) {
      console.error("Failed to load quiz stats", err);
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setSubmitted({});
    setFillInput("");
    setQuizFinished(false);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Api-Key": localStorage.getItem("gemini_api_key") || ""
        },
        body: JSON.stringify({ topic })
      });

      if (!response.ok) {
        let errMsg = "Failed to generate quiz from server";
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
        throw new Error("Invalid response format received from quiz service.");
      }
      setQuestions(data.questions || []);
    } catch (err: any) {
      console.error(err);
      alert("Error generating quiz: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = () => {
    if (submitted[currentIdx]) return;

    let ans = "";
    if (questions[currentIdx].type === "fill-in") {
      ans = fillInput.trim();
    } else {
      ans = answers[currentIdx] || "";
    }

    if (!ans) {
      alert("Please select or enter an answer first!");
      return;
    }

    setAnswers(prev => ({ ...prev, [currentIdx]: ans }));
    setSubmitted(prev => ({ ...prev, [currentIdx]: true }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setFillInput("");
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setQuizFinished(true);

    // Calculate score
    let correct = 0;
    questions.forEach((q, idx) => {
      const uAns = answers[idx] || "";
      const isCorrect = uAns.toLowerCase().replace(/\s+/g, "") === q.answer.toLowerCase().replace(/\s+/g, "");
      if (isCorrect) correct++;
    });

    const scorePct = Math.round((correct / questions.length) * 100);

    // Save record
    const record: QuizRecord = {
      id: "quiz_" + Date.now(),
      topic: topic,
      score: scorePct,
      totalQuestions: questions.length,
      correctAnswers: correct,
      date: new Date().toISOString()
    };

    try {
      await addRecord("quizzes", record);
      loadHistory();
    } catch (err) {
      console.error("Failed to save score", err);
    }
  };

  const currentQuestion = questions[currentIdx];
  const isCorrect = currentQuestion && submitted[currentIdx] && (
    (answers[currentIdx] || "").toLowerCase().replace(/\s+/g, "") === 
    currentQuestion.answer.toLowerCase().replace(/\s+/g, "")
  );

  return (
    <div className="space-y-8 animate-fade-in" id="quiz_tab">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
          <GraduationCap className="text-[#2E7D32]" size={28} />
          Extension Quiz Classroom
        </h1>
        <p className="text-[#5D6B5F] font-sans">
          Test your agronomic knowledge. Generate multi-format interactive quizzes powered by Gemini and track your local leaderboard performance.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Quiz panel */}
        <div className="lg:col-span-8">
          {questions.length === 0 && !loading && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center space-y-6 shadow-xs">
              <Award className="mx-auto text-[#C2C9C3]" size={48} />
              <div className="space-y-2">
                <h3 className="font-display text-lg font-bold text-[#1B3022]">Ready to Challenge Your Mind?</h3>
                <p className="text-sm text-[#5D6B5F] max-w-sm mx-auto">
                  Select an agricultural field topic below and allow Gemini to build a custom 5-question test with scientific explanations.
                </p>
              </div>

              {/* Topic Selector */}
              <div className="max-w-md mx-auto flex gap-2">
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] text-sm font-sans bg-white font-semibold text-[#1B3022]"
                >
                  <option value="Tomato Pathology">Tomato Blights & Pathogens</option>
                  <option value="Potato Rhizoctonia">Potato Diseases & Soil Health</option>
                  <option value="Rice Blast & Nitrogen Management">Rice Blast & Nutrition</option>
                  <option value="Integrated Pest Management (IPM)">IPM Practices & Vector Controls</option>
                  <option value="Soil Biology & Organic Composts">Soil Biology & Fertilization</option>
                </select>
                <button 
                  onClick={startQuiz}
                  className="rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm px-5 py-2.5 shadow-sm transition flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  Start Quiz
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-12 text-center space-y-4">
              <RefreshCw className="animate-spin text-[#2E7D32] mx-auto" size={32} />
              <div className="text-sm font-semibold text-[#5D6B5F]">
                Gemini generating bespoke multi-format questions...
              </div>
            </div>
          )}

          {/* Quiz Active View */}
          {questions.length > 0 && !quizFinished && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-6">
              {/* Question progress */}
              <div className="flex justify-between items-center border-b border-[#E8E5DF] pb-3">
                <span className="text-xs font-bold text-[#5D6B5F]/85 uppercase font-mono">
                  Question {currentIdx + 1} of {questions.length} — {topic}
                </span>
                <span className="text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-sm capitalize">
                  Type: {currentQuestion.type === "mcq" ? "Multiple Choice" : currentQuestion.type === "true-false" ? "True / False" : "Fill-in"}
                </span>
              </div>

              {/* Question text */}
              <h3 className="font-display text-lg font-bold text-[#1B3022] leading-normal">
                {currentQuestion.question}
              </h3>

              {/* Question answers layout */}
              <div className="space-y-3 pt-2">
                {currentQuestion.type === "mcq" && currentQuestion.options && (
                  <div className="grid gap-3">
                    {currentQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={submitted[currentIdx]}
                        onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: opt }))}
                        className={`w-full text-left p-4 rounded-xl border font-sans text-sm font-medium transition flex items-center justify-between ${
                          answers[currentIdx] === opt
                            ? "border-[#2E7D32] bg-[#E8F5E9]/20 text-[#2E7D32] font-semibold"
                            : "border-[#E8E5DF] hover:border-[#2E7D32] bg-white text-[#5D6B5F]"
                        }`}
                      >
                        <span>{opt}</span>
                        {answers[currentIdx] === opt && <span className="text-[#2E7D32] font-bold">●</span>}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === "true-false" && (
                  <div className="grid grid-cols-2 gap-4">
                    {["True", "False"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        disabled={submitted[currentIdx]}
                        onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: opt }))}
                        className={`p-4 rounded-xl border text-center font-sans text-sm font-bold transition ${
                          answers[currentIdx] === opt
                            ? "border-[#2E7D32] bg-[#E8F5E9]/20 text-[#2E7D32]"
                            : "border-[#E8E5DF] hover:border-[#2E7D32] bg-white text-[#5D6B5F]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === "fill-in" && (
                  <div>
                    <input 
                      type="text"
                      disabled={submitted[currentIdx]}
                      placeholder="Type your precise word answer here..."
                      value={fillInput}
                      onChange={(e) => setFillInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#2E7D32] text-sm font-sans"
                    />
                  </div>
                )}
              </div>

              {/* Actions submit/next */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E5DF]">
                {!submitted[currentIdx] ? (
                  <button
                    onClick={submitAnswer}
                    className="rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm px-6 py-2.5 shadow-sm transition"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="rounded-xl bg-[#1B3022] hover:bg-black text-white font-semibold text-sm px-6 py-2.5 transition flex items-center gap-1"
                  >
                    {currentIdx < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>

              {/* Instant explanations and response */}
              {submitted[currentIdx] && (
                <div className={`rounded-xl p-4 border animate-fade-in space-y-2 ${
                  isCorrect 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : "bg-red-50 border-red-100 text-red-800"
                }`}>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    {isCorrect ? (
                      <CheckCircle size={18} className="text-emerald-600" />
                    ) : (
                      <XCircle size={18} className="text-red-600" />
                    )}
                    {isCorrect ? "Correct Scientific Takeaway!" : "Incorrect Answer"}
                  </div>
                  
                  {!isCorrect && (
                    <div className="text-xs font-semibold">
                      Correct Answer: <span className="font-mono font-bold bg-white px-2 py-0.5 border border-red-200 rounded-sm">{currentQuestion.answer}</span>
                    </div>
                  )}

                  <p className="text-xs text-[#5D6B5F] leading-relaxed pt-1 border-t border-slate-200/50">
                    <span className="font-bold block text-[#1B3022]">Agronomic Explanation:</span>
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quiz Score Summary card */}
          {quizFinished && questions.length > 0 && (
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs text-center space-y-6">
              <Award className="mx-auto text-amber-500 animate-bounce" size={54} />
              
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold text-[#1B3022]">Quiz Complete!</h3>
                <p className="text-xs text-[#5D6B5F]/80 uppercase font-mono">{topic}</p>
              </div>

              {/* Score metrics */}
              <div className="max-w-xs mx-auto grid grid-cols-2 gap-4 bg-[#FDFBF7] p-4 rounded-xl border border-[#E8E5DF]">
                <div>
                  <div className="text-2xl font-bold text-[#1B3022] font-mono">
                    {questions.filter((q, idx) => {
                      const uAns = answers[idx] || "";
                      return uAns.toLowerCase().replace(/\s+/g, "") === q.answer.toLowerCase().replace(/\s+/g, "");
                    }).length} / {questions.length}
                  </div>
                  <div className="text-[10px] font-bold text-[#5D6B5F]/85">CORRECT RESPONSES</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#2E7D32] font-mono">
                    {Math.round((questions.filter((q, idx) => {
                      const uAns = answers[idx] || "";
                      return uAns.toLowerCase().replace(/\s+/g, "") === q.answer.toLowerCase().replace(/\s+/g, "");
                    }).length / questions.length) * 100)}%
                  </div>
                  <div className="text-[10px] font-bold text-[#5D6B5F]/85">PERFORMANCE SCORE</div>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button 
                  onClick={() => setQuestions([])}
                  className="rounded-xl border border-[#E8E5DF] px-5 py-2.5 text-sm font-semibold text-[#5D6B5F] hover:bg-[#FDFBF7] transition"
                >
                  Exit Classroom
                </button>
                <button 
                  onClick={startQuiz}
                  className="rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition"
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History leaderboard */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-4">
            <h2 className="font-display text-base font-bold text-[#1B3022]">Local Leaderboard</h2>
            <p className="text-xs text-[#5D6B5F]">A historical ledger of your classroom achievements saved in IndexedDB.</p>
            
            <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
              {quizHistory.map((item) => (
                <div key={item.id} className="border-b border-[#E8E5DF]/50 pb-2.5 last:border-0 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-[#1B3022] truncate">{item.topic}</div>
                    <div className="text-[9px] text-[#5D6B5F]/80 font-mono mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`font-mono font-bold px-2 py-0.5 rounded-sm ${
                    item.score >= 80 ? "text-[#2E7D32] bg-[#E8F5E9]" : item.score >= 60 ? "text-amber-700 bg-amber-50" : "text-[#5D6B5F] bg-[#FDFBF7]"
                  }`}>
                    {item.score}%
                  </div>
                </div>
              ))}

              {quizHistory.length === 0 && (
                <div className="text-center py-8 text-[#5D6B5F] border border-dashed border-[#E8E5DF] rounded-xl">
                  No quizzes logged yet. Complete a quiz to log your score.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
