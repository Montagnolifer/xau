export interface CategoryTreeNode {
  id: number
  name: string
  slug: string
  description: string | null
  status: boolean
  parentId: number | null
  position: number | null
  createdAt: Date
  updatedAt: Date
  path: string[]
  children: CategoryTreeNode[]
}

export type CategoryFlatNode = Omit<CategoryTreeNode, 'children'> & {
  depth: number
}

