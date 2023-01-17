import { NextFunction, Request, Response } from "express";
import { validator } from "../../utils/validator";
import { ValidatorOptions } from "class-validator";

import { omit } from "lodash";
import {
  FindConfig,
  QueryConfig,
  RequestQueryFields,
} from "@medusajs/medusa/dist/types/common";
import { BaseEntity } from "@medusajs/medusa";
import { ClassConstructor } from "@medusajs/medusa/dist/types/global";
import { removeUndefinedProperties } from "@medusajs/medusa/dist//utils";
import {
  prepareListQuery,
  prepareRetrieveQuery,
} from "@medusajs/medusa/dist/utils/get-query-config";
import { default as normalizeQuery } from "./normalized-query";

export function transformQuery<
  T extends RequestQueryFields,
  TEntity extends BaseEntity
>(
  plainToClass: ClassConstructor<T>,
  queryConfig?: QueryConfig<TEntity>,
  config: ValidatorOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      normalizeQuery()(req, res, () => void 0);
      const validated: T = await validator<T, Record<string, unknown>>(
        plainToClass,
        req.query,
        config
      );

      req.validatedQuery = validated;

      req.filterableFields = omit(validated, [
        "limit",
        "offset",
        "expand",
        "fields",
        "order",
      ]);
      req.filterableFields = removeUndefinedProperties(req.filterableFields);

      if (queryConfig?.isList) {
        req.listConfig = prepareListQuery(
          validated,
          queryConfig
        ) as FindConfig<unknown>;
      } else {
        req.retrieveConfig = prepareRetrieveQuery(
          validated,
          queryConfig
        ) as FindConfig<unknown>;
      }

      next();
    } catch (e) {
      console.error(e);
      next(e);
    }
  };
}
