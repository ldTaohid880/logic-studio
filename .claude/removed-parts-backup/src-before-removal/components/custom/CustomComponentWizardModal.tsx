import React, { useState, useEffect } from 'react';
import { ModalFrame } from '../ui/Dialog';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { CustomPinDefinition } from '../../types/customComponent';
import { NodeData } from '../../types/circuit';
import {
  X,
  Sparkles,
  Component,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MoveUp,
  MoveDown,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CustomComponentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];

export const CustomComponentWizardModal: React.FC<CustomComponentWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    nodes,
    edges,
    convertSelectionToCustomComponent,
    showToast,
  } = useCircuitStore(useShallow((s) => ({ nodes: s.nodes, edges: s.edges, convertSelectionToCustomComponent: s.convertSelectionToCustomComponent, showToast: s.showToast })));

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('My Custom Subcircuit');
  const [category, setCategory] = useState('Custom Components');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');

  const [targetNodeIds, setTargetNodeIds] = useState<string[]>([]);
  const [inputs, setInputs] = useState<CustomPinDefinition[]>([]);
  const [outputs, setOutputs] = useState<CustomPinDefinition[]>([]);

  const selectedNodes = nodes.filter((n) => targetNodeIds.includes(n.id));

  // When modal opens, auto-detect inputs and outputs from selected nodes!
  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    const currSelectedNodes = nodes.filter((n) => n.selected);
    const selectedIds = currSelectedNodes.map((n) => n.id);
    setTargetNodeIds(selectedIds);

    let defaultName = 'Custom Component';
    if (currSelectedNodes.length > 0) {
      if (currSelectedNodes.length === 2 && currSelectedNodes.some((n) => (n.data as unknown as NodeData).gateType === 'XOR')) {
        defaultName = 'Half Adder';
      } else {
        defaultName = `Subcircuit ${nodes.filter((n) => (n.data as unknown as NodeData).gateType === 'CUSTOM').length + 1}`;
      }
    }
    setName(defaultName);

    // Auto-detect circuit inputs & outputs from selected nodes
    const detectedInputs: CustomPinDefinition[] = [];
    const detectedOutputs: CustomPinDefinition[] = [];
    const selectedNodeIds = new Set(currSelectedNodes.map((n) => n.id));

    let inCount = 0;
    let outCount = 0;

    // 1. Identify Explicit Input & Output Nodes in Selection
    currSelectedNodes.forEach((node) => {
      const data = node.data as unknown as NodeData;

      if (['INPUT', 'PUSH_BUTTON', 'CLOCK', 'CONST_HIGH', 'CONST_LOW', 'MULTI_INPUT'].includes(data.gateType)) {
        inCount++;
        detectedInputs.push({
          id: `in-${inCount - 1}`,
          name: data.label && !data.label.startsWith('Digital') ? data.label : String.fromCharCode(64 + inCount), // A, B, C...
          direction: 'input',
          description: `Input signal pin ${inCount}`,
          internalNodeId: node.id,
          internalPinId: 'in-0',
        });
      } else if (['OUTPUT', 'LOGIC_PROBE', 'RGB_LED', 'SEVEN_SEGMENT', 'HEX_DISPLAY'].includes(data.gateType)) {
        outCount++;
        detectedOutputs.push({
          id: `out-${outCount - 1}`,
          name: data.label && !data.label.startsWith('Digital') ? data.label : outCount === 1 ? 'SUM' : outCount === 2 ? 'CARRY' : `OUT_${outCount}`,
          direction: 'output',
          description: `Output signal pin ${outCount}`,
          internalNodeId: node.id,
          internalPinId: 'out-0',
        });
      }
    });

    // 2. Check Boundary Wires (external -> internal / internal -> external)
    edges.forEach((edge) => {
      if (!selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)) {
        const targetNode = currSelectedNodes.find((n) => n.id === edge.target);
        if (targetNode && !detectedInputs.some((p) => p.internalNodeId === targetNode.id)) {
          inCount++;
          detectedInputs.push({
            id: `in-${inCount - 1}`,
            name: `IN_${inCount}`,
            direction: 'input',
            internalNodeId: targetNode.id,
            internalPinId: edge.targetHandle || 'in-0',
          });
        }
      }

      if (selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target)) {
        const sourceNode = currSelectedNodes.find((n) => n.id === edge.source);
        if (sourceNode && !detectedOutputs.some((p) => p.internalNodeId === sourceNode.id)) {
          outCount++;
          detectedOutputs.push({
            id: `out-${outCount - 1}`,
            name: `OUT_${outCount}`,
            direction: 'output',
            internalNodeId: sourceNode.id,
            internalPinId: edge.sourceHandle || 'out-0',
          });
        }
      }
    });

    // 3. Leaf Node Auto-Detection: If no explicit OUTPUT nodes exist, find final output gates in selected subgraph!
    if (detectedOutputs.length === 0 && currSelectedNodes.length > 0) {
      const nodesFeedingOtherSelectedNodes = new Set(
        edges
          .filter((e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target))
          .map((e) => e.source)
      );

      const leafNodes = currSelectedNodes.filter((n) => {
        const data = n.data as unknown as NodeData;
        if (['INPUT', 'PUSH_BUTTON', 'CLOCK', 'CONST_HIGH', 'CONST_LOW'].includes(data.gateType)) return false;
        return !nodesFeedingOtherSelectedNodes.has(n.id);
      });

      const finalOutputNodes = leafNodes.length > 0 ? leafNodes : currSelectedNodes.filter((n) => !['INPUT', 'PUSH_BUTTON', 'CLOCK'].includes((n.data as unknown as NodeData).gateType));

      finalOutputNodes.forEach((node) => {
        const data = node.data as unknown as NodeData;
        outCount++;
        let pinName = `OUT_${outCount}`;
        if (data.label && !data.label.startsWith('Gate') && !data.label.startsWith('Logic')) {
          pinName = data.label;
        } else if (data.gateType === 'XOR') {
          pinName = 'SUM';
        } else if (data.gateType === 'AND') {
          pinName = 'CARRY';
        }

        detectedOutputs.push({
          id: `out-${outCount - 1}`,
          name: pinName,
          direction: 'output',
          description: `Output from ${data.gateType} gate`,
          internalNodeId: node.id,
          internalPinId: data.outputs?.[0]?.id || 'out-0',
        });
      });
    }

    // 4. Input Node Auto-Detection: If no explicit INPUT nodes exist, find root input gates!
    if (detectedInputs.length === 0 && currSelectedNodes.length > 0) {
      const nodesReceivingInternalEdges = new Set(
        edges
          .filter((e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target))
          .map((e) => e.target)
      );

      const rootInputNodes = currSelectedNodes.filter((n) => {
        const data = n.data as unknown as NodeData;
        if (['OUTPUT', 'LOGIC_PROBE', 'RGB_LED'].includes(data.gateType)) return false;
        return !nodesReceivingInternalEdges.has(n.id);
      });

      rootInputNodes.forEach((node) => {
        const data = node.data as unknown as NodeData;
        inCount++;
        detectedInputs.push({
          id: `in-${inCount - 1}`,
          name: data.label && !data.label.startsWith('Gate') ? data.label : String.fromCharCode(64 + inCount),
          direction: 'input',
          description: `Input to ${data.gateType} gate`,
          internalNodeId: node.id,
          internalPinId: data.inputs?.[0]?.id || 'in-0',
        });
      });
    }

    // Default fallbacks if empty
    if (detectedInputs.length === 0) {
      detectedInputs.push(
        { id: 'in-0', name: 'A', direction: 'input', description: 'Input pin A' },
        { id: 'in-1', name: 'B', direction: 'input', description: 'Input pin B' }
      );
    }
    if (detectedOutputs.length === 0) {
      detectedOutputs.push({ id: 'out-0', name: 'OUT', direction: 'output', description: 'Output pin' });
    }

    setInputs(detectedInputs);
    setOutputs(detectedOutputs);
  }, [isOpen, nodes, edges]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (!name.trim()) {
      showToast('Please specify a component name');
      return;
    }

    const createdId = convertSelectionToCustomComponent(
      name.trim(),
      category.trim() || 'Custom Components',
      description,
      { inputs, outputs },
      color,
      targetNodeIds
    );

    if (createdId) {
      showToast(`Custom Component "${name}" created successfully!`);
      onClose();
    }
  };

  const movePin = (list: CustomPinDefinition[], setList: (l: CustomPinDefinition[]) => void, index: number, dir: 'up' | 'down') => {
    const newList = [...list];
    const targetIdx = dir === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newList.length) return;

    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;
    setList(newList);
  };

  // Helper to get available output pins for a given internal node
  const getNodeOutputHandles = (nodeId?: string) => {
    if (!nodeId) return [{ id: 'out-0', label: 'Output 1 (out-0)' }];
    const targetNode = selectedNodes.find((n) => n.id === nodeId);
    if (!targetNode) return [{ id: 'out-0', label: 'Output 1 (out-0)' }];

    const data = targetNode.data as unknown as NodeData;
    if (data.outputs && data.outputs.length > 0) {
      return data.outputs.map((p, idx) => ({
        id: p.id || `out-${idx}`,
        label: `${p.name || `Output ${idx + 1}`} (${p.id || `out-${idx}`})`,
      }));
    }
    return [{ id: 'out-0', label: 'Output 1 (out-0)' }];
  };

  // Helper to get available input pins for a given internal node
  const getNodeInputHandles = (nodeId?: string) => {
    if (!nodeId) return [{ id: 'in-0', label: 'Input 1 (in-0)' }];
    const targetNode = selectedNodes.find((n) => n.id === nodeId);
    if (!targetNode) return [{ id: 'in-0', label: 'Input 1 (in-0)' }];

    const data = targetNode.data as unknown as NodeData;
    if (data.inputs && data.inputs.length > 0) {
      return data.inputs.map((p, idx) => ({
        id: p.id || `in-${idx}`,
        label: `${p.name || `Input ${idx + 1}`} (${p.id || `in-${idx}`})`,
      }));
    }
    return [{ id: 'in-0', label: 'Input 1 (in-0)' }];
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={"Create custom component"}
      className="w-full max-w-3xl max-h-[90vh]"
    >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              <Component className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono tracking-wide">
                Create Custom Component / Subcircuit
              </h2>
              <p className="text-xs text-slate-400">
                Step {step} of 3 — {step === 1 ? 'Component Information' : step === 2 ? 'Pin & Node Mapping' : 'Symbol Preview'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800/60 flex items-center justify-between text-xs font-mono">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              1
            </span>
            Info
          </div>

          <div className="w-12 h-[1px] bg-slate-800" />

          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              2
            </span>
            Pins & Nodes
          </div>

          <div className="w-12 h-[1px] bg-slate-800" />

          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              3
            </span>
            Preview
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-300 mb-1.5">
                  Component Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Half Adder, ALU, 4-bit Register"
                  className="w-full bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-300 mb-1.5">
                  Category
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Custom Components, Adders, Arithmetic"
                  className="w-full bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Briefly describe what this subcircuit does..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-300 mb-1.5">
                  Theme Color Badge
                </label>
                <div className="flex items-center gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Input Pins Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    Input Pins ({inputs.length})
                  </h3>
                  <button
                    onClick={() => {
                      const firstNode = selectedNodes[0];
                      setInputs([
                        ...inputs,
                        {
                          id: `in-${inputs.length}`,
                          name: `IN_${inputs.length + 1}`,
                          direction: 'input',
                          internalNodeId: firstNode?.id,
                          internalPinId: 'in-0',
                        },
                      ]);
                    }}
                    className="text-xs font-mono text-emerald-400 hover:underline"
                  >
                    + Add Input Pin
                  </button>
                </div>

                <div className="space-y-2">
                  {inputs.map((pin, idx) => (
                    <div
                      key={pin.id}
                      className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                    >
                      <span className="w-5 text-center text-slate-500 font-mono font-bold">{idx + 1}</span>

                      {/* Pin Name */}
                      <Input
                        value={pin.name}
                        onChange={(e) => {
                          const updated = [...inputs];
                          updated[idx].name = e.target.value;
                          setInputs(updated);
                        }}
                        placeholder="Pin Name"
                        className="w-28 bg-slate-900 border-slate-700 text-xs"
                      />

                      {/* Target Internal Node Select */}
                      {selectedNodes.length > 0 && (
                        <select
                          value={pin.internalNodeId || ''}
                          onChange={(e) => {
                            const updated = [...inputs];
                            updated[idx].internalNodeId = e.target.value;
                            const availableHandles = getNodeInputHandles(e.target.value);
                            updated[idx].internalPinId = availableHandles[0]?.id || 'in-0';
                            setInputs(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1.5 focus:border-cyan-500"
                        >
                          <option value="">Select Internal Node...</option>
                          {selectedNodes.map((n) => {
                            const d = n.data as unknown as NodeData;
                            return (
                              <option key={n.id} value={n.id}>
                                {d.label || n.id} ({d.gateType})
                              </option>
                            );
                          })}
                        </select>
                      )}

                      {/* Target Node Handle Select */}
                      {pin.internalNodeId && (
                        <select
                          value={pin.internalPinId || 'in-0'}
                          onChange={(e) => {
                            const updated = [...inputs];
                            updated[idx].internalPinId = e.target.value;
                            setInputs(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1.5 focus:border-cyan-500"
                        >
                          {getNodeInputHandles(pin.internalNodeId).map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.label}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => movePin(inputs, setInputs, idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => movePin(inputs, setInputs, idx, 'down')}
                          disabled={idx === inputs.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setInputs(inputs.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Pins Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    Output Pins ({outputs.length})
                  </h3>
                  <button
                    onClick={() => {
                      const lastNode = selectedNodes[selectedNodes.length - 1];
                      setOutputs([
                        ...outputs,
                        {
                          id: `out-${outputs.length}`,
                          name: `OUT_${outputs.length + 1}`,
                          direction: 'output',
                          internalNodeId: lastNode?.id,
                          internalPinId: 'out-0',
                        },
                      ]);
                    }}
                    className="text-xs font-mono text-emerald-400 hover:underline"
                  >
                    + Add Output Pin
                  </button>
                </div>

                <div className="space-y-2">
                  {outputs.map((pin, idx) => (
                    <div
                      key={pin.id}
                      className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                    >
                      <span className="w-5 text-center text-slate-500 font-mono font-bold">{idx + 1}</span>

                      {/* Pin Name */}
                      <Input
                        value={pin.name}
                        onChange={(e) => {
                          const updated = [...outputs];
                          updated[idx].name = e.target.value;
                          setOutputs(updated);
                        }}
                        placeholder="Pin Name"
                        className="w-28 bg-slate-900 border-slate-700 text-xs"
                      />

                      {/* Target Internal Node Select */}
                      {selectedNodes.length > 0 && (
                        <select
                          value={pin.internalNodeId || ''}
                          onChange={(e) => {
                            const updated = [...outputs];
                            updated[idx].internalNodeId = e.target.value;
                            const availableHandles = getNodeOutputHandles(e.target.value);
                            updated[idx].internalPinId = availableHandles[0]?.id || 'out-0';
                            setOutputs(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1.5 focus:border-emerald-500"
                        >
                          <option value="">Select Internal Node...</option>
                          {selectedNodes.map((n) => {
                            const d = n.data as unknown as NodeData;
                            return (
                              <option key={n.id} value={n.id}>
                                {d.label || n.id} ({d.gateType})
                              </option>
                            );
                          })}
                        </select>
                      )}

                      {/* Target Node Output Handle Select */}
                      {pin.internalNodeId && (
                        <select
                          value={pin.internalPinId || 'out-0'}
                          onChange={(e) => {
                            const updated = [...outputs];
                            updated[idx].internalPinId = e.target.value;
                            setOutputs(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1.5 focus:border-emerald-500"
                        >
                          {getNodeOutputHandles(pin.internalNodeId).map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.label}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => movePin(outputs, setOutputs, idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => movePin(outputs, setOutputs, idx, 'down')}
                          disabled={idx === outputs.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setOutputs(outputs.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center flex flex-col items-center justify-center py-4">
              <p className="text-xs text-slate-400 max-w-md">
                Here is how your newly created component will look on the circuit canvas:
              </p>

              {/* Preview Node Box */}
              <div className="w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden text-left">
                <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded flex items-center justify-center text-[11px] text-white font-bold" style={{ backgroundColor: color }}>
                      <Layers className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-100">{name || 'Component'}</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    CUSTOM
                  </span>
                </div>

                <div className="p-4 flex justify-between gap-4">
                  <div className="space-y-2 text-left">
                    {inputs.map((inPin) => (
                      <div key={inPin.id} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600 border border-slate-500" />
                        <span className="text-xs font-mono text-slate-300">{inPin.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-right">
                    {outputs.map((outPin) => (
                      <div key={outPin.id} className="flex items-center justify-end gap-1.5">
                        <span className="text-xs font-mono text-slate-300">{outPin.name}</span>
                        <span className="w-2 h-2 rounded-full bg-slate-600 border border-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 max-w-md flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  Once saved, this subcircuit will appear under <strong>{category}</strong> in the left toolbox and can be reused freely across your projects.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => setStep((s) => (s - 1) as any)}
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setStep((s) => (s + 1) as any)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="emerald"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleFinish}
              >
                Create Component
              </Button>
            )}
          </div>
        </div>
    </ModalFrame>
  );
};
