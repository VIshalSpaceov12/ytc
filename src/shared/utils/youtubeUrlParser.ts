const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function parseYoutubeUrl(input: string): string | null {
  if (!input) return null;
  let url: URL;
  try { url = new URL(input); } catch { return null; }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    return ID_RE.test(id) ? id : null;
  }
  if (host !== 'youtube.com') return null;
  const v = url.searchParams.get('v');
  if (v && ID_RE.test(v)) return v;
  const shortsMatch = url.pathname.match(/^\/shorts\/([^/]+)/);
  if (shortsMatch && shortsMatch[1] && ID_RE.test(shortsMatch[1])) return shortsMatch[1];
  return null;
}

export function thumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
