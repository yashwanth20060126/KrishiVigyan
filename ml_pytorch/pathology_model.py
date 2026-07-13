import torch
import torch.nn as nn
import torch.nn.functional as F

class LeafPathologyCNN(nn.Module):
    """
    KrishiVigyan Crop Pathology Leaf Symptom Classification Network.
    Designed for deployment on high-throughput GPU accelerators (e.g., NVIDIA H200/A100).
    
    Includes standard Convolutional layers, Batch Normalization to stabilize activation,
    and Dropout to prevent overfitting on complex crop blights and mosaic virus symptoms.
    """
    def __init__(self, num_classes=4):
        super(LeafPathologyCNN, self).__init__()
        
        # Block 1: Input size (3 x 224 x 224)
        self.conv1 = nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        
        # Block 2: Size (32 x 112 x 112) after MaxPool
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        
        # Block 3: Size (64 x 56 x 56) after MaxPool
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        
        # Pooling & Dropout
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        self.dropout = nn.Dropout(p=0.4)
        
        # Fully Connected layers
        # Size after 3 max-pools: 224 / (2^3) = 28
        # Flattened features: 128 * 28 * 28 = 100,352
        self.fc1 = nn.Linear(128 * 28 * 28, 256)
        self.fc2 = nn.Linear(256, num_classes)
        
    def forward(self, x):
        # Apply Block 1
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        
        # Apply Block 2
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        
        # Apply Block 3
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        
        # Flatten for Linear dense layers
        x = x.view(-1, 128 * 28 * 28)
        
        # Dense layer with dropout regularization
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        
        # Output logits
        logits = self.fc2(x)
        return logits


# Unit Testing the PyTorch computational graph forward pass
if __name__ == "__main__":
    print("Initializing KrishiVigyan LeafPathologyCNN with PyTorch...")
    model = LeafPathologyCNN(num_classes=4)
    
    # Check if GPU acceleration is available (Optimized for H200)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    print(f"Model placed on device: {device.type.upper()}")
    
    # Create synthetic batch (Batch size = 8, 3 Channels, 224x224 input image resolution)
    sample_images = torch.randn(8, 3, 224, 224).to(device)
    
    # Run a forward pass
    with torch.no_grad():
        output_logits = model(sample_images)
        probabilities = F.softmax(output_logits, dim=1)
        
    print(f"Forward pass completed successfully!")
    print(f"Input batch shape:  {sample_images.shape}")
    print(f"Output logits shape: {output_logits.shape}")
    print(f"Softmax probabilities shape: {probabilities.shape}")
    print("\nTensor computations validated. PyTorch pipeline is operational.")
