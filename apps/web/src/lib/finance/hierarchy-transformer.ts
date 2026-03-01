/**
 * Hierarchy Data Transformer
 * 
 * Utilities for flattening and nesting hierarchical data (accounts, entities, etc.)
 */

export interface TreeNode<T = Record<string, unknown>> {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  data: T;
  children?: TreeNode<T>[];
}

export interface FlatNode<T = Record<string, unknown>> {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  data: T;
}

/**
 * Convert flat list to tree structure
 */
export function flatToTree<T = Record<string, unknown>>(
  nodes: FlatNode<T>[],
  rootId: string | null = null
): TreeNode<T>[] {
  const nodeMap = new Map<string, TreeNode<T>>();
  const roots: TreeNode<T>[] = [];

  // Create tree nodes
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      ...node,
      children: [],
    });
  });

  // Build tree structure
  nodes.forEach((node) => {
    const treeNode = nodeMap.get(node.id);
    if (!treeNode) return;
    
    if (node.parentId === rootId) {
      roots.push(treeNode);
    } else {
      const parent = node.parentId != null ? nodeMap.get(node.parentId) : undefined;
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(treeNode);
      }
    }
  });

  return roots;
}

/**
 * Convert tree to flat list (pre-order traversal)
 */
export function treeToFlat<T = Record<string, unknown>>(roots: TreeNode<T>[]): FlatNode<T>[] {
  const result: FlatNode<T>[] = [];

  function traverse(node: TreeNode<T>) {
    result.push({
      id: node.id,
      name: node.name,
      parentId: node.parentId,
      level: node.level,
      data: node.data,
    });

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  roots.forEach(traverse);
  return result;
}

/**
 * Find node by ID in tree
 */
export function findNode<T = Record<string, unknown>>(
  roots: TreeNode<T>[],
  id: string
): TreeNode<T> | null {
  for (const root of roots) {
    if (root.id === id) return root;
    
    if (root.children) {
      const found = findNode(root.children, id);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Get all ancestor IDs for a node
 */
export function getAncestors<T = Record<string, unknown>>(
  nodes: FlatNode<T>[],
  nodeId: string
): string[] {
  const ancestors: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  let current = nodeMap.get(nodeId);
  while (current && current.parentId) {
    ancestors.unshift(current.parentId);
    current = nodeMap.get(current.parentId);
  }
  
  return ancestors;
}

/**
 * Get all descendant IDs for a node
 */
export function getDescendants<T = Record<string, unknown>>(
  node: TreeNode<T>
): string[] {
  const descendants: string[] = [];
  
  function traverse(n: TreeNode<T>) {
    if (n.children) {
      n.children.forEach((child) => {
        descendants.push(child.id);
        traverse(child);
      });
    }
  }
  
  traverse(node);
  return descendants;
}

/**
 * Calculate node depth in tree
 */
export function calculateDepth<T = Record<string, unknown>>(roots: TreeNode<T>[]): number {
  let maxDepth = 0;
  
  function traverse(node: TreeNode<T>, depth: number) {
    maxDepth = Math.max(maxDepth, depth);
    if (node.children) {
      node.children.forEach(child => traverse(child, depth + 1));
    }
  }
  
  roots.forEach(root => traverse(root, 1));
  return maxDepth;
}

/**
 * Calculate total value for node including descendants
 */
export function calculateSubtotal<T extends { value: number }>(
  node: TreeNode<T>
): number {
  let total = node.data.value;
  
  if (node.children) {
    node.children.forEach((child) => {
      total += calculateSubtotal(child);
    });
  }
  
  return total;
}

/**
 * Filter tree by predicate (maintains hierarchy)
 */
export function filterTree<T = Record<string, unknown>>(
  roots: TreeNode<T>[],
  predicate: (node: TreeNode<T>) => boolean
): TreeNode<T>[] {
  const results: TreeNode<T>[] = [];
  
  for (const node of roots) {
    if (predicate(node)) {
      results.push({
        ...node,
        children: node.children ? filterTree(node.children, predicate) : undefined,
      });
    } else if (node.children) {
      // If node doesn't match but has matching children, include it
      const filteredChildren = filterTree(node.children, predicate);
      if (filteredChildren.length > 0) {
        results.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
  }
  
  return results;
}

/**
 * Sort tree nodes (maintains hierarchy)
 */
export function sortTree<T = Record<string, unknown>>(
  roots: TreeNode<T>[],
  compareFn: (a: TreeNode<T>, b: TreeNode<T>) => number
): TreeNode<T>[] {
  return roots
    .map((node) => ({
      ...node,
      children: node.children ? sortTree(node.children, compareFn) : undefined,
    }))
    .toSorted(compareFn);
}

/**
 * Convert GL account hierarchy to treemap data
 */
export interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
}

export function accountHierarchyToTreemap<T extends { name: string; value: number }>(
  roots: TreeNode<T>[]
): TreemapNode[] {
  return roots.map((node) => ({
    name: node.name,
    value: calculateSubtotal(node as TreeNode<T & { value: number }>),
    children: node.children ? accountHierarchyToTreemap(node.children as TreeNode<T>[]) : undefined,
  }));
}
