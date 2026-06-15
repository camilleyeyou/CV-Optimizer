// Mocks for the module-scope Supabase client and the OpenAI client used by
// atsService. Declared before requiring the module so the mocks are in place.
const mockSingle = jest.fn();
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockCreate = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      upsert: mockUpsert,
    }),
  }),
}));

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
);

const atsService = require('../src/services/atsService');

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
});

describe('extractKeywordsLLM', () => {
  test('empty JD returns null without any network call', async () => {
    const result = await atsService.extractKeywordsLLM('');
    expect(result).toBeNull();
    expect(mockSingle).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('cache hit returns stored keywords and does NOT call the model', async () => {
    mockSingle.mockResolvedValue({ data: { keywords: ['react', 'aws'] }, error: null });

    const result = await atsService.extractKeywordsLLM('Need React and AWS experience.');

    expect(result).toEqual(['react', 'aws']);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  test('cache miss extracts via LLM, normalizes (trim/lowercase/dedupe), and caches', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ keywords: ['React', 'react', '  AWS ', 'TypeScript'] }) } }],
    });

    const result = await atsService.extractKeywordsLLM('Some job description');

    expect(result).toEqual(['react', 'aws', 'typescript']);
    // temperature 0 + json mode
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      temperature: 0,
      response_format: { type: 'json_object' },
    }));
    // persisted under a stable hash for reproducibility
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ keywords: ['react', 'aws', 'typescript'], jd_hash: expect.any(String) }),
      { onConflict: 'jd_hash' }
    );
  });

  test('same JD yields the same jd_hash (deterministic cache key)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ keywords: ['python'] }) } }],
    });

    await atsService.extractKeywordsLLM('Identical JD text');
    await atsService.extractKeywordsLLM('Identical JD text');

    const hash1 = mockUpsert.mock.calls[0][0].jd_hash;
    const hash2 = mockUpsert.mock.calls[1][0].jd_hash;
    expect(hash1).toBe(hash2);
  });

  test('LLM failure falls back to null (engine uses built-in extractor), no crash', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    mockCreate.mockRejectedValue(new Error('model exploded'));

    const result = await atsService.extractKeywordsLLM('A job description');
    expect(result).toBeNull();
  });

  test('cache read failure does not crash; still extracts', async () => {
    mockSingle.mockRejectedValue(new Error('db down'));
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ keywords: ['sql'] }) } }],
    });

    const result = await atsService.extractKeywordsLLM('JD');
    expect(result).toEqual(['sql']);
  });
});
