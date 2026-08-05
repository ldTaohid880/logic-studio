import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { GROUP_COLORS } from '../nodes/GroupNode';
import { Layers, Palette, Trash2, Unlink } from 'lucide-react';

interface GroupPropertiesProps {
  nodeId: string;
  label?: string;
  color?: string;
}

export const GroupProperties: React.FC<GroupPropertiesProps> = ({
  nodeId,
  label = 'Logic Group',
  color = 'purple',
}) => {
  const updateNodeLabel = useCircuitStore((s) => s.updateNodeLabel);
  const ungroupNode = useCircuitStore((s) => s.ungroupNode);

  const handleColorChange = (colorKey: string) => {
    const nodes = useCircuitStore.getState().nodes;
    useCircuitStore.setState({
      nodes: nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                color: colorKey,
              },
            }
          : n
      ),
    });
  };

  const colors = [
    { key: 'purple', label: 'Purple', bg: 'bg-purple-500' },
    { key: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
    { key: 'emerald', label: 'Green', bg: 'bg-emerald-500' },
    { key: 'amber', label: 'Yellow', bg: 'bg-amber-500' },
    { key: 'rose', label: 'Rose', bg: 'bg-rose-500' },
    { key: 'blue', label: 'Blue', bg: 'bg-blue-500' },
    { key: 'slate', label: 'Slate', bg: 'bg-slate-500' },
  ];

  return (
    <div className="space-y-4 font-sans text-xs">
      <InspectorSection title="Group Settings" icon={<Layers className="w-4 h-4 text-purple-400" />}>
        <PropertyRow label="Group Label" hint="Name tag for this node container">
          <Input
            value={label}
            onChange={(e) => updateNodeLabel(nodeId, e.target.value)}
            placeholder="Logic Group..."
            className="w-36 font-bold"
          />
        </PropertyRow>

        <PropertyRow label="Accent Theme" hint="Border and background color scheme">
          <div className="flex items-center gap-1.5 flex-wrap">
            {colors.map((c) => (
              <button
                key={c.key}
                onClick={() => handleColorChange(c.key)}
                title={c.label}
                className={`w-5 h-5 rounded-full ${c.bg} transition-all cursor-pointer ${
                  color === c.key ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </PropertyRow>
      </InspectorSection>

      <InspectorSection title="Group Operations" icon={<Unlink className="w-4 h-4 text-amber-400" />}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Unlink className="w-4 h-4 text-amber-400" />}
          onClick={() => ungroupNode(nodeId)}
          className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
        >
          Ungroup Nodes
        </Button>
      </InspectorSection>
    </div>
  );
};
