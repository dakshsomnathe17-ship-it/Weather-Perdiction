import React from 'react';
import { useGlobeStore } from '@/store/globeStore';
import { GlassCard } from './GlassCard';
import { Layers, Thermometer, CloudRain, Cloud, Droplets, Wind, Gauge, Sun, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapLayer } from '@/hooks/useMapLayer';
import { LAYER_SCALES } from '@/utils/weatherMap';
import type { WeatherLayer } from '@/types';

function LayerStatus({ layer }: { layer: WeatherLayer }) {
  const query = useMapLayer(layer);
  if (!layer.active) return null;
  const scale = LAYER_SCALES[layer.id];
  return <div className="text-[10px] text-surface-300" role="status">
    {layer.name}: {query.isLoading ? 'Loading…' : query.isError ? 'Unavailable' : !query.data?.points.length ? 'Awaiting data' : `${scale.min}–${scale.max} ${scale.unit}`}
    {!!query.data?.points.length && <div className="h-1 rounded mt-1" style={{ background: `linear-gradient(to right, ${scale.low}, ${scale.high})` }} />}
  </div>;
}

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
    <div className="absolute top-3 left-3 z-40 max-w-[calc(100%-80px)]">
      <GlassCard padding="p-0" className="overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
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
              className="px-4 pb-4 flex flex-col gap-3 w-60 max-w-full max-h-[240px] overflow-y-auto"
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
                      aria-label={`${layer.name} layer`}
                      aria-pressed={layer.active}
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
                      aria-label={`${layer.name} opacity`}
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
      <div className="mt-2 px-2 rounded bg-surface-950/80 max-w-60">
        {activeLayers.filter((layer) => layer.active).map((layer) => <LayerStatus key={layer.id} layer={layer} />)}
      </div>
    </div>
  );
};
