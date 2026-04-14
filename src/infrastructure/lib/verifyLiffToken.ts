"use server";
// Verifies a LINE access token issued by LIFF and returns the userId.
export async function verifyLiffToken(accessToken: string): Promise<string> {
  const res = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error('LINE verify response:', JSON.stringify(data));
    throw new Error('Invalid LIFF token');
  }

  const data = await res.json();
  if (!data.userId) throw new Error('Invalid LIFF token');
  return data.userId as string;
}
