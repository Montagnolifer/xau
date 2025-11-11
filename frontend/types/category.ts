export type CategoryTreeNode = {
  id: number
  name: string
  slug: string
  description?: string | null
  status: boolean
  parentId: number | null
  position?: number | null
  path: string[]
  createdAt: string
  updatedAt: string
  children: CategoryTreeNode[]
}

export type CategoryFlatNode = Omit<CategoryTreeNode, 'children'> & {
  depth: number
}

export type CreateCategoryPayload = {
  name: string
  slug?: string
  description?: string
  status?: boolean
  parentId?: number | null
  position?: number | null
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>

