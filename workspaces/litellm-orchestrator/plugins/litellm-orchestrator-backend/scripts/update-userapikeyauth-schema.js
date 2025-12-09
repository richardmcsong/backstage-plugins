#!/usr/bin/env node
/**
 * Script to update the UserAPIKeyAuth schema from upstream LiteLLM OpenAPI spec
 *
 * This script fetches the upstream schema, extracts UserAPIKeyAuth, and updates
 * the local openapi.yaml file to keep it in sync.
 *
 * Usage:
 *   node scripts/update-userapikeyauth-schema.js [upstream-url]
 *
 * Environment variables:
 *   UPSTREAM_URL - URL to fetch the upstream OpenAPI schema from
 *                  (default: https://litellm-api.up.railway.app/openapi.json)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const UPSTREAM_URL =
  process.env.UPSTREAM_URL ||
  process.argv[2] ||
  'https://litellm-api.up.railway.app/openapi.json';
const PLUGIN_DIR = path.resolve(__dirname, '..');
const SCHEMA_DIR = path.join(PLUGIN_DIR, 'src', 'schema');
const OPENAPI_YAML_PATH = path.join(SCHEMA_DIR, 'openapi.yaml');
const BACKUP_PATH = `${OPENAPI_YAML_PATH}.bak`;

// Simple YAML parser/writer (basic implementation)
function parseYAML(content) {
  const yaml = require('yaml');
  return yaml.parse(content);
}

function stringifyYAML(obj) {
  const yaml = require('yaml');
  return yaml.stringify(obj, {
    defaultStringType: 'PLAIN',
    lineWidth: 120,
    minContentWidth: 0,
    indent: 2,
    simpleKeys: false,
    doubleQuotedAsJSON: false,
    quoteKeys: false,
  });
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(url, res => {
      if (res.statusCode !== 200) {
        reject(
          new Error(`Failed to fetch: ${res.statusCode} ${res.statusMessage}`),
        );
        return;
      }

      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function simplifySchemaRefs(schema) {
  // Recursively replace $ref references to schemas we don't have
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(item => simplifySchemaRefs(item));
  }

  // Check if this is an object with a $ref property
  if (schema.$ref && typeof schema.$ref === 'string') {
    // Handle anyOf arrays that contain $ref
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
      // Process anyOf array, replacing $ref items
      const processedAnyOf = schema.anyOf.map(item => {
        if (item && item.$ref && typeof item.$ref === 'string') {
          if (
            item.$ref.includes('LiteLLM_ObjectPermissionTable') ||
            item.$ref.includes('Member')
          ) {
            return { additionalProperties: true, type: 'object' };
          }
          if (item.$ref.includes('LitellmUserRoles')) {
            return { type: 'string' };
          }
        }
        return simplifySchemaRefs(item);
      });
      return { ...schema, anyOf: processedAnyOf };
    }

    // Replace references to schemas we don't have with generic types
    if (
      schema.$ref.includes('LiteLLM_ObjectPermissionTable') ||
      schema.$ref.includes('Member')
    ) {
      // Replace with generic object
      return {
        additionalProperties: true,
        type: 'object',
      };
    }
    if (schema.$ref.includes('LitellmUserRoles')) {
      // Replace with string type
      return {
        type: 'string',
      };
    }
    // Keep other references as-is (they might be local)
    return schema;
  }

  // Process all properties recursively
  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    result[key] = simplifySchemaRefs(value);
  }

  return result;
}

async function main() {
  console.log('🔄 Updating UserAPIKeyAuth schema from upstream...');
  console.log(`   Source: ${UPSTREAM_URL}`);
  console.log(`   Target: ${OPENAPI_YAML_PATH}`);
  console.log('');

  // Check if yaml package is available
  let yaml;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    yaml = require('yaml');
  } catch (e) {
    console.error('❌ Error: yaml package is required');
    console.error('   Install with: npm install --save-dev yaml');
    console.error('   Or use: yarn add -D yaml');
    process.exit(1);
  }

  // Fetch upstream schema
  console.log('📥 Fetching upstream OpenAPI schema...');
  let upstreamSchema;
  try {
    upstreamSchema = await fetchJSON(UPSTREAM_URL);
  } catch (error) {
    console.error(
      `❌ Error: Failed to fetch upstream schema: ${error.message}`,
    );
    process.exit(1);
  }

  // Extract UserAPIKeyAuth schema
  console.log('🔍 Extracting UserAPIKeyAuth schema...');
  if (!upstreamSchema.components?.schemas?.UserAPIKeyAuth) {
    console.error(
      '❌ Error: UserAPIKeyAuth schema not found in upstream schema',
    );
    process.exit(1);
  }

  let userAPIKeyAuthSchema = upstreamSchema.components.schemas.UserAPIKeyAuth;

  // Simplify nested $ref references
  console.log('🔧 Simplifying nested references...');
  userAPIKeyAuthSchema = simplifySchemaRefs(userAPIKeyAuthSchema);

  // Read current openapi.yaml
  console.log('📝 Reading current openapi.yaml...');
  let openapiSpec;
  try {
    const content = fs.readFileSync(OPENAPI_YAML_PATH, 'utf8');
    openapiSpec = parseYAML(content);
  } catch (error) {
    console.error(`❌ Error: Failed to read openapi.yaml: ${error.message}`);
    process.exit(1);
  }

  // Create backup
  console.log('💾 Creating backup...');
  fs.copyFileSync(OPENAPI_YAML_PATH, BACKUP_PATH);

  // Update the schema
  if (!openapiSpec.components) {
    openapiSpec.components = {};
  }
  if (!openapiSpec.components.schemas) {
    openapiSpec.components.schemas = {};
  }

  openapiSpec.components.schemas.UserAPIKeyAuth = userAPIKeyAuthSchema;

  // Ensure UserKeyList references the local schema
  if (openapiSpec.components.schemas.UserKeyList) {
    const userKeyList = openapiSpec.components.schemas.UserKeyList;
    if (userKeyList.properties?.keys?.items) {
      userKeyList.properties.keys.items = {
        $ref: '#/components/schemas/UserAPIKeyAuth',
      };
    }
  }

  // Write back the updated YAML
  console.log('💾 Writing updated openapi.yaml...');
  try {
    const yamlContent = stringifyYAML(openapiSpec);

    // Verify the content includes UserAPIKeyAuth before writing
    if (!yamlContent.includes('UserAPIKeyAuth')) {
      console.error('❌ Error: Generated YAML does not contain UserAPIKeyAuth');
      console.error(
        '   This might indicate a problem with the schema structure',
      );
      process.exit(1);
    }

    fs.writeFileSync(OPENAPI_YAML_PATH, yamlContent, 'utf8');
  } catch (error) {
    console.error(`❌ Error: Failed to write openapi.yaml: ${error.message}`);
    console.error('   Stack:', error.stack);
    console.log('🔄 Restoring backup...');
    fs.copyFileSync(BACKUP_PATH, OPENAPI_YAML_PATH);
    process.exit(1);
  }

  // Verify the update by parsing the YAML back
  console.log('✅ Verifying update...');
  let verifiedSpec;
  try {
    const updatedContent = fs.readFileSync(OPENAPI_YAML_PATH, 'utf8');
    verifiedSpec = parseYAML(updatedContent);

    if (!verifiedSpec.components?.schemas?.UserAPIKeyAuth) {
      console.error(
        '❌ Error: UserAPIKeyAuth schema not found in updated openapi.yaml',
      );
      console.log('🔄 Restoring backup...');
      fs.copyFileSync(BACKUP_PATH, OPENAPI_YAML_PATH);
      process.exit(1);
    }

    // Also verify the UserKeyList reference
    if (
      verifiedSpec.components?.schemas?.UserKeyList?.properties?.keys?.items
        ?.$ref !== '#/components/schemas/UserAPIKeyAuth'
    ) {
      console.warn('⚠️  Warning: UserKeyList reference might not be correct');
    }
  } catch (error) {
    console.error(`❌ Error: Failed to verify updated YAML: ${error.message}`);
    console.log('🔄 Restoring backup...');
    fs.copyFileSync(BACKUP_PATH, OPENAPI_YAML_PATH);
    process.exit(1);
  }

  console.log('✅ Successfully updated UserAPIKeyAuth schema in openapi.yaml');
  console.log('');
  console.log('📋 Next steps:');
  console.log(`   1. Review the changes: git diff ${OPENAPI_YAML_PATH}`);
  console.log(`   2. Regenerate the router: cd ${PLUGIN_DIR} && yarn build`);
  console.log(`   3. Test the changes: yarn test`);
  console.log('');
  console.log('💡 Tip: You can restore the backup with:');
  console.log(`   mv ${BACKUP_PATH} ${OPENAPI_YAML_PATH}`);
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
