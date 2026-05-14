import { parseYoutubeUrl } from '../youtubeUrlParser';

describe('parseYoutubeUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/abcdEFGhijk', 'abcdEFGhijk'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=10s', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts ID from %s', (url, expected) => {
    expect(parseYoutubeUrl(url)).toBe(expected);
  });

  it.each([
    'https://example.com/watch?v=abc',
    'not a url',
    '',
    'https://youtube.com',
  ])('returns null for invalid input: %s', (url) => {
    expect(parseYoutubeUrl(url)).toBeNull();
  });
});
