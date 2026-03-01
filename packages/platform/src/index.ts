/**
 * @afenda/platform — Config, structured logging, feature flags, env validation.
 *
 * Cross-cutting infrastructure. No domain logic, no DB, no HTTP framework.
 */
export {
  createLogger,
  type Logger,
  type LogLevel,
  type CreateLoggerOptions,
} from './logger.js';

// Context primitives re-exported for backward compat — canonical source is @afenda/core
export { runWithContext, getContext, type RequestContext } from '@afenda/core';
export { loadConfig, type AppConfig } from './config.js';
export { featureFlags, type FeatureFlags } from './feature-flags.js';
export {
  createJwtVerifier,
  jwtVerifierOptionsFromEnv,
  type JwtVerifier,
  type JwtVerifierOptions,
  type NeonJwtPayload,
} from './jwt.js';
