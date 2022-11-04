import { BaseService } from "medusa-interfaces";
import { ILike } from "typeorm"
class ServiceHandlerService extends BaseService {
    constructor({ manager, productService, productRepository, shippingProfileService }, options) {
        super();
        this.manager_ = manager;
        this.productService_ = productService;
        this.shippingProfileService_ = shippingProfileService;
        this.productRepository_ = productRepository;
        this.typeName = options.serviceName || "Service";
        this.defaultSelection = ["created_at", "updated_at", "deleted_at", "title", "type", "type_id", "id", "subtitle", "description", "handle", "metadata"];
        this.defaultRelation = ["type"];
        this.options = options;
    }

    //TODO Create new product variant which is a service
    async create(req, res) {
        const { title, handle } = req.body;
        const metadata = {
            products: []
        }

        const entityManager = req.scope.resolve("manager")
        const newProduct = await entityManager.transaction(async (manager) => {
            let shippingProfile = await this.shippingProfileService_
                .withTransaction(manager)
                .retrieveDefault()
        
            const newProduct = await this.productService_
                .withTransaction(manager)
                .create({ title: title, handle: handle, metadata: metadata, profile_id: shippingProfile.id, type: { value: this.typeName } })
                return newProduct
        })
    
        const product = await this.productService_.retrieve(newProduct.id, {
            relations: this.defaultRelation
        });
        
        return product;
    }

    //TODO auto remove product, if product id not exist
    async filteringExistProduct(service_id, val, detailProduct) {
        const productIdList = val.filter((item, index) => val.indexOf(item) === index); // remove duplicate id
        const productDetailList = [];
        const productIdFilteredList = [];

        if (productIdList.length > 0) {
            for (const x of productIdList) {
                try {
                    const getProduct = await this.productService_.retrieve(x);
                    if (detailProduct) {
                        productDetailList.push(getProduct);
                    }

                    productIdFilteredList.push(x);
                } catch (error) {
                }
            }
        }

        // check if there a different length then update with new products list
        if (productIdFilteredList.length != productIdList.length) {
            await this.productService_.update(service_id, { metadata: { products: productIdFilteredList } });
        }
        
        if (detailProduct) return productDetailList;
        return productIdFilteredList;
    }
    
    filterQuery(config) {

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

        if (!config?.showProductDetail) {
            config.showProductDetail = true;
        } else {
            if (parseInt(config.showProductDetail) == 0) {
                config.showProductDetail = false;
            } else {
                config.showProductDetail = true
            }
        }

        return config;
    }

    //TODO Get all products which are services
    async list(req, res) {
        const { limit, offset, q, showProductDetail } = this.filterQuery(req.query);

        const { services, count } = await this.listAndCount({ limit, offset, q });

        for (const service of services) {
            if (service.metadata?.products?.length > 0) {
                const productList = await this.filteringExistProduct(service.id, service.metadata.products, showProductDetail);
                service.products = productList;
            }

            service.type = undefined;
            service.metadata = undefined;
            service.type_id = undefined;
        }

        return {
            services: services,
            count: count,
            limit: limit,
            offset: offset
        };
    }

    async listAndCount(config) {
        const manager = this.manager_;
        const productRepo = manager.getCustomRepository(this.productRepository_);

        const services = await productRepo.find({
            relations: this.defaultRelation,
            select: this.defaultSelection,
            where: { type: { value: this.typeName }, title: ILike(`%${config.q}%`) },
            take: config.limit,
            skip: config.offset
        });

        const count = services.length;

        return { services, count };
      }

    async get(req, res) {
        const { id } = req.params;
        const { showProductDetail } = this.filterQuery(req.query);
        const [services] = await this.productService_.listAndCount({ id: id }, { select: this.defaultSelection });

        for (const service of services) {
            if (service.metadata?.products?.length > 0) {
                const productList = await this.filteringExistProduct(service.id, service.metadata.products, showProductDetail);
                service.products = productList;
            }
            service.type = undefined;
            service.metadata = undefined;
            service.type_id = undefined;

            return service;
        }

        return {
            message: "service id not found :("
        }
    }

    //TODO Update service based on specific id
    async update(req, res) {
        const { id } = req.params;
        const { products } = req.body;
        
        const serviceData = await this.productService_.retrieve(id, { relations: this.defaultRelation });
        if (serviceData.type == null || serviceData.type?.value != this.typeName) return { message: "sorry this item is not service :(" }

        const fieldList = [
            "title",
            "subtitle",
            "handle",
            "status",
            "description",
            "subtitle"
        ];

        let updateDataQuery = {}

        for (const field of fieldList) {
            if (req.body[field]) {
                updateDataQuery = {
                    [field]: req.body[field],
                    ...updateDataQuery
                }
            }
        }

        if (products) {
            const productList = await this.filteringExistProduct(id, products, false);
            updateDataQuery = {
                metadata: {
                    products: productList
                },
                ...updateDataQuery
            }
        }

        const updateProduct = await this.productService_.update(id, updateDataQuery);

        return {
            id: updateProduct.id,
            created_at: updateProduct.created_at,
            updated_at: updateProduct.updated_at,
            deleted_at: updateProduct.deleted_at,
            title: updateProduct.title,
            subtitle: updateProduct.subtitle,
            description: updateProduct.description,
            handle: updateProduct.handle,
            status: updateProduct.status,
            products: updateProduct.metadata.products
        };
    }

    //TODO Delete service based on specific id
    async delete(req, res) {
        const { id } = req.params;
        const serviceData = await this.productService_.retrieve(id, { relations: this.defaultRelation });
        if (serviceData.type == null || serviceData.type?.value != this.typeName) return { message: "sorry this item is not service :(" }
        
        return await this.productService_.delete(id);
    }
}

export default ServiceHandlerService;