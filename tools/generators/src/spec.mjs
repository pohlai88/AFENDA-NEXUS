#!/usr/bin/env node
/**
 * @generated — do not edit manually
 * Feature spec builder, validator, and loader.
 *
 * The feature.spec.json is the single source of truth (SSOT) for all generators.
 * CLI flags populate the spec; generators never read CLI flags directly.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readJson, toKebab, toPascal, toCamel, toSnake } from './utils.mjs';

// ─── JSON Schema Validation (lightweight, no external deps) ──────────────────

const SCHEMA_PATH = join(dirname(new URL(import.meta.url).pathname), '..', 'feature.spec.schema.json');

/**
 * Validate a spec object against required fields. Returns an array of error strings.
 * Uses structural checks (no Ajv dependency — keeps generators zero-dep).
 *
 * @param {object} spec
 * @returns {string[]} errors
 */
export function validateSpec(spec) {
  const errors = [];

  if (!spec || typeof spec !== 'object') {
    return ['Spec must be a non-null object'];
  }

  // Required top-level fields
  if (!spec.module || typeof spec.module !== 'string') {
    errors.push('spec.module is required (lowercase string, e.g. "finance")');
  } else if (!/^[a-z][a-z0-9-]*$/.test(spec.module)) {
    errors.push(`spec.module "${spec.module}" must be lowercase kebab (e.g. "finance")`);
  }

  if (!spec.slice || typeof spec.slice !== 'string') {
    errors.push('spec.slice is required (lowercase string, e.g. "ar")');
  } else if (!/^[a-z][a-z0-9-]*$/.test(spec.slice)) {
    errors.push(`spec.slice "${spec.slice}" must be lowercase kebab (e.g. "ar")`);
  }

  // Entity block
  if (!spec.entity || typeof spec.entity !== 'object') {
    errors.push('spec.entity is required');
  } else {
    const e = spec.entity;
    if (!e.name || !/^[A-Z][a-zA-Z0-9]*$/.test(e.name)) {
      errors.push(`spec.entity.name "${e.name}" must be PascalCase (e.g. "ArInvoice")`);
    }
    if (!e.table || !/^[a-z][a-z0-9_]*$/.test(e.table)) {
      errors.push(`spec.entity.table "${e.table}" must be snake_case (e.g. "ar_invoice")`);
    }
    if (!Array.isArray(e.statuses) || e.statuses.length === 0) {
      errors.push('spec.entity.statuses must be a non-empty array of SCREAMING_SNAKE strings');
    } else {
      for (const s of e.statuses) {
        if (!/^[A-Z][A-Z0-9_]*$/.test(s)) {
          errors.push(`spec.entity.statuses contains invalid value "${s}" (must be SCREAMING_SNAKE)`);
        }
      }
    }
    if (e.idBrand && !/^[A-Z][a-zA-Z0-9]*Id$/.test(e.idBrand)) {
      errors.push(`spec.entity.idBrand "${e.idBrand}" must end with "Id" and be PascalCase`);
    }
    if (e.moneyFields && !Array.isArray(e.moneyFields)) {
      errors.push('spec.entity.moneyFields must be an array of camelCase strings');
    }
    if (e.refs && !Array.isArray(e.refs)) {
      errors.push('spec.entity.refs must be an array');
    } else if (e.refs) {
      for (const ref of e.refs) {
        if (!ref.field) errors.push('Each ref must have a "field" property');
        if (!ref.entity) errors.push('Each ref must have an "entity" property');
      }
    }
  }

  // Commands (optional)
  if (spec.commands) {
    if (!Array.isArray(spec.commands)) {
      errors.push('spec.commands must be an array');
    } else {
      for (let i = 0; i < spec.commands.length; i++) {
        const cmd = spec.commands[i];
        if (!cmd.name) errors.push(`spec.commands[${i}].name is required`);
        if (!cmd.service) errors.push(`spec.commands[${i}].service is required`);
        if (!cmd.route) errors.push(`spec.commands[${i}].route is required`);
      }
    }
  }

  // Frontend (optional but validated if present)
  if (spec.frontend) {
    const fe = spec.frontend;
    if (!fe.routeGroup) errors.push('spec.frontend.routeGroup is required when frontend is specified');
    if (!fe.featureKey) errors.push('spec.frontend.featureKey is required when frontend is specified');
    if (!fe.featureDir) errors.push('spec.frontend.featureDir is required when frontend is specified');
  }

  return errors;
}

// ─── Spec Builder (CLI args → spec object) ───────────────────────────────────

/**
 * Build a feature spec from CLI arguments.
 *
 * @param {object} args Parsed CLI args
 * @param {string} args.module
 * @param {string} args.slice
 * @param {string} args.entity     PascalCase entity name
 * @param {string} [args.statuses] Comma-separated SCREAMING_SNAKE statuses
 * @param {string} [args.moneyFields] Comma-separated camelCase field names
 * @param {string} [args.commands]  Comma-separated "verb:serviceName" pairs
 * @param {boolean} [args.frontend] Include frontend scaffold
 * @param {string} [args.featureDir] Frontend feature directory
 * @param {boolean} [args.contracts] Include contracts (default true)
 * @param {boolean} [args.migration] Include migration (default true)
 * @returns {object} feature spec
 */
export function buildSpec(args) {
  const entityName = toPascal(args.entity);
  const kebabEntity = toKebab(entityName);
  const snakeEntity = toSnake(entityName);

  const spec = {
    module: args.module,
    slice: args.slice,
    entity: {
      name: entityName,
      table: snakeEntity,
      idBrand: `${entityName}Id`,
      statuses: (args.statuses || 'DRAFT,ACTIVE,CANCELLED')
        .split(',')
        .map((s) => s.trim().toUpperCase()),
      moneyFields: args.moneyFields
        ? args.moneyFields.split(',').map((s) => s.trim())
        : [],
      refs: [],
      extraFields: [],
    },
    commands: [],
    contracts: args.contracts !== false,
    migration: args.migration !== false,
  };

  // Parse commands: "post:postArInvoice,approve:approveArInvoice"
  if (args.commands) {
    spec.commands = args.commands.split(',').map((pair) => {
      const [verb, service] = pair.split(':').map((s) => s.trim());
      const serviceName = service || `${toCamel(verb)}${entityName}`;
      return {
        name: verb,
        service: serviceName,
        route: `POST /${args.slice}/${kebabEntity}s/:id/${verb}`,
        idempotent: ['post', 'execute', 'reverse', 'void'].includes(verb),
      };
    });
  }

  // Frontend config
  if (args.frontend) {
    const featureDir = args.featureDir || args.slice;
    spec.frontend = {
      routeGroup: `/finance/${featureDir}/${kebabEntity}s`,
      featureKey: kebabEntity,
      featureDir,
    };
  }

  return spec;
}

// ─── Spec I/O ────────────────────────────────────────────────────────────────

/**
 * Load a feature spec from a JSON file. Validates and returns the spec.
 * Throws if validation fails.
 *
 * @param {string} specPath  Absolute path to feature.spec.json
 * @returns {object} validated spec
 */
export function loadSpec(specPath) {
  if (!existsSync(specPath)) {
    throw new Error(`Spec file not found: ${specPath}`);
  }

  const spec = readJson(specPath);
  const errors = validateSpec(spec);
  if (errors.length > 0) {
    throw new Error(`Invalid feature spec:\n  - ${errors.join('\n  - ')}`);
  }

  // Apply defaults
  spec.entity.idBrand = spec.entity.idBrand || `${spec.entity.name}Id`;
  spec.entity.moneyFields = spec.entity.moneyFields || [];
  spec.entity.refs = spec.entity.refs || [];
  spec.entity.extraFields = spec.entity.extraFields || [];
  spec.commands = spec.commands || [];
  spec.contracts = spec.contracts !== false;
  spec.migration = spec.migration !== false;

  return spec;
}

/**
 * Write a spec to disk as JSON.
 *
 * @param {object} spec      Validated spec object
 * @param {string} outputDir Directory to write feature.spec.json into
 * @returns {string} absolute path of written file
 */
export function writeSpec(spec, outputDir) {
  const content = JSON.stringify(spec, null, 2);
  const filePath = join(outputDir, 'feature.spec.json');
  writeFileSync(filePath, content.replace(/\r\n/g, '\n') + '\n', 'utf-8');
  return filePath;
}

// ─── CLI Argument Parser ─────────────────────────────────────────────────────

/**
 * Parse process.argv into a structured args object.
 * Supports: --key value, --key=value, --flag (boolean true)
 *
 * @param {string[]} argv  process.argv.slice(2) or equivalent
 * @returns {{ _positional: string[], [key: string]: string|boolean }}
 */
export function parseArgs(argv) {
  const args = { _positional: [] };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        // --key=value
        const key = arg.slice(2, eqIdx);
        args[key] = arg.slice(eqIdx + 1);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        // --key value
        args[arg.slice(2)] = argv[i + 1];
        i++;
      } else {
        // --flag (boolean)
        args[arg.slice(2)] = true;
      }
    } else {
      args._positional.push(arg);
    }
    i++;
  }
  return args;
}
