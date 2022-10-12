import {BaseService} from "medusa-interfaces";

class ServiceService extends BaseService {
    constructor({productService}) {
        super();

        this.productService_ = productService
    }

    async createNewService() {
        //TODO Create new product variant which is a service

        // const [product] = await this.productService_.list({}, { take: 1 })

        return `Welcome to!`
    }

    //TODO Get all products which are services
    async getAllServices() {

        // const [product] = await this.productService_.list({}, { take: 1 })

        return `Welcome to!`
    }

    //TODO Update service based on specific id
    async updateService() {

        // const [product] = await this.productService_.list({}, { take: 1 })

        return `Welcome to!`
    }

    //TODO Delete service based on specific id
    async deleteService() {

        // const [product] = await this.productService_.list({}, { take: 1 })

        return `Welcome to!`
    }
}

export default ServiceService;