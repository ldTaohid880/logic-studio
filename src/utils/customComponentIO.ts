import { CustomComponentDefinition, CustomComponentExportFormat } from '../types/customComponent';

export function exportCustomComponentToJSON(
  componentId: string,
  customComponentsMap: Record<string, CustomComponentDefinition>
): string {
  const comp = customComponentsMap[componentId];
  if (!comp) throw new Error(`Custom component ${componentId} not found`);

  // Collect dependencies recursively
  const dependencies: Record<string, CustomComponentDefinition> = {};
  const collectDeps = (c: CustomComponentDefinition) => {
    if (!c || !c.nodes) return;
    c.nodes.forEach((n) => {
      const data = n.data as any;
      if (data && data.gateType === 'CUSTOM' && data.customComponentId) {
        const depId = data.customComponentId;
        if (depId !== componentId && !dependencies[depId] && customComponentsMap[depId]) {
          dependencies[depId] = customComponentsMap[depId];
          collectDeps(customComponentsMap[depId]);
        }
      }
    });
  };

  collectDeps(comp);

  const exportPayload: CustomComponentExportFormat = {
    type: 'DIGITAL_LOGIC_CUSTOM_COMPONENT',
    version: '1.0',
    timestamp: new Date().toISOString(),
    component: comp,
    dependencies,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function parseCustomComponentFromJSON(
  jsonString: string
): { component: CustomComponentDefinition; dependencies: Record<string, CustomComponentDefinition> } {
  const parsed = JSON.parse(jsonString);

  if (parsed.type === 'DIGITAL_LOGIC_CUSTOM_COMPONENT' && parsed.component) {
    return {
      component: parsed.component,
      dependencies: parsed.dependencies || {},
    };
  }

  // Fallback if user imported a raw CustomComponentDefinition JSON
  if (parsed.id && parsed.name && Array.isArray(parsed.inputs) && Array.isArray(parsed.outputs) && Array.isArray(parsed.nodes)) {
    return {
      component: parsed as CustomComponentDefinition,
      dependencies: {},
    };
  }

  throw new Error('Invalid custom component JSON format');
}
