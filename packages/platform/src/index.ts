/**
 * @afenda/platform — Config, structured logging, feature flags, env validation.
 *
 * Cross-cutting infrastructure. No domain logic, no DB, no HTTP framework.
 */
export {
  createLogger,
  runWithContext,
  getContext,
  type Logger,
  type LogLevel,
  type CreateLoggerOptions,
  type RequestContext,
} from './logger.js';
export { loadConfig, type AppConfig } from './config.js';
export { featureFlags, type FeatureFlags } from './feature-flags.js';
export {
  createJwtVerifier,
  jwtVerifierOptionsFromEnv,
  type JwtVerifier,
  type JwtVerifierOptions,
  type NeonJwtPayload,
} from './jwt.js';
