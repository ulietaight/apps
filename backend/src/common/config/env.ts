import * as Joi from 'joi';

export const envValidationSchema = {
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_SCHEMA: Joi.string().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),
  HTTP_HEALTHCHECK_PORT: Joi.number().default(9090),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
};