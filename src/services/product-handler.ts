import { PricingService, Product, ProductService, ShippingProfileService } from "@medusajs/medusa";
import { BaseService } from "medusa-interfaces";
import { Request, Response } from "express";
import { IProductHandler } from "../interfaces/product-handler";
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";
import { omit } from "lodash";

class ProductHandlerService extends BaseService implements IProductHandler {
    private productService: ProductService;
    private shippingProfileService: ShippingProfileService;

    constructor({ productService, shippingProfileService }) {
        super();
        this.productService = productService;
        this.shippingProfileService = shippingProfileService;
    }
    

    async list(req: Request, res: Response) {
        const pricingService: PricingService = req.scope.resolve("pricingService")

        const { fields, expand, is_giftcard, offset, limit, q } = req.query;
        const relations = expand.split(",");
        const select = fields.split(",");

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

        let products: (Product | PricedProduct)[] = rawProducts;
        const productFiltered: (Product | PricedProduct)[] = [];

        const includesPricing = ["variants", "variants.prices"].every((relation) =>
            relations?.includes(relation)
        )
        if (includesPricing) {
            products = await pricingService.setProductPrices(rawProducts)
        }

        for (const product of products) {
            if (product.metadata && product.metadata.isService == undefined) {
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