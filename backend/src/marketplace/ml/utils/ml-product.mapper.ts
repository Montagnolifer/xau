import { CreateProductDto } from '../../../product/dto/create-product.dto'

type MercadoLivreItemAttribute = {
  id: string
  name: string
  value_name: string | null
}

type MercadoLivreItemPicture = {
  id: string
  url?: string | null
  secure_url?: string | null
}

type MercadoLivreItemForImport = {
  id: string
  title: string
  price: number
  currency_id: string
  available_quantity: number
  seller_custom_field?: string | null
  description?: string | null
  attributes?: MercadoLivreItemAttribute[]
  pictures?: MercadoLivreItemPicture[]
  thumbnail?: string | null
  status: string
}

type MappingOptions = {
  categoryId: number
  categoryName?: string | null
}

function getAttributeValue(
  attributes: MercadoLivreItemAttribute[] | undefined,
  keys: string[],
): string | null {
  if (!attributes?.length) {
    return null
  }

  const normalizedKeys = keys.map((key) => key.toLowerCase())

  const attribute = attributes.find((item) => {
    const keyCandidates = [item.id, item.name].filter(
      (value): value is string => Boolean(value),
    )

    return keyCandidates.some((candidate) =>
      normalizedKeys.includes(candidate.toLowerCase()),
    )
  })

  return attribute?.value_name ?? null
}

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const sanitized = value.replace(',', '.').replace(/[^\d.-]/g, '')
  const parsed = Number.parseFloat(sanitized)

  if (Number.isNaN(parsed)) {
    return undefined
  }

  return parsed
}

export function mapMercadoLivreItemToCreateProduct(
  item: MercadoLivreItemForImport,
  options: MappingOptions,
): CreateProductDto {
  const categoryName =
    options.categoryName && options.categoryName.trim().length > 0
      ? options.categoryName.trim()
      : 'Mercado Livre'

  const imagesSet = new Set<string>()
  for (const picture of item.pictures ?? []) {
    const url = picture.secure_url ?? picture.url
    if (url) {
      imagesSet.add(url)
    }
  }

  if (item.thumbnail) {
    imagesSet.add(item.thumbnail)
  }

  const weight = parseNumber(
    getAttributeValue(item.attributes, ['WEIGHT', 'Peso', 'Peso do pacote']),
  )
  const dimensions = (() => {
    const height = getAttributeValue(item.attributes, [
      'HEIGHT',
      'Altura',
      'Altura do pacote',
    ])
    const width = getAttributeValue(item.attributes, [
      'WIDTH',
      'Largura',
      'Largura do pacote',
    ])
    const length = getAttributeValue(item.attributes, [
      'LENGTH',
      'Comprimento',
      'Comprimento do pacote',
    ])

    const formatted = [length, width, height]
      .filter((value): value is string => Boolean(value))
      .join(' x ')

    return formatted.length > 0 ? formatted : undefined
  })()

  const product: CreateProductDto = {
    name: item.title,
    description: item.description ?? '',
    price: Number.isFinite(item.price) ? Number(item.price) : 0,
    category: categoryName,
    categoryId: options.categoryId,
    stock: Number.isFinite(item.available_quantity)
      ? Math.max(0, Math.floor(item.available_quantity))
      : 0,
    status: item.status === 'active',
    sku:
      (item.seller_custom_field &&
        item.seller_custom_field.trim().length > 0 &&
        item.seller_custom_field.trim()) ||
      item.id,
    images: Array.from(imagesSet),
    variations: [],
  }

  if (item.currency_id === 'USD') {
    product.priceUSD = product.price
  }

  if (weight !== undefined) {
    product.weight = weight
  }

  if (dimensions) {
    product.dimensions = dimensions
  }

  return product
}

