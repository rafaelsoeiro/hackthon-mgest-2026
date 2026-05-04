function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === '') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  throw new Error(
    `Valor inválido para flag booleana: "${value}". Use true/false.`,
  );
}

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (!rawApiUrl || rawApiUrl.trim() === '') {
  throw new Error('VITE_API_URL é obrigatória para iniciar o frontend.');
}

export const env = {
  apiUrl: rawApiUrl.trim(),
  featureJiraEnabled: parseBoolean(
    import.meta.env.VITE_FEATURE_JIRA_ENABLED as string | undefined,
    true,
  ),
  featureAiEnabled: parseBoolean(
    import.meta.env.VITE_FEATURE_AI_ENABLED as string | undefined,
    false,
  ),
  featureEvolutionEnabled: parseBoolean(
    import.meta.env.VITE_FEATURE_EVOLUTION_ENABLED as string | undefined,
    false,
  ),
};
