import { Node } from '@xyflow/react';
import { makeId } from '../helpers';
import { CircuitStore, StoreSlice } from '../types';

// Visual groups: a frame node that parts sit inside (parentId)
export type GroupsSlice = Pick<CircuitStore, 'groupSelectedNodes' | 'ungroupNode'>;

export const createGroupsSlice: StoreSlice<GroupsSlice> = (set, get) => ({
  groupSelectedNodes: (customLabel?: string) => {
    const { nodes } = get();
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'groupNode');
    if (selectedNodes.length === 0) {
      get().showToast('Select components to group');
      return;
    }

    get().saveHistory();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach((n) => {
      let x = n.position.x;
      let y = n.position.y;
      if (n.parentId) {
        const parent = nodes.find((p) => p.id === n.parentId);
        if (parent) {
          x += parent.position.x;
          y += parent.position.y;
        }
      }

      const width = (n.measured?.width || n.width || 160);
      const height = (n.measured?.height || n.height || 100);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const groupWidth = Math.max(220, (maxX - minX) + 50);
    const groupHeight = Math.max(140, (maxY - minY) + 70);
    const groupX = minX - 25;
    const groupY = minY - 45;

    const groupId = makeId('group');
    const groupLabel = customLabel || `Group (${selectedNodes.length})`;

    const groupNode: Node = {
      id: groupId,
      type: 'groupNode',
      position: { x: groupX, y: groupY },
      style: { width: groupWidth, height: groupHeight },
      selected: true,
      data: {
        label: groupLabel,
        color: 'purple',
      } as unknown as Record<string, unknown>,
    };

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const updatedNodes = nodes.map((node) => {
      if (selectedIds.has(node.id)) {
        let absX = node.position.x;
        let absY = node.position.y;
        if (node.parentId) {
          const parent = nodes.find((p) => p.id === node.parentId);
          if (parent) {
            absX += parent.position.x;
            absY += parent.position.y;
          }
        }

        return {
          ...node,
          selected: false,
          parentId: groupId,
          position: {
            x: absX - groupX,
            y: absY - groupY,
          },
          extent: 'parent' as const,
        };
      }
      return { ...node, selected: false };
    });

    set({
      nodes: [groupNode, ...updatedNodes],
      selectedNodeId: groupId,
    });

    get().showToast(`Created ${groupLabel}`);
  },

  ungroupNode: (groupId: string) => {
    const { nodes } = get();
    const groupNode = nodes.find((n) => n.id === groupId);
    if (!groupNode) return;

    get().saveHistory();

    const groupX = groupNode.position.x;
    const groupY = groupNode.position.y;

    const updatedNodes = nodes
      .filter((n) => n.id !== groupId)
      .map((node) => {
        if (node.parentId === groupId) {
          const { parentId, extent, ...rest } = node;
          return {
            ...rest,
            position: {
              x: node.position.x + groupX,
              y: node.position.y + groupY,
            },
            selected: true,
          };
        }
        return node;
      });

    set({
      nodes: updatedNodes,
      selectedNodeId: null,
    });

    get().showToast('Ungrouped selection');
  },
});
