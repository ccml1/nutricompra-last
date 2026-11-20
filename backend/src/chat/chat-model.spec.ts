import { chatModelConfig } from './chat-model';

describe('chatModelConfig', () => {
  it('con GROQ_API_KEY usa Groq (plan gratuito) con el modelo abierto openai/gpt-oss-20b', () => {
    expect(chatModelConfig({ GROQ_API_KEY: ' gsk_clave ', HF_TOKEN: 'hf_token' })).toEqual({
      token: 'gsk_clave',
      provider: 'groq',
      model: 'openai/gpt-oss-20b',
    });
  });

  it('sin Groq usa Hugging Face Inference Providers con HF_TOKEN; HF_CHAT_MODEL cambia el modelo', () => {
    expect(chatModelConfig({ HF_TOKEN: 'hf_token' })).toEqual({
      token: 'hf_token',
      provider: 'auto',
      model: 'Qwen/Qwen2.5-72B-Instruct',
    });
    expect(chatModelConfig({ HF_TOKEN: 'hf_token', HF_CHAT_MODEL: 'Qwen/Qwen3-32B' })?.model).toBe('Qwen/Qwen3-32B');
  });

  it('sin ninguna clave no hay modelo', () => {
    expect(chatModelConfig({})).toBeNull();
    expect(chatModelConfig({ GROQ_API_KEY: '  ', HF_TOKEN: '' })).toBeNull();
  });
});
