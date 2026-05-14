import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import openApiDocument from './openapi/openapi.json';

/**
 * Serves Swagger UI and the raw OpenAPI document.
 */
export function setupSwagger(app: Express): void {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument as Record<string, unknown>, {
      customSiteTitle: 'Cirujar API docs',
    })
  );

  app.get('/api/docs.json', (_req, res) => {
    res.json(openApiDocument);
  });
}
