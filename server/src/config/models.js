// Central OpenAI model configuration. Override via env vars to change the model
// everywhere with no code edits. Verify exact model IDs in the OpenAI dashboard.
module.exports = {
  DEFAULT: process.env.OPENAI_MODEL_DEFAULT || 'gpt-5.4-mini',
  PREMIUM: process.env.OPENAI_MODEL_PREMIUM || 'gpt-5.4',
};
