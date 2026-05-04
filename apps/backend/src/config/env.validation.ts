type EnvShape = Record<string, string | undefined>;

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === '') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  throw new Error(
    `Valor inválido para variável booleana: "${value}". Use true/false.`,
  );
}

function requireWhenEnabled(
  errors: string[],
  enabled: boolean,
  value: string | undefined,
  name: string,
) {
  if (enabled && (!value || value.trim() === '')) {
    errors.push(
      `${name} é obrigatória quando a feature correspondente está habilitada.`,
    );
  }
}

export function validateEnvironment(env: EnvShape): EnvShape {
  const errors: string[] = [];

  const featureJiraEnabled = parseBoolean(env.FEATURE_JIRA_ENABLED, true);
  const featureAiEnabled = parseBoolean(env.FEATURE_AI_ENABLED, false);
  const featureEvolutionEnabled = parseBoolean(env.FEATURE_EVOLUTION_ENABLED, false);

  if (!env.DATABASE_URL?.trim()) {
    errors.push('DATABASE_URL é obrigatória.');
  }
  if (!env.REDIS_URL?.trim()) {
    errors.push('REDIS_URL é obrigatória.');
  }

  requireWhenEnabled(errors, featureJiraEnabled, env.JIRA_BASE_URL, 'JIRA_BASE_URL');
  requireWhenEnabled(errors, featureJiraEnabled, env.JIRA_EMAIL, 'JIRA_EMAIL');
  requireWhenEnabled(errors, featureJiraEnabled, env.JIRA_API_TOKEN, 'JIRA_API_TOKEN');
  requireWhenEnabled(
    errors,
    featureJiraEnabled,
    env.JIRA_PROJECT_KEY,
    'JIRA_PROJECT_KEY',
  );

  requireWhenEnabled(
    errors,
    featureAiEnabled,
    env.ANTHROPIC_API_KEY,
    'ANTHROPIC_API_KEY',
  );

  requireWhenEnabled(
    errors,
    featureEvolutionEnabled,
    env.EVOLUTION_API_URL,
    'EVOLUTION_API_URL',
  );
  requireWhenEnabled(
    errors,
    featureEvolutionEnabled,
    env.EVOLUTION_API_KEY,
    'EVOLUTION_API_KEY',
  );
  requireWhenEnabled(
    errors,
    featureEvolutionEnabled,
    env.WEBHOOK_SECRET,
    'WEBHOOK_SECRET',
  );

  const portValue = env.PORT?.trim();
  if (portValue && Number.isNaN(Number(portValue))) {
    errors.push('PORT deve ser numérica.');
  }

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.join(' ')}`);
  }

  return {
    ...env,
    FEATURE_JIRA_ENABLED: String(featureJiraEnabled),
    FEATURE_AI_ENABLED: String(featureAiEnabled),
    FEATURE_EVOLUTION_ENABLED: String(featureEvolutionEnabled),
    PORT: env.PORT?.trim() || '3000',
  };
}

export function isFeatureEnabled(
  value: string | undefined,
  defaultValue = false,
): boolean {
  return parseBoolean(value, defaultValue);
}
