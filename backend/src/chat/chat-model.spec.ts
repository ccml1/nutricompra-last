import { chatModelConfig, groqChatModel } from './chat-model';

describe('chatModelConfig', () => {
  it('con GROQ_API_KEY usa Groq (plan gratuito) con el modelo abierto openai/gpt-oss-20b', () => {
    expect(
      chatModelConfig({ GROQ_API_KEY: ' gsk_clave ', HF_TOKEN: 'hf_token' }),
    ).toEqual({
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
    expect(
      chatModelConfig({ HF_TOKEN: 'hf_token', HF_CHAT_MODEL: 'Qwen/Qwen3-32B' })
        ?.model,
    ).toBe('Qwen/Qwen3-32B');
  });

  it('sin ninguna clave no hay modelo', () => {
    expect(chatModelConfig({})).toBeNull();
    expect(chatModelConfig({ GROQ_API_KEY: '  ', HF_TOKEN: '' })).toBeNull();
  });
});

describe('groqChatModel', () => {
  /** Respuesta en streaming como la manda Groq: eventos SSE partidos en trozos arbitrarios. */
  const sse = (...chunks: string[]) =>
    new Response(
      new ReadableStream({
        start(controller) {
          for (const chunk of chunks)
            controller.enqueue(new TextEncoder().encode(chunk));
          controller.close();
        },
      }),
      { status: 200 },
    );

  it('llama a Groq directo y devuelve el texto a medida que llega', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        sse(
          'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\ndata: {"choices":[{"delta":{"content":"Hola"}}]}\n\nda',
          'ta: {"choices":[{"delta":{"content":", familia"}}]}\n\ndata: [DONE]\n\n',
        ),
      );
    const model = groqChatModel(
      { token: 'gsk', provider: 'groq', model: 'openai/gpt-oss-20b' },
      fetchMock,
    );

    const parts: string[] = [];
    for await (const text of model.stream([{ role: 'user', content: 'hola' }]))
      parts.push(text);

    expect(parts.join('')).toBe('Hola, familia');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.groq.com/openai/v1/chat/completions',
    );
    expect(body).toMatchObject({
      model: 'openai/gpt-oss-20b',
      stream: true,
      reasoning_effort: 'low',
    });
  });

  it('si Groq falla, lanza un error con el código', async () => {
    const model = groqChatModel(
      { token: 'gsk', provider: 'groq', model: 'openai/gpt-oss-20b' },
      jest
        .fn()
        .mockResolvedValue(new Response('rate limited', { status: 429 })),
    );
    const read = async () => {
      for await (const _ of model.stream([{ role: 'user', content: 'hola' }]))
        void _;
    };
    await expect(read()).rejects.toThrow('Groq respondió 429');
  });
});
