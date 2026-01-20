import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '../ui/slider';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

export default function LensSimulation({ onDataUpdate }) {
  const [objectDistance, setObjectDistance] = useState(150);
  const [focalLength, setFocalLength] = useState(60);
  const [isConvex, setIsConvex] = useState(true);
  const canvasRef = useRef(null);

  const f = isConvex ? focalLength : -focalLength;
  const u = -objectDistance;
  const v = 1 / (1/f - 1/u);
  const magnification = -v / u;
  const imageDistance = Math.abs(v);
  const isReal = isConvex ? (objectDistance > focalLength) : false;
  const isInverted = magnification < 0;
  const imageHeight = Math.abs(magnification) * 50;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 1;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw principal axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw lens
    ctx.beginPath();
    if (isConvex) {
      // Convex lens shape
      ctx.ellipse(centerX, centerY, 15, 80, 0, 0, Math.PI * 2);
    } else {
      // Concave lens shape
      ctx.moveTo(centerX - 10, centerY - 80);
      ctx.bezierCurveTo(centerX + 15, centerY - 40, centerX + 15, centerY + 40, centerX - 10, centerY + 80);
      ctx.lineTo(centerX + 10, centerY + 80);
      ctx.bezierCurveTo(centerX - 15, centerY + 40, centerX - 15, centerY - 40, centerX + 10, centerY - 80);
      ctx.closePath();
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
    ctx.fill();
    
    // Draw focal points
    const focalX1 = centerX - focalLength * scale;
    const focalX2 = centerX + focalLength * scale;
    
    ctx.beginPath();
    ctx.arc(focalX1, centerY, 5, 0, Math.PI * 2);
    ctx.arc(focalX2, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '12px monospace';
    ctx.fillText('F', focalX1 - 5, centerY + 20);
    ctx.fillText("F'", focalX2 - 5, centerY + 20);
    
    // Draw object
    const objectX = centerX - objectDistance * scale;
    const objectHeight = 50;
    
    ctx.beginPath();
    ctx.moveTo(objectX, centerY);
    ctx.lineTo(objectX, centerY - objectHeight);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Arrow head for object
    ctx.beginPath();
    ctx.moveTo(objectX, centerY - objectHeight);
    ctx.lineTo(objectX - 8, centerY - objectHeight + 15);
    ctx.lineTo(objectX + 8, centerY - objectHeight + 15);
    ctx.closePath();
    ctx.fillStyle = '#22c55e';
    ctx.fill();
    
    // Draw rays (for convex lens with real image)
    if (isConvex && objectDistance > focalLength) {
      const imageX = centerX + v * scale;
      const imageY = centerY + imageHeight;
      
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      
      // Ray 1: Parallel to axis, then through F'
      ctx.beginPath();
      ctx.moveTo(objectX, centerY - objectHeight);
      ctx.lineTo(centerX, centerY - objectHeight);
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - objectHeight);
      ctx.lineTo(imageX, imageY);
      ctx.stroke();
      
      // Ray 2: Through optical center
      ctx.beginPath();
      ctx.moveTo(objectX, centerY - objectHeight);
      ctx.lineTo(imageX, imageY);
      ctx.strokeStyle = '#ec4899';
      ctx.stroke();
      
      // Ray 3: Through F, then parallel
      ctx.beginPath();
      ctx.moveTo(objectX, centerY - objectHeight);
      ctx.lineTo(centerX, centerY - objectHeight * (1 - (centerX - objectX) / (centerX - focalX1)));
      ctx.strokeStyle = '#3b82f6';
      ctx.stroke();
      
      // Draw image
      ctx.beginPath();
      ctx.moveTo(imageX, centerY);
      ctx.lineTo(imageX, imageY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Arrow head for image
      ctx.beginPath();
      ctx.moveTo(imageX, imageY);
      ctx.lineTo(imageX - 8, imageY - 15);
      ctx.lineTo(imageX + 8, imageY - 15);
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Image (Real, Inverted)', imageX - 50, imageY + 20);
    } else if (isConvex && objectDistance <= focalLength) {
      // Virtual image for convex lens (object within focal length)
      const virtualImageX = centerX - Math.abs(v) * scale;
      const virtualImageY = centerY - imageHeight;
      
      // Virtual rays (dashed)
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(objectX, centerY - objectHeight);
      ctx.lineTo(virtualImageX, virtualImageY);
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Draw virtual image
      ctx.beginPath();
      ctx.moveTo(virtualImageX, centerY);
      ctx.lineTo(virtualImageX, virtualImageY);
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Image (Virtual, Erect)', virtualImageX - 50, virtualImageY - 10);
    }
    
    // Labels
    ctx.font = '12px monospace';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('Object', objectX - 20, centerY + 20);
    
  }, [objectDistance, focalLength, isConvex, v, magnification, imageHeight]);

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        objectDistance: objectDistance.toFixed(1),
        imageDistance: isFinite(imageDistance) ? imageDistance.toFixed(1) : '∞',
        focalLength: focalLength.toFixed(1),
        magnification: isFinite(magnification) ? magnification.toFixed(2) : '∞',
        imageType: isReal ? 'Real' : 'Virtual',
        imageOrientation: isInverted ? 'Inverted' : 'Erect'
      });
    }
  }, [objectDistance, imageDistance, focalLength, magnification, isReal, isInverted]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lens Canvas */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <canvas
            ref={canvasRef}
            width={500}
            height={300}
            className="w-full rounded-lg bg-gradient-to-b from-slate-900 to-slate-800"
          />
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={`text-sm ${isConvex ? 'text-slate-400' : 'text-cyan-400'}`}>Concave</span>
            <Switch
              checked={isConvex}
              onCheckedChange={setIsConvex}
            />
            <span className={`text-sm ${isConvex ? 'text-cyan-400' : 'text-slate-400'}`}>Convex</span>
          </div>
        </Card>

        {/* Parameters */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">Lens Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Object Distance (u)</span>
                <span className="text-cyan-400 font-mono">{objectDistance} px</span>
              </div>
              <Slider
                value={[objectDistance]}
                onValueChange={([v]) => setObjectDistance(v)}
                min={30}
                max={250}
                step={5}
                className="[&_[role=slider]]:bg-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Focal Length (f)</span>
                <span className="text-purple-400 font-mono">{focalLength} px</span>
              </div>
              <Slider
                value={[focalLength]}
                onValueChange={([v]) => setFocalLength(v)}
                min={30}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-purple-500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="pt-4 border-t border-slate-700 space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Image Properties</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Image Distance (v)</p>
                <p className="text-lg font-mono text-cyan-400">
                  {isFinite(v) ? Math.abs(v).toFixed(1) : '∞'} px
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Magnification (m)</p>
                <p className="text-lg font-mono text-purple-400">
                  {isFinite(magnification) ? magnification.toFixed(2) : '∞'}×
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Image Type</p>
                <p className={`text-lg font-mono ${isReal ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isReal ? 'Real' : 'Virtual'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Orientation</p>
                <p className={`text-lg font-mono ${isInverted ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isInverted ? 'Inverted' : 'Erect'}
                </p>
              </div>
            </div>

            {/* Formula Display */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Lens Formula:</p>
              <p className="text-center font-mono text-cyan-400">
                1/f = 1/v + 1/u
              </p>
              <p className="text-center font-mono text-slate-500 text-sm mt-2">
                1/{focalLength} = 1/{isFinite(v) ? v.toFixed(0) : '∞'} + 1/{-objectDistance}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}