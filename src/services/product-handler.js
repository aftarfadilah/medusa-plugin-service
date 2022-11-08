import { BaseService } from "medusa-interfaces";
import { ILike } from "typeorm";

class ProductHandlerService extends BaseService {
    constructor({ manager, productService, pricingService, productRepository }) {
        super();
        this.manager_ = manager;
        this.productService_ = productService;
        this.pricingService_ = pricingService;
        this.productRepository_ = productRepository;
    }
    
    filterQuery(config) {
        config.relations = config?.expand?.split(",");
        config.select = config?.fields?.split(",");

        if (!config?.limit) {
            config.limit = 15;
        } else {
            config.limit = parseInt(config.limit);
        }

        if (!config?.offset) {
            config.offset = 0;
        } else {
            config.offset = parseInt(config.offset);
        }

        if (!config?.q) {
            config.q = "";
        }

        return config;
    }

    async list(req, res) {
        const { select, relations, is_giftcard, offset, limit, q } = this.filterQuery(req.query);
        const { products, count } = await this.listAndCount({
            q: q
        },
        {
            select: select,
            relations: relations,
            skip: offset,
            take: limit,
            include_discount_prices: is_giftcard || false
        }
        );

        return {
            products: products,
            count: count,
            offset: offset,
            limit: limit,
        }
    }

    async listAndCount( selector, config ) {
        const manager = this.manager_;
        
        const productRepo = manager.getCustomRepository(this.productRepository_);
        const [rawProducts, count] = await productRepo.findAndCount({
            where: { type_id: null, title: ILike(`%${selector?.q}%`) },
            relations: config.relations,
            select: config.select,
            take: config.take,
            skip: config.skip
        });

        let products = rawProducts;

        const includesPricing = ["variants", "variants.prices"].every((relation) =>
            config.relations?.includes(relation)
        )
        if (includesPricing) {
            products = await this.pricingService_.setProductPrices(rawProducts)
        }
    
        return { products, count };
    }
}

export default ProductHandlerService;