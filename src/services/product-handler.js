import { BaseService } from "medusa-interfaces";

class ProductHandlerService extends BaseService {
    constructor({ productService, shippingProfileService }) {
        super();
        this.productService = productService;
        this.shippingProfileService = shippingProfileService;
    }
    

    async list(req, res) {
        const pricingService = req.scope.resolve("pricingService")

        const { fields, expand, is_giftcard, offset, limit, q } = req.query;
        const relations = expand.split(",");
        const select = fields.split(",");

        select.push("metadata"); // add metadata for checking is service or not

        const [rawProducts, count] = await this.productService.listAndCount(
            {
                q: q
            },
            {
                select: select,
                relations: relations,
                skip: offset,
                take: limit,
                include_discount_prices: is_giftcard || false
            }
        )

        let products = rawProducts;
        const productFiltered = [];

        const includesPricing = ["variants", "variants.prices"].every((relation) =>
            relations?.includes(relation)
        )
        if (includesPricing) {
            products = await pricingService.setProductPrices(rawProducts)
        }

        for (const product of products) {
            if (product.metadata && product.metadata.isService != true) {
                productFiltered.push(product);
            } else if (product.metadata == null) {
                productFiltered.push(product);
            }
        }

        return {
            products: productFiltered,
            count: productFiltered.length,
            offset: offset,
            limit: limit,
        }
    }
}

export default ProductHandlerService;