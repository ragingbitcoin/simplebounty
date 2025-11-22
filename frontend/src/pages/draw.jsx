import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNavigate, useLocation } from 'react-router';
import { ROUTES } from '../config/routes';

const Draw = () => {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);

  const { address1, address2 } = location.state || {};

  // Contract interaction hooks
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Redirect if not connected or no addresses provided
  useEffect(() => {
    if (!isConnected) {
      navigate(ROUTES.CONNECT);
    } else if (!address1 || !address2) {
      navigate(ROUTES.ADDRESS_INPUT);
    }
  }, [isConnected, address1, address2, navigate]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size for horizontal orientation - fill the screen
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    
    // Calculate triangle dimensions to fit within screen
    // Leave minimal space for controls
    const topPadding = 60;
    const bottomPadding = 120;
    const availableHeight = height - topPadding - bottomPadding;
    const availableWidth = width; // Use full width
    
    // Calculate triangle that spans full width
    // Use full width and calculate corresponding height
    const triangleWidth = availableWidth;
    const baseLength = availableWidth * 2 / Math.sqrt(3);
    
    // If height would be too tall, scale down proportionally
    const scaleFactor = availableHeight / baseLength;
    const finalTriangleWidth = Math.min(triangleWidth, availableWidth);
    const finalBaseLength = Math.min(baseLength, availableHeight);
    
    // Position triangle centered vertically
    const baseX = 0;  // Touch left edge
    const centerY = height / 2;  // Center vertically on screen
    const topY = centerY - finalBaseLength / 2;  // Start at center minus half height
    const bottomY = centerY + finalBaseLength / 2;  // End at center plus half height
    const pointX = finalTriangleWidth;  // Point touches right edge
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create horizontal equilateral triangle - base on left, point on right
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pointX, centerY);  // Right point
    ctx.lineTo(baseX, topY);      // Top left (base)
    ctx.lineTo(baseX, bottomY);   // Bottom left (base)
    ctx.closePath();
    ctx.clip();
    
    // Fill clipped area with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Draw triangle border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pointX, centerY);  // Right point
    ctx.lineTo(baseX, topY);      // Top left (base)
    ctx.lineTo(baseX, bottomY);   // Bottom left (base)
    ctx.closePath();
    ctx.stroke();
    
    setContext(ctx);
  }, []);

  // Check if point is inside triangle
  const isPointInTriangle = (x, y) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Recalculate triangle points (same as in useEffect)
    const topPadding = 60;
    const bottomPadding = 120;
    const availableHeight = height - topPadding - bottomPadding;
    const availableWidth = width; // Use full width
    
    // Calculate triangle that spans full width
    const triangleWidth = availableWidth;
    const baseLength = availableWidth * 2 / Math.sqrt(3);
    
    // If height would be too tall, scale down proportionally
    const finalTriangleWidth = Math.min(triangleWidth, availableWidth);
    const finalBaseLength = Math.min(baseLength, availableHeight);
    
    const baseX = 0;
    const centerY = height / 2;
    const topY = centerY - finalBaseLength / 2;
    const bottomY = centerY + finalBaseLength / 2;
    const pointX = finalTriangleWidth;
    
    const x1 = pointX, y1 = centerY;  // Right point
    const x2 = baseX, y2 = topY;      // Top left
    const x3 = baseX, y3 = bottomY;   // Bottom left

    const area = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
    const area1 = Math.abs((x1 - x) * (y2 - y) - (x2 - x) * (y1 - y));
    const area2 = Math.abs((x2 - x) * (y3 - y) - (x3 - x) * (y2 - y));
    const area3 = Math.abs((x3 - x) * (y1 - y) - (x1 - x) * (y3 - y));

    return Math.abs(area - (area1 + area2 + area3)) < 1;
  };

  const getCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    const x = (touch.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvasRef.current.height / rect.height);
    return { x, y };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (!isPointInTriangle(x, y)) return;

    setIsDrawing(true);
    if (context) {
      context.beginPath();
      context.moveTo(x, y);
      context.strokeStyle = currentColor;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
    }
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);

    if (!isPointInTriangle(x, y)) return;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !context) return;
    
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // Recalculate triangle points
    const topPadding = 60;
    const bottomPadding = 120;
    const availableHeight = height - topPadding - bottomPadding;
    const availableWidth = width; // Use full width
    
    // Calculate triangle that spans full width
    const triangleWidth = availableWidth;
    const baseLength = availableWidth * 2 / Math.sqrt(3);
    
    // If height would be too tall, scale down proportionally
    const finalTriangleWidth = Math.min(triangleWidth, availableWidth);
    const finalBaseLength = Math.min(baseLength, availableHeight);
    
    const baseX = 0;
    const centerY = height / 2;
    const topY = centerY - finalBaseLength / 2;
    const bottomY = centerY + finalBaseLength / 2;
    const pointX = finalTriangleWidth;
    
    context.clearRect(0, 0, width, height);
    
    // Redraw white background and triangle
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    
    context.strokeStyle = '#000';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(pointX, centerY);
    context.lineTo(baseX, topY);
    context.lineTo(baseX, bottomY);
    context.closePath();
    context.stroke();
  };

  const handleSubmit = async () => {
    if (!canvasRef.current) return;

    try {
      // Convert canvas to SVG data
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      
      // Convert to bytes for the contract
      // The contract expects bytes, we'll send the base64 data URL
      const imageBytes = `0x${Buffer.from(dataUrl).toString('hex')}`;

      // TODO: Replace with actual contract address and ABI
      const CONTRACT_ADDRESS = '0xYourContractAddress'; // You'll need to set this
      const CONTRACT_ABI = [
        {
          name: 'bind',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'accessTokenId', type: 'uint256' },
            { name: 'adept1', type: 'address' },
            { name: 'adept2', type: 'address' },
            { name: 'data', type: 'bytes' }
          ],
          outputs: []
        }
      ];

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'bind',
        args: [0, address1, address2, imageBytes], // Using 0 for accessTokenId - adjust as needed
      });
    } catch (error) {
      console.error('Error submitting ceremony:', error);
      alert('Error submitting ceremony. Check console for details.');
    }
  };

  if (!isConnected || !address1 || !address2) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900 relative">
      {/* Full-screen Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/30 to-transparent">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-lg"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white/90 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs font-semibold whitespace-nowrap">{brushSize}px</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        <button
          onClick={clearCanvas}
          className="btn btn-sm btn-warning shadow-lg"
        >
          Clear
        </button>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/40 to-transparent">
        <div className="bg-white/95 rounded-lg p-3 shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-600">You</p>
              <p className="text-[9px] font-mono truncate">{address}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-600">P1</p>
              <p className="text-[9px] font-mono truncate">{address1}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-600">P2</p>
              <p className="text-[9px] font-mono truncate">{address2}</p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isPending || isConfirming}
            className="btn btn-primary btn-sm w-full"
          >
            {isPending ? 'Preparing...' : isConfirming ? 'Confirming...' : isSuccess ? 'Success!' : 'Submit Ceremony'}
          </button>

          {isSuccess && (
            <div className="mt-2 text-center text-xs text-success font-semibold">
              Ceremony created successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Draw;

