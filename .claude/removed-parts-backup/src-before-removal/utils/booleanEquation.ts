import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../types/circuit';

export interface ASTNode {
  type: 'VAR' | 'CONST' | 'NOT' | 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'BUFFER' | 'ERROR';
  name?: string; // Variable name or error message
  operands?: ASTNode[];
  errorMessage?: string;
}

export interface BooleanEquationResult {
  equation: string;
  error?: string;
  ast?: ASTNode;
}

/**
 * Traverses logic network backwards from startNodeId to generate Boolean AST
 */
export function buildBooleanAST(
  startNodeId: string,
  startHandleId: string | null,
  nodesMap: Map<string, Node>,
  edgesByTarget: Map<string, Edge[]>,
  visited: Set<string> = new Set()
): ASTNode {
  // Check for circular dependency
  if (visited.has(startNodeId)) {
    return { type: 'ERROR', errorMessage: 'Circular dependency detected' };
  }

  const node = nodesMap.get(startNodeId);
  if (!node) {
    return { type: 'ERROR', errorMessage: 'Node not found' };
  }

  const data = node.data as unknown as NodeData;
  const gateType = data.gateType;

  // Next visited set for recursive paths
  const newVisited = new Set(visited);
  newVisited.add(startNodeId);

  // 1. Primary Inputs & Constants
  if (
    gateType === 'INPUT' ||
    gateType === 'CLOCK' ||
    gateType === 'PUSH_BUTTON' ||
    gateType === 'DIP_SWITCH' ||
    gateType === 'MULTI_INPUT' ||
    gateType === 'TUNNEL' ||
    gateType === 'CONST_HIGH' ||
    gateType === 'CONST_LOW'
  ) {
    if (gateType === 'CONST_HIGH') return { type: 'CONST', name: '1' };
    if (gateType === 'CONST_LOW') return { type: 'CONST', name: '0' };

    // Check for source pin alias or wire label if available
    let varName = data.label || 'In';
    
    // Clean up default labels to look nice (e.g. "Digital Input" -> "A")
    if (varName === 'Digital Input' || varName === 'Input') {
      const pinIndex = data.inputs?.findIndex(p => p.id === startHandleId) ?? 0;
      varName = String.fromCharCode(65 + (pinIndex >= 0 ? pinIndex : 0)); // A, B, C...
    }

    return { type: 'VAR', name: varName };
  }

  // 2. Logic Gates (AND, OR, NOT, NAND, NOR, XOR, XNOR, BUFFER)
  const supportedGates = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'];
  if (!supportedGates.includes(gateType)) {
    return {
      type: 'ERROR',
      errorMessage: `Unsupported component: ${data.label || gateType}`,
    };
  }

  const targetEdges = edgesByTarget.get(startNodeId) || [];
  const inputPins = data.inputs || [];

  if (inputPins.length === 0) {
    return { type: 'ERROR', errorMessage: 'No input connected' };
  }

  const operandASTs: ASTNode[] = [];

  for (let i = 0; i < inputPins.length; i++) {
    const pin = inputPins[i];
    // Find edge connected to this specific pin handle
    const edge = targetEdges.find(
      (e) => (e.targetHandle || 'in-0') === pin.id || (inputPins.length === 1 && (!e.targetHandle || e.targetHandle === 'in-0'))
    );

    if (!edge) {
      return { type: 'ERROR', errorMessage: `Unconnected input (${pin.name || `In ${i+1}`})` };
    }

    const operandAST = buildBooleanAST(edge.source, edge.sourceHandle || null, nodesMap, edgesByTarget, newVisited);
    if (operandAST.type === 'ERROR') {
      return operandAST; // Propagate error upwards
    }

    operandASTs.push(operandAST);
  }

  switch (gateType) {
    case 'BUFFER':
      return operandASTs[0] || { type: 'ERROR', errorMessage: 'Empty buffer' };
    case 'NOT':
      return { type: 'NOT', operands: [operandASTs[0]] };
    case 'AND':
      return { type: 'AND', operands: operandASTs };
    case 'OR':
      return { type: 'OR', operands: operandASTs };
    case 'NAND':
      return { type: 'NAND', operands: operandASTs };
    case 'NOR':
      return { type: 'NOR', operands: operandASTs };
    case 'XOR':
      return { type: 'XOR', operands: operandASTs };
    case 'XNOR':
      return { type: 'XNOR', operands: operandASTs };
    default:
      return { type: 'ERROR', errorMessage: `Unknown gate: ${gateType}` };
  }
}

/**
 * Precedence values for formatting
 * Higher = tighter binding
 */
const PRECEDENCE: Record<string, number> = {
  VAR: 5,
  CONST: 5,
  NOT: 4,
  AND: 3,
  NAND: 3,
  XOR: 2,
  XNOR: 2,
  OR: 1,
  NOR: 1,
};

/**
 * Formats ASTNode into clean Boolean algebraic expression string
 */
export function formatASTToString(ast: ASTNode, parentPrecedence: number = 0): string {
  if (ast.type === 'ERROR') return ast.errorMessage || 'Error';
  if (ast.type === 'VAR' || ast.type === 'CONST') return ast.name || '';

  const curPrecedence = PRECEDENCE[ast.type] || 0;
  const operands = ast.operands || [];

  let exprStr = '';

  if (ast.type === 'NOT') {
    const child = operands[0];
    if (!child) return '';
    const childStr = formatASTToString(child, PRECEDENCE.NOT);
    if (child.type === 'VAR' || child.type === 'CONST') {
      exprStr = `${childStr}'`;
    } else {
      exprStr = `(${childStr})'`;
    }
  } else if (ast.type === 'NAND') {
    const innerAST: ASTNode = { type: 'AND', operands };
    const innerStr = formatASTToString(innerAST, PRECEDENCE.AND);
    exprStr = `(${innerStr})'`;
  } else if (ast.type === 'NOR') {
    const innerAST: ASTNode = { type: 'OR', operands };
    const innerStr = formatASTToString(innerAST, PRECEDENCE.OR);
    exprStr = `(${innerStr})'`;
  } else {
    let symbol = ' · ';
    if (ast.type === 'OR') symbol = ' + ';
    else if (ast.type === 'XOR') symbol = ' ⊕ ';
    else if (ast.type === 'XNOR') symbol = ' ⊙ ';

    const formattedOperands = operands.map((op) => {
      const needParens = (PRECEDENCE[op.type] || 0) < curPrecedence;
      const str = formatASTToString(op, curPrecedence);
      return needParens ? `(${str})` : str;
    });

    exprStr = formattedOperands.join(symbol);
  }

  if (curPrecedence < parentPrecedence) {
    return `(${exprStr})`;
  }

  return exprStr;
}

/**
 * Main entry function to compute Boolean Equation for an output node
 */
export function generateBooleanEquation(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  outputVarName: string = 'F'
): BooleanEquationResult {
  // Find incoming edges to this equation generator node
  const targetEdges = edges.filter((e) => e.target === nodeId);
  if (targetEdges.length === 0) {
    return { equation: `${outputVarName} = ?`, error: 'No input connected' };
  }

  const incomingEdge = targetEdges[0]; // Primary input edge

  const nodesMap = new Map<string, Node>();
  nodes.forEach((n) => nodesMap.set(n.id, n));

  const edgesByTarget = new Map<string, Edge[]>();
  edges.forEach((e) => {
    const list = edgesByTarget.get(e.target) || [];
    list.push(e);
    edgesByTarget.set(e.target, list);
  });

  const ast = buildBooleanAST(incomingEdge.source, incomingEdge.sourceHandle || null, nodesMap, edgesByTarget);

  if (ast.type === 'ERROR') {
    return {
      equation: `${outputVarName} = ?`,
      error: ast.errorMessage,
      ast,
    };
  }

  const expressionStr = formatASTToString(ast);
  return {
    equation: `${outputVarName} = ${expressionStr}`,
    ast,
  };
}
