import type { ErrorObject, ValidateFunction } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

// The schemas live in packages/registry (single source of truth) and are
// bundled into the CLI at build time.
import configSchema from '../../registry/schema/config.schema.json' with { type: 'json' };
import indexSchema from '../../registry/schema/registry-index.schema.json' with { type: 'json' };
import itemSchema from '../../registry/schema/registry-item.schema.json' with { type: 'json' };

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

export const validateConfigSchema: ValidateFunction = ajv.compile(configSchema);
export const validateItemSchema: ValidateFunction = ajv.compile(itemSchema);
export const validateIndexSchema: ValidateFunction = ajv.compile(indexSchema);

export function formatSchemaErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => {
      const extra =
        error.keyword === 'additionalProperties'
          ? ` ("${String((error.params as { additionalProperty?: string }).additionalProperty)}")`
          : '';
      return `${error.instancePath || '/'} ${error.message ?? 'is invalid'}${extra}`;
    })
    .join('; ');
}
