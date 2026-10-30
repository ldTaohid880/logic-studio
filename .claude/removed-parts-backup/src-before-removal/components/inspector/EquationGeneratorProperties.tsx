import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { Sliders } from 'lucide-react';

interface EquationGeneratorPropertiesProps {
  nodeId: string;
  outputVarName?: string;
  label?: string;
}

export const EquationGeneratorProperties: React.FC<EquationGeneratorPropertiesProps> = ({
  nodeId,
  outputVarName = 'F',
  label = 'Boolean Equation',
}) => {
  const updateNodeLabel = useCircuitStore((s) => s.updateNodeLabel);

  const handleOutputVarChange = (val: string) => {
    useCircuitStore.getState().updateNodeData(nodeId, { outputVarName: val });
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      <InspectorSection title="Equation Properties" icon={<Sliders className="w-4 h-4 text-cyan-400" />}>
        <PropertyRow label="Node Label" hint="Title displayed on the node header">
          <Input
            value={label}
            onChange={(e) => updateNodeLabel(nodeId, e.target.value)}
            placeholder="Boolean Equation..."
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Output Variable" hint="Variable name on left side of equation (e.g. F, OUT, Y)">
          <Input
            value={outputVarName}
            onChange={(e) => handleOutputVarChange(e.target.value)}
            placeholder="F"
            className="w-36 font-mono text-cyan-400 font-bold"
          />
        </PropertyRow>
      </InspectorSection>
    </div>
  );
};
