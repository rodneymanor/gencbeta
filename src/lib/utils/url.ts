export function buildInternalUrl(path: string) {
  const base = process.env.VERCEL_URL // e.g. "my-app.vercel.app"
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT ?? 3000}`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
