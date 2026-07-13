import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Terminal, 
  Code, 
  ChevronRight, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  Info, 
  FileText,
  TrendingDown,
  Activity,
  Download,
  Flame
} from "lucide-react";

interface TrainStep {
  epoch: number;
  weight: number;
  bias: number;
  yPred: number;
  loss: number;
}

export default function PyTorchSandbox() {
  // Simulator States
  const [xVal, setXVal] = useState<number>(2.0);
  const [targetY, setTargetY] = useState<number>(5.0);
  const [lr, setLr] = useState<number>(0.1);
  
  // Tensor Values
  const [weight, setWeight] = useState<number>(0.5);
  const [bias, setBias] = useState<number>(0.0);
  
  // Computational State
  const [yPred, setYPred] = useState<number>(1.0); // 0.5 * 2.0 + 0 = 1.0
  const [loss, setLoss] = useState<number>(16.0); // (1.0 - 5.0)^2 = 16.0
  
  // Gradients
  const [gradYPred, setGradYPred] = useState<number | null>(null);
  const [gradWeight, setGradWeight] = useState<number | null>(null);
  const [gradBias, setGradBias] = useState<number | null>(null);
  
  // Step workflow status
  const [currentPhase, setCurrentPhase] = useState<"forward" | "backward" | "step">("forward");
  const [trainHistory, setTrainHistory] = useState<TrainStep[]>([]);
  const [isAutoTraining, setIsAutoTraining] = useState<boolean>(false);
  
  // Code Tabs
  const [activeCodeTab, setActiveCodeTab] = useState<"model" | "lora">("model");

  // Recalculate Forward Pass on inputs change
  useEffect(() => {
    resetWeightsAndStats();
  }, [xVal, targetY]);

  const resetWeightsAndStats = () => {
    const initialW = 0.5;
    const initialB = 0.0;
    const initialYPred = initialW * xVal + initialB;
    const initialLoss = Math.pow(initialYPred - targetY, 2);
    
    setWeight(initialW);
    setBias(initialB);
    setYPred(initialYPred);
    setLoss(initialLoss);
    
    setGradYPred(null);
    setGradWeight(null);
    setGradBias(null);
    setCurrentPhase("forward");
    setTrainHistory([{
      epoch: 0,
      weight: initialW,
      bias: initialB,
      yPred: initialYPred,
      loss: initialLoss
    }]);
  };

  // 1. FORWARD PASS
  const runForward = () => {
    const pred = weight * xVal + bias;
    const computedLoss = Math.pow(pred - targetY, 2);
    
    setYPred(pred);
    setLoss(computedLoss);
    setCurrentPhase("backward");
  };

  // 2. BACKWARD PASS (Autograd)
  const runBackward = () => {
    // Loss = (y_pred - target)^2
    // dLoss/dy_pred = 2 * (y_pred - target)
    const dyPred = 2 * (yPred - targetY);
    // y_pred = w*x + b
    // dy_pred/dw = x
    // dy_pred/db = 1
    const dW = dyPred * xVal;
    const dB = dyPred * 1.0;

    setGradYPred(dyPred);
    setGradWeight(dW);
    setGradBias(dB);
    setCurrentPhase("step");
  };

  // 3. OPTIMIZER STEP (SGD Update)
  const runStep = () => {
    if (gradWeight === null || gradBias === null) return;
    
    // Update weights: w = w - lr * dW
    const newW = weight - lr * gradWeight;
    const newB = bias - lr * gradBias;

    setWeight(newW);
    setBias(newB);

    // Compute new prediction & loss for tracking
    const newYPred = newW * xVal + newB;
    const newLoss = Math.pow(newYPred - targetY, 2);

    const nextStepNum = trainHistory.length;
    setTrainHistory(prev => [
      ...prev,
      {
        epoch: nextStepNum,
        weight: newW,
        bias: newB,
        yPred: newYPred,
        loss: newLoss
      }
    ]);

    // Reset for next forward pass
    setYPred(newYPred);
    setLoss(newLoss);
    setGradYPred(null);
    setGradWeight(null);
    setGradBias(null);
    setCurrentPhase("forward");
  };

  // Auto Train (Run multiple full epochs instantly)
  const runAutoTrain = () => {
    setIsAutoTraining(true);
    let currentW = weight;
    let currentB = bias;
    let historyCopy = [...trainHistory];
    
    for (let epoch = 1; epoch <= 40; epoch++) {
      // Forward
      const pred = currentW * xVal + currentB;
      const computedLoss = Math.pow(pred - targetY, 2);
      
      // Backward
      const dyPred = 2 * (pred - targetY);
      const dW = dyPred * xVal;
      const dB = dyPred * 1.0;
      
      // Step
      currentW = currentW - lr * dW;
      currentB = currentB - lr * dB;
      
      const newPred = currentW * xVal + currentB;
      const newLoss = Math.pow(newPred - targetY, 2);
      
      historyCopy.push({
        epoch: historyCopy.length,
        weight: currentW,
        bias: currentB,
        yPred: newPred,
        loss: newLoss
      });
    }

    setWeight(currentW);
    setBias(currentB);
    setYPred(currentW * xVal + currentB);
    setLoss(Math.pow((currentW * xVal + currentB) - targetY, 2));
    setGradYPred(null);
    setGradWeight(null);
    setGradBias(null);
    setTrainHistory(historyCopy);
    setCurrentPhase("forward");
    setIsAutoTraining(false);
  };

  // Code scripts content
  const cnnCodeStr = `import torch
import torch.nn as nn
import torch.nn.functional as F

class LeafPathologyCNN(nn.Module):
    """
    KrishiVigyan Crop Pathology Leaf Symptom Classification Network.
    Optimized for NVIDIA H200 accelerators.
    """
    def __init__(self, num_classes=4):
        super(LeafPathologyCNN, self).__init__()
        # Block 1: Input size (3 x 224 x 224)
        self.conv1 = nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        
        # Block 2: Size (32 x 112 x 112)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        
        # Block 3: Size (64 x 56 x 56)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        self.dropout = nn.Dropout(p=0.4)
        self.fc1 = nn.Linear(128 * 28 * 28, 256)
        self.fc2 = nn.Linear(256, num_classes)
        
    def forward(self, x):
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        x = x.view(-1, 128 * 28 * 28)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        return self.fc2(x)`;

  const loraCodeStr = `import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, TaskType

# Define Low-Rank Adaptation (LoRA) Config for Agronomy LLM fine-tuning
lora_config = LoraConfig(
    r=16,                      # Rank parameter
    lora_alpha=32,             # Scaling factor for weights
    target_modules=["q_proj", "v_proj"], # Target attention queries and values
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM
)

# Load LLM with FP16/BF16 on high-performance memory
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B-Instruct",
    torch_dtype=torch.bfloat16,
    attn_implementation="flash_attention_2"
)

# Attach adapters to make parameters trainable from scratch
peft_model = get_peft_model(model, lora_config)
peft_model.print_trainable_parameters()`;

  return (
    <div className="space-y-8 animate-fade-in" id="pytorch_sandbox_tab">
      {/* Title Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3022] flex items-center gap-2">
          <Cpu className="text-[#2E7D32]" size={28} />
          PyTorch Core & Lab Basics
        </h1>
        <p className="text-[#5D6B5F] font-sans">
          Study the inner mechanics of PyTorch tensors, automatic gradient backpropagation (autograd), and low-rank parameter fine-tuning.
        </p>
      </div>

      {/* Grid: Simulator & Code base */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* Left Side: Interactive Autograd Tensor Graph */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-[#E8E5DF] pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#2E7D32]" />
                <span className="text-sm font-bold text-[#1B3022]">Live Autograd Node Solver</span>
              </div>
              <div className="text-[10px] font-mono font-bold bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded">
                SIMULATED PYTORCH TENSOR ENGINE
              </div>
            </div>

            {/* Inputs controls */}
            <div className="grid grid-cols-3 gap-4 bg-[#FDFBF7] p-4 rounded-xl border border-[#E8E5DF]">
              <div>
                <label className="block text-[10px] font-bold text-[#5D6B5F] uppercase mb-1">Input (x)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={xVal}
                  onChange={(e) => setXVal(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-white px-3 py-1.5 rounded-lg border border-[#E8E5DF] text-xs font-semibold focus:outline-none focus:border-[#2E7D32] font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#5D6B5F] uppercase mb-1">Target (y)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={targetY}
                  onChange={(e) => setTargetY(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-white px-3 py-1.5 rounded-lg border border-[#E8E5DF] text-xs font-semibold focus:outline-none focus:border-[#2E7D32] font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#5D6B5F] uppercase mb-1">Learning Rate (η)</label>
                <select
                  value={lr}
                  onChange={(e) => setLr(parseFloat(e.target.value))}
                  className="w-full bg-white px-3 py-1.5 rounded-lg border border-[#E8E5DF] text-xs font-semibold focus:outline-none focus:border-[#2E7D32] font-mono"
                >
                  <option value={0.01}>0.01</option>
                  <option value={0.05}>0.05</option>
                  <option value={0.1}>0.1 (Optimal)</option>
                  <option value={0.3}>0.3 (Aggressive)</option>
                </select>
              </div>
            </div>

            {/* Visual Computational Graph */}
            <div className="border border-dashed border-[#E8E5DF] rounded-xl p-6 bg-[#FDFBF7]/40 space-y-6 relative overflow-hidden">
              <h4 className="text-center text-xs font-bold text-[#1B3022] uppercase tracking-wider font-mono">
                Tensor Computational Graph: y_hat = w*x + b
              </h4>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-6 text-center">
                
                {/* Inputs Box */}
                <div className="bg-white border border-[#E8E5DF] rounded-lg p-3 w-32 shadow-2xs">
                  <div className="text-[10px] font-bold text-[#5D6B5F]/80">INPUT TENSOR</div>
                  <div className="text-base font-mono font-bold text-slate-800">x = {xVal.toFixed(2)}</div>
                  <div className="text-[9px] text-[#5D6B5F] font-mono mt-1">requires_grad=False</div>
                </div>

                <div className="text-slate-400 font-bold">✕</div>

                {/* Weights Node */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 w-36 shadow-2xs relative">
                  <div className="text-[10px] font-bold text-[#2E7D32]">WEIGHT (w)</div>
                  <div className="text-base font-mono font-bold text-[#1B3022]">{weight.toFixed(4)}</div>
                  {gradWeight !== null ? (
                    <div className="text-[10px] text-red-600 font-mono mt-1 font-bold animate-pulse">
                      dw = {gradWeight.toFixed(4)}
                    </div>
                  ) : (
                    <div className="text-[9px] text-[#5D6B5F] font-mono mt-1">grad=None</div>
                  )}
                </div>

                <div className="text-slate-400 font-bold">＋</div>

                {/* Bias Node */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 w-36 shadow-2xs relative">
                  <div className="text-[10px] font-bold text-[#2E7D32]">BIAS (b)</div>
                  <div className="text-base font-mono font-bold text-[#1B3022]">{bias.toFixed(4)}</div>
                  {gradBias !== null ? (
                    <div className="text-[10px] text-red-600 font-mono mt-1 font-bold animate-pulse">
                      db = {gradBias.toFixed(4)}
                    </div>
                  ) : (
                    <div className="text-[9px] text-[#5D6B5F] font-mono mt-1">grad=None</div>
                  )}
                </div>

                <div className="text-slate-400 font-bold">➔</div>

                {/* Output (y_hat) */}
                <div className="bg-white border-2 border-[#2E7D32] rounded-lg p-3 w-36 shadow-xs">
                  <div className="text-[10px] font-bold text-[#2E7D32]">PREDICTION (y_hat)</div>
                  <div className="text-base font-mono font-bold text-[#1B3022]">{yPred.toFixed(4)}</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">Target: {targetY.toFixed(2)}</div>
                </div>

              </div>

              {/* Loss Box */}
              <div className="max-w-xs mx-auto bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Mean Squared Error Loss</div>
                <div className="text-2xl font-mono font-bold text-[#1B3022] my-1">
                  L = {loss.toFixed(6)}
                </div>
                <div className="text-[10px] text-[#5D6B5F] font-sans">Formula: (y_hat - target_y)²</div>
              </div>
            </div>

            {/* Step-by-Step interactive pipeline buttons */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2.5 justify-center">
                <button 
                  onClick={runForward}
                  disabled={currentPhase !== "forward"}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition ${
                    currentPhase === "forward" 
                      ? "bg-[#2E7D32] text-white hover:bg-[#1B5E20]" 
                      : "bg-[#E8E5DF] text-[#C2C9C3] cursor-not-allowed"
                  }`}
                >
                  <Play size={14} />
                  1. forward() pass
                </button>

                <button 
                  onClick={runBackward}
                  disabled={currentPhase !== "backward"}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition ${
                    currentPhase === "backward" 
                      ? "bg-red-600 text-white hover:bg-red-700" 
                      : "bg-[#E8E5DF] text-[#C2C9C3] cursor-not-allowed"
                  }`}
                >
                  <TrendingDown size={14} />
                  2. backward() gradients
                </button>

                <button 
                  onClick={runStep}
                  disabled={currentPhase !== "step"}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition ${
                    currentPhase === "step" 
                      ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                      : "bg-[#E8E5DF] text-[#C2C9C3] cursor-not-allowed"
                  }`}
                >
                  <RefreshCw size={14} />
                  3. optimizer.step() update
                </button>

                <button 
                  onClick={runAutoTrain}
                  disabled={isAutoTraining}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-800 px-4 py-2.5 text-xs font-bold shadow-xs transition"
                >
                  <Flame size={14} className="text-amber-600" />
                  Auto-Train 40 Epochs
                </button>

                <button 
                  onClick={resetWeightsAndStats}
                  className="flex items-center gap-1 rounded-xl border border-[#E8E5DF] text-[#5D6B5F] hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold transition"
                >
                  Reset Weights
                </button>
              </div>

              {/* Phase helper message */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
                <Info size={16} className="text-slate-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold text-[#1B3022]">
                    {currentPhase === "forward" && "👉 Step 1: Run the forward pass to compute current prediction (y_hat) and calculate the error."}
                    {currentPhase === "backward" && "👉 Step 2: Trigger backpropagation (autograd) to compute the loss gradients relative to parameters."}
                    {currentPhase === "step" && "👉 Step 3: Use Stochastic Gradient Descent (SGD) to shift weights opposite of gradient flow."}
                  </span>
                  <p className="text-[#5D6B5F] leading-normal font-sans">
                    Notice how the loss decreases incrementally. In PyTorch, <code>optimizer.zero_grad()</code> clears stale gradients before the next iteration.
                  </p>
                </div>
              </div>
            </div>

            {/* Convergence Training Logs */}
            {trainHistory.length > 1 && (
              <div className="space-y-3">
                <div className="font-bold text-xs text-[#1B3022] uppercase tracking-wide font-mono">Epoch Optimization History</div>
                <div className="max-h-40 overflow-y-auto border border-[#E8E5DF]/60 rounded-xl">
                  <table className="w-full text-left text-[11px] font-mono text-[#5D6B5F]">
                    <thead className="bg-[#FDFBF7] sticky top-0 border-b border-[#E8E5DF] text-[#1B3022]">
                      <tr>
                        <th className="p-2.5 font-bold">Epoch</th>
                        <th className="p-2.5 font-bold">Weight (w)</th>
                        <th className="p-2.5 font-bold">Bias (b)</th>
                        <th className="p-2.5 font-bold">y_pred</th>
                        <th className="p-2.5 font-bold text-right">MSE Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E5DF]/30">
                      {trainHistory.map((step) => (
                        <tr key={step.epoch} className={step.epoch === trainHistory.length - 1 ? "bg-emerald-50/30 text-[#2E7D32]" : ""}>
                          <td className="p-2.5 font-bold">{step.epoch}</td>
                          <td className="p-2.5">{step.weight.toFixed(5)}</td>
                          <td className="p-2.5">{step.bias.toFixed(5)}</td>
                          <td className="p-2.5">{step.yPred.toFixed(5)}</td>
                          <td className="p-2.5 text-right font-bold text-[#1B3022]">{step.loss.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Physical Python Codebase Inspection */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-display text-base font-bold text-[#1B3022] flex items-center gap-1.5">
              <Code size={18} className="text-[#2E7D32]" />
              Repository PyTorch Code
            </h3>
            <p className="text-xs text-[#5D6B5F] leading-relaxed">
              These professional PyTorch modules are located in <code>/ml_pytorch/</code> in this workspace for backend training.
            </p>

            {/* Code Selector Tabs */}
            <div className="flex border-b border-[#E8E5DF]">
              <button 
                onClick={() => setActiveCodeTab("model")}
                className={`pb-2.5 text-xs font-bold transition border-b-2 px-4 ${
                  activeCodeTab === "model" 
                    ? "border-[#2E7D32] text-[#2E7D32]" 
                    : "border-transparent text-[#5D6B5F] hover:text-[#1B3022]"
                }`}
              >
                pathology_model.py
              </button>
              <button 
                onClick={() => setActiveCodeTab("lora")}
                className={`pb-2.5 text-xs font-bold transition border-b-2 px-4 ${
                  activeCodeTab === "lora" 
                    ? "border-[#2E7D32] text-[#2E7D32]" 
                    : "border-transparent text-[#5D6B5F] hover:text-[#1B3022]"
                }`}
              >
                peft_lora_train.py
              </button>
            </div>

            {/* Code Highlight Box */}
            <div className="relative">
              <div className="absolute top-2.5 right-2.5 bg-slate-800 text-slate-400 rounded px-2 py-1 text-[9px] font-mono font-bold">
                PYTHON • PYTORCH 2.0+
              </div>
              <pre className="bg-slate-950 text-slate-100 rounded-xl p-4 text-[10px] font-mono leading-relaxed overflow-x-auto max-h-96">
                <code>
                  {activeCodeTab === "model" ? cnnCodeStr : loraCodeStr}
                </code>
              </pre>
            </div>

            {/* Repository Info card */}
            <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-[#1B3022] flex items-center gap-1">
                <Terminal size={14} className="text-indigo-600" />
                Physical Model Architecture Summary:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#5D6B5F] pl-1 font-sans">
                <li><strong>Autograd Enabled</strong>: Tracks computation history on nodes.</li>
                <li><strong>H200 Native Optimization</strong>: Deploys float16 and bfloat16 tensors directly on target GPU.</li>
                <li><strong>LoRA Tuning Config</strong>: PEFT adaptation bounds active trainable weight modules.</li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
