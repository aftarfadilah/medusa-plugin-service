import { BaseService } from "medusa-interfaces";
import { getConfigFile } from "medusa-core-utils";

class ServiceHandlerService extends BaseService {
    constructor({ productService, productRepository, shippingProfileService }, options) {
        super();
        this.productService = productService;
        this.shippingProfileService = shippingProfileService;
        this.productRepository = productRepository;
        this.typeID = options.serviceId || "";
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
            let shippingProfile = await this.shippingProfileService
                .withTransaction(manager)
                .retrieveDefault()
        
            const newProduct = await this.productService
                .withTransaction(manager)
                .create({ title: title, handle: handle, metadata: metadata, profile_id: shippingProfile.id, type: { value: this.typeName } })
                return newProduct
        })
    
        const product = await this.productService.retrieve(newProduct.id, {
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
                    const getProduct = await this.productService.retrieve(x);
                    if (detailProduct) {
                        productDetailList.push(getProduct);
                    }

                    productIdFilteredList.push(x);
                } catch (error) {
                }
            }
        }

        if (productIdFilteredList.length != productIdList.length) {
            await this.productService.update(service_id, { metadata: { products: productIdFilteredList } });
        }
        
        if (detailProduct) return productDetailList;
        return productIdFilteredList;
    }

    //TODO Get all products which are services
    async list(req, res) {
        // Need more work for better find Type
        const [products] = await this.productService.listAndCount({ type_id: this.typeID }, { relations: this.defaultRelation, select: this.defaultSelection });

        for (const product of products) {
            if (product.metadata?.products.length > 0) {
                const productList = await this.filteringExistProduct(product.id, product.metadata.products, true);
                product.products = productList;
            }
            product.type = undefined;
            product.metadata = undefined;
            product.type_id = undefined;
        }

        return products;
    }

    async get(req, res) {
        const { id } = req.params;
        const [products] = await this.productService.listAndCount({ id: id }, { select: this.defaultSelection });

        for (const product of products) {
            if (product.metadata?.products.length > 0) {
                const productList = await this.filteringExistProduct(product.id, product.metadata.products, true);
                product.products = productList;
            }
            product.type = undefined;
            product.metadata = undefined;
            product.type_id = undefined;

            return product;
        }

        return {
            message: "service id not found :("
        }
    }

    //TODO Update service based on specific id
    async update(req, res) {
        const { id, products } = req.body;
        
        const serviceData = await this.productService.retrieve(id, { relations: this.defaultRelation });
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

        const updateProduct = await this.productService.update(id, updateDataQuery);

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
        const serviceData = await this.productService.retrieve(id, { relations: this.defaultRelation });
        if (serviceData.type == null || serviceData.type?.value != this.typeName) return { message: "sorry this item is not service :(" }
        
        return await this.productService.delete(id);
    }
}

export default ServiceHandlerService;