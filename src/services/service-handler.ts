import { defaultAdminProductFields, defaultAdminProductRelations, Product, ProductService, ShippingProfileService } from "@medusajs/medusa";
import { BaseService } from "medusa-interfaces";
import { Request, Response } from "express";
import { EntityManager } from "typeorm";
import { IServiceHandler } from "../interfaces/service-handler";

class ServiceHandlerService extends BaseService implements IServiceHandler {
    private productService: ProductService;
    private shippingProfileService: ShippingProfileService;

    constructor({ productService, shippingProfileService }) {
        super();
        this.productService = productService;
        this.shippingProfileService = shippingProfileService;
    }

    //TODO Create new product variant which is a service
    async create(req: Request, res: Response) {
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
            select: defaultAdminProductFields,
            relations: defaultAdminProductRelations,
        })
        
        return {
            id: product.id,
            created_at: product.created_at,
            updated_at: product.updated_at,
            deleted_at: product.deleted_at,
            title: product.title,
            subtitle: product.subtitle,
            description: product.description,
            handle: product.handle,
            status: product.status
        };
    }

    private async getProductList(val: Array<string>) {
        const productIdList : Array<string> = val;
        const productList : Array<Product> = [];

        if (productIdList.length > 0) {
            for (const x of productIdList) {
                try {
                    const getProduct = await this.productService.retrieve(x);
                    productList.push(getProduct);
                } catch (error) {
                    console.log(error.type);
                }
            }
        }

        return productList;
    }

    //TODO Get all products which are services
    async list(req: Request, res: Response) {
        const [products] = await this.productService.listAndCount({}, {});
        const listService = [];
        for (const product of products) {
            if (product.metadata) {
                if (product.metadata.isService) {
                    const productList : Array<Product> = await this.getProductList(product.metadata.product as Array<string>);

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

    async get(req: Request, res: Response) {
        const { id } = req.params;
        const [products] = await this.productService.listAndCount({ id: id }, {});
        for (const product of products) {
            if (product.metadata) {
                if (product.metadata.isService) {
                    const productList : Array<Product> = await this.getProductList(product.metadata.product as Array<string>);

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
    async update(req: Request, res: Response) {
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
            updateDataQuery = {
                metadata: {
                    product: product
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
    async delete(req: Request, res: Response) {
        const { id } = req.params;
        return await this.productService.delete(id);
    }
}

export default ServiceHandlerService;