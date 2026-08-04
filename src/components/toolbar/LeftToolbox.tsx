import React, { useState } from 'react';
import { GateType } from '../../types/circuit';
import { GateIcon } from '../nodes/GateIcons';
import { useCircuitStore } from '../../store/useCircuitStore';
import { ToggleLeft, Monitor, Cpu, Plus, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface ToolboxItem {
  type: GateType;
  name: string;
  description: string;
  category: 'Inputs' | 'Logic Gates' | 'Combinational' | 'Outputs';
}

const TOOLBOX_ITEMS: ToolboxItem[] = [
  { type: 'INPUT', name: 'Digital Input', description: 'Static toggle switch (0 or 1)', category: 'Inputs' },
  { type: 'CLOCK', name: 'Clock Generator', description: 'Configurable periodic pulse source', category: 'Inputs' },
  { type: 'MULTI_INPUT', name: 'Multi-Input Bus', description: 'Grouped 1-32 bit bus toggles', category: 'Inputs' },

  { type: 'AND', name: 'AND Gate', description: 'HIGH if all inputs are HIGH', category: 'Logic Gates' },
  { type: 'OR', name: 'OR Gate', description: 'HIGH if any input is HIGH', category: 'Logic Gates' },
  { type: 'NOT', name: 'NOT Inverter', description: 'Inverts signal (0 -> 1, 1 -> 0)', category: 'Logic Gates' },
  { type: 'NAND', name: 'NAND Gate', description: 'Inverted AND logic', category: 'Logic Gates' },
  { type: 'NOR', name: 'NOR Gate', description: 'Inverted OR logic', category: 'Logic Gates' },
  { type: 'XOR', name: 'XOR Gate', description: 'Exclusive OR logic', category: 'Logic Gates' },
  { type: 'XNOR', name: 'XNOR Gate', description: 'Inverted XOR logic', category: 'Logic Gates' },

  { type: 'ENCODER', name: 'Encoder IC', description: 'Active input to binary priority encoder', category: 'Combinational' },

  { type: 'OUTPUT', name: 'Digital Output', description: 'Glow LED display', category: 'Outputs' },
  { type: 'SEVEN_SEGMENT', name: '7-Segment LED', description: '4-bit numeric segment display', category: 'Outputs' },
];

export const LeftToolbox: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const addNode = useCircuitStore((state) => state.addNode);
  const theme = useCircuitStore((state) => state.theme);

  const handleAddAtCenter = (type: GateType) => {
    const x = 320 + Math.random() * 80;
    const y = 180 + Math.random() * 80;
    addNode(type, { x, y });
  };

  const handleDragStart = (e: React.DragEvent, type: GateType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const filteredItems = TOOLBOX_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Inputs', 'Logic Gates', 'Combinational', 'Outputs'] as const;

  return (
    <aside className={`w-64 h-[calc(100vh-3.5rem)] border-r flex flex-col z-20 select-none overflow-hidden transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-950/90 border-slate-800 text-slate-100'
    }`}>
      {/* Header & Search */}
      <div className={`p-3.5 border-b space-y-3 shrink-0 ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className={`text-xs font-bold font-mono tracking-wider uppercase ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}>
              Palette
            </span>
          </div>
          <Badge variant="slate" size="xs">
            {filteredItems.length} ICs
          </Badge>
        </div>

        <Input
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-3.5 h-3.5" />}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Component Palette Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map((category) => {
          const items = filteredItems.filter((i) => i.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 px-1">
                <div className="flex items-center gap-1.5">
                  {category === 'Inputs' && <ToggleLeft className="w-3.5 h-3.5 text-cyan-400" />}
                  {category === 'Logic Gates' && <Cpu className="w-3.5 h-3.5 text-emerald-400" />}
                  {category === 'Combinational' && <Cpu className="w-3.5 h-3.5 text-blue-400" />}
                  {category === 'Outputs' && <Monitor className="w-3.5 h-3.5 text-purple-400" />}
                  <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${
                    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {category}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{items.length}</span>
              </div>

              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    onClick={() => handleAddAtCenter(item.type)}
                    className={`group flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all duration-150 ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100'
                        : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                        <GateIcon type={item.type} className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-mono font-medium truncate ${
                          theme === 'light' ? 'text-slate-800 group-hover:text-slate-950' : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {item.name}
                        </span>
                        <span className={`text-[10px] font-sans truncate ${
                          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 transition-colors ml-1" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
