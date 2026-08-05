import { Node, Edge } from '@xyflow/react';

export interface CustomPinDefinition {
  id: string; // pin handle identifier, e.g. "in-0", "out-sum"
  name: string; // pin display name, e.g. "A", "B", "SUM", "CARRY"
  direction: 'input' | 'output';
  description?: string;
  internalNodeId?: string; // ID of the corresponding internal INPUT/OUTPUT node
  internalPinId?: string;
}

export interface CustomComponentDefinition {
  id: string; // e.g. "custom_half_adder_1722883"
  name: string; // e.g. "Half Adder"
  category: string; // e.g. "Custom Components"
  description?: string;
  icon?: string;
  color?: string; // Theme color hex/preset
  inputs: CustomPinDefinition[];
  outputs: CustomPinDefinition[];
  nodes: Node[]; // Internal schematic ReactFlow nodes
  edges: Edge[]; // Internal schematic ReactFlow edges
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HierarchyBreadcrumb {
  id: string; // 'root' for main project, or customComponentId
  name: string; // 'Main Project' or subcircuit name
  instanceId?: string; // specific node instance ID on parent canvas
}

export interface CustomComponentExportFormat {
  type: 'DIGITAL_LOGIC_CUSTOM_COMPONENT';
  version: '1.0';
  timestamp: string;
  component: CustomComponentDefinition;
  dependencies: Record<string, CustomComponentDefinition>;
}
