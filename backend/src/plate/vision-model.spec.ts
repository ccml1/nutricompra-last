import {
  groqVisionModel,
  retryAfterMs,
  VisionModelError,
} from './vision-model';

const ok = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
  });
const limited = (message: string, retryAfter?: string) =>
  new Response(JSON.stringify({ error: { message } }), {
    status: 429,
    headers: retryAfter ? { 'retry-after': retryAfter } : {},
  });

describe('retryAfterMs', () => {
  it('lee la cabecera retry-after o el "try again in" del mensaje de Groq', () => {
    expect(retryAfterMs('7', '')).toBe(7000);
    expect(
      retryAfterMs(null, 'Please try again in 9.488571428s. Need more tokens?'),
    ).toBe(9489);
    expect(retryAfterMs(null, 'Rate limit reached')).toBeNull();
  });
});

describe('groqVisionModel', () => {
  it('si Groq pide esperar unos segundos, espera y reintenta una vez en vez de fallar', async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(limited('Please try again in 9.4s.'))
      .mockResolvedValueOnce(ok('{"foods": []}'));
    const sleep = jest.fn().mockResolvedValue(undefined);
    const model = groqVisionModel('key', 'qwen', { fetch, sleep });

    await expect(
      model.describe('data:image/jpeg;base64,AA', 'mira'),
    ).resolves.toBe('{"foods": []}');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(9650);
  });

  it('no espera si Groq pide demasiado tiempo ni reintenta más de una vez', async () => {
    const sleep = jest.fn().mockResolvedValue(undefined);
    const tooLong = groqVisionModel('key', 'qwen', {
      fetch: jest.fn().mockResolvedValue(limited('try again in 2m', '120')),
      sleep,
    });
    await expect(tooLong.describe('img', 'p')).rejects.toEqual(
      expect.any(VisionModelError),
    );
    expect(sleep).not.toHaveBeenCalled();

    const fetch = jest
      .fn()
      .mockImplementation(() => Promise.resolve(limited('try again in 3s')));
    const stillLimited = groqVisionModel('key', 'qwen', { fetch, sleep });
    await expect(stillLimited.describe('img', 'p')).rejects.toMatchObject({
      status: 429,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
