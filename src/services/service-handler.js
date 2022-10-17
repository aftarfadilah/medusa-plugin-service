import { BaseService } from "medusa-interfaces";

class ServiceHandlerService extends BaseService {
    constructor({ productService, shippingProfileService }) {
        super();
        this.productService = productService;
        this.shippingProfileService = shippingProfileService;
    }

    //TODO Create new product variant which is a service
    async create(req, res) {
        const { title, handle } = req.body;
        const metadata = {
            isService: true,
            product: []
        }

        const entityManager = req.scope.resolve("manager")

        const newProduct = await entityManager.transaction(async (manager) => {

        let shippingProfile = await this.shippingProfileService
            .withTransaction(manager)
            .retrieveDefault()
    
        const newProduct = await this.productService
            .withTransaction(manager)
            .create({ title: title, handle: handle, metadata: metadata, profile_id: shippingProfile.id })
            return newProduct
        })
    
        const product = await this.productService.retrieve(newProduct.id, {
            select: ["created_at", "updated_at", "deleted_at", "title", "subtitle", "description", "handle"],
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
            await this.productService.update(service_id, { metadata: { product: productIdFilteredList } });
        }
        
        if (detailProduct) return productDetailList;
        return productIdFilteredList;
    }

    //TODO Get all products which are services
    async list(req, res) {
        const [products] = await this.productService.listAndCount({}, {});
        const listService = [];
        for (const product of products) {
            if (product.metadata) {
                if (product.metadata.isService) {
                    const productList = await this.filteringExistProduct(product.id, product.metadata.product, true);

                    listService.push({
                        id: product.id,
                        created_at: product.created_at,
                        updated_at: product.updated_at,
                        deleted_at: product.deleted_at,
                        title: product.title,
                        subtitle: product.subtitle,
                        description: product.description,
                        handle: product.handle,
                        status: product.status,
                        product: productList
                    });
                }
            }
        }
        return listService;
    }

    async get(req, res) {
        const { id } = req.params;
        const [products] = await this.productService.listAndCount({ id: id }, {});
        for (const product of products) {
            if (product.metadata) {
                if (product.metadata.isService) {
                    const productList = await this.filteringExistProduct(product.id, product.metadata.product, true);

                    return {
                        id: product.id,
                        created_at: product.created_at,
                        updated_at: product.updated_at,
                        deleted_at: product.deleted_at,
                        title: product.title,
                        subtitle: product.subtitle,
                        description: product.description,
                        handle: product.handle,
                        status: product.status,
                        product: productList
                    };
                }
            }
        }
        return {
            error: "service not found :("
        }
    }

    //TODO Update service based on specific id
    async update(req, res) {
        const { id, product } = req.body;
        
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

        if (product) {
            const productList = await this.filteringExistProduct(id, product, false);
            updateDataQuery = {
                metadata: {
                    product: productList
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
            product: updateProduct.metadata.product
        };
    }

    //TODO Delete service based on specific id
    async delete(req, res) {
        const { id } = req.params;
        return await this.productService.delete(id);
    }
}

export default ServiceHandlerService;