import { CreateProductDto } from '../../../product/dto/create-product.dto'

type ShopeeProductDetailForImport = {
  item_id: number
  item_sku: string
  item_name: string
  item_status: string
  price: number
  currency: string
  stock: Array<{
    seller_stock: Array<{
      location_id: string
      stock: number
    }>
  }>
  image: {
    image_url_list: string[]
  }
  description: {
    extended_description?: {
      field_list?: Array<{
        field_type: string
        text?: string
        image_info?: {
          image_id: string
          image_url: string
        }
      }>
    }
  }
}

type MappingOptions = {
  categoryId: number
  categoryName?: string | null
}

function extractDescription(item: ShopeeProductDetailForImport): string {
  if (item.description?.extended_description?.field_list) {
    return item.description.extended_description.field_list
      .map((field) => field.text || '')
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

export function mapShopeeItemToCreateProduct(
  item: ShopeeProductDetailForImport,
  options: MappingOptions,
): CreateProductDto {
  const categoryName =
    options.categoryName && options.categoryName.trim().length > 0
      ? options.categoryName.trim()
      : 'Shopee'

  const images = item.image?.image_url_list || []
  const stock = item.stock?.[0]?.seller_stock?.[0]?.stock || 0

  const product: CreateProductDto = {
    name: item.item_name,
    description: extractDescription(item),
    price: Number.isFinite(item.price) ? Number(item.price) : 0,
    category: categoryName,
    categoryId: options.categoryId,
    stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
    status: item.item_status === 'NORMAL',
    sku: item.item_sku && item.item_sku.trim().length > 0 ? item.item_sku : String(item.item_id),
    shopeeId: String(item.item_id),
    images: images,
    variations: [],
  }

  if (item.currency === 'USD') {
    product.priceUSD = product.price
  }

  return product
}

