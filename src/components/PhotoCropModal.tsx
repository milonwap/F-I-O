import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Move, RefreshCw } from 'lucide-react';
import { Language } from '../types/somiti';

interface PhotoCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  language: Language;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  imageSrc,
  language,
  onClose,
  onCropComplete,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minScale, setMinScale] = useState(0.1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        imageRef.current = img;
        // Calculate initial scale to fit the image inside the 280x280 container
        const containerSize = 280;
        const fitScale = Math.min(containerSize / img.width, containerSize / img.height);
        setMinScale(fitScale * 0.2);
        setScale(fitScale);
        setPosition({ x: 0, y: 0 });
      };
    }
  }, [imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleGenerateCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputSize = 400; // high res circular avatar output
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.clearRect(0, 0, outputSize, outputSize);

    // Draw circular clipping mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Fill background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);

    const img = imageRef.current;
    const containerSize = 280; // preview container visual size

    // Map visual position and scale to canvas output
    const scaleFactor = outputSize / containerSize;
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    const centerX = outputSize / 2 + position.x * scaleFactor;
    const centerY = outputSize / 2 + position.y * scaleFactor;

    ctx.drawImage(
      img,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white">
          <div className="flex items-center gap-2">
            <Move className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">
              {language === 'bn' ? 'মুখের অংশ ক্রপ ও ফ্রেমিং করুন (Circle Crop)' : 'Frame & Crop Face (Circular)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-300 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-center">
          <p className="text-xs text-neutral-600">
            {language === 'bn'
              ? 'মাউস বা আঙুল দিয়ে টেনে ছবি পজিশন করুন এবং জুম স্লাইডার ব্যবহার করে মুখমণ্ডল বৃত্তের ভেতরে সেট করুন।'
              : 'Drag image to position and use zoom slider to center face inside the circular guide.'}
          </p>

          {/* Interactive Crop Viewport with Circular Mask */}
          <div
            className="relative w-[280px] h-[280px] mx-auto bg-neutral-900 rounded-2xl overflow-hidden cursor-move border-2 border-emerald-500 shadow-inner select-none touch-none flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Crop Preview"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center',
                }}
                className="max-w-none pointer-events-none transition-transform duration-75"
              />
            )}

            {/* Circular Face Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[36px] border-black/60 rounded-full box-content -m-[36px]" />
            <div className="absolute inset-4 pointer-events-none border border-emerald-400/80 rounded-full border-dashed" />
          </div>

          {/* Zoom Slider Controls */}
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
              <span className="flex items-center gap-1">
                <ZoomOut className="w-3.5 h-3.5" /> 0.5x
              </span>
              <span>{language === 'bn' ? 'জুম কন্ট্রোল' : 'Zoom Level'}</span>
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5" /> 3.0x
              </span>
            </div>
            <input
              type="range"
              min={minScale}
              max={minScale * 8}
              step={minScale * 0.05}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Hidden Canvas for Export */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleGenerateCrop}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'bn' ? 'ক্রপ ও সেভ করুন' : 'Crop & Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
