import React from 'react';
import { useGlobeStore } from '@/store/globeStore';
import { GlassCard } from './GlassCard';
import { Layers, Thermometer, CloudRain, Cloud, Droplets, Wind, Gauge, Sun, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, React.ReactNode> = {
  Thermometer: <Thermometer className="w-4 h-4" />,
  CloudRain: <CloudRain className="w-4 h-4" />,
  Cloud: <Cloud className="w-4 h-4" />,
  Droplets: <Droplets className="w-4 h-4" />,
  Wind: <Wind className="w-4 h-4" />,
  Gauge: <Gauge className="w-4 h-4" />,
  Sun: <Sun className="w-4 h-4" />,
  Leaf: <Leaf className="w-4 h-4" />,
};

export const LayerControl: React.FC = () => {
  const { activeLayers, toggleLayer, setLayerOpacity } = useGlobeStore();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="absolute top-6 left-6 z-40">
      <GlassCard padding="p-0" className="overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full p-4 hover:bg-surface-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-400" />
            <span className="font-semibold text-white">Weather Layers</span>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 flex flex-col gap-4 w-64"
            >
              {activeLayers.map((layer) => (
                <div key={layer.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-surface-200">
                      {iconMap[layer.icon]}
                      <span>{layer.name}</span>
                    </div>
                    <button
                      onClick={() => toggleLayer(layer.id)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${layer.active ? 'bg-primary-500' : 'bg-surface-700'}`}
                    >
                      <motion.div 
                        layout
                        className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                        animate={{ left: layer.active ? '1.1rem' : '0.125rem' }}
                      />
                    </button>
                  </div>
                  {layer.active && (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layer.opacity}
                      onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full accent-primary-500 h-1 bg-surface-800 rounded-lg appearance-none cursor-pointer"
                    />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
};
