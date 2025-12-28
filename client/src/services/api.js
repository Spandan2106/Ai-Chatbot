export async function sendChat({ model, messages, signal }) {
  // Smart URL: Use relative path in production, localhost in development
  const isProd = import.meta.env.PROD;
  let BASE_URL = import.meta.env.VITE_API_BASE || (isProd ? "" : "http://localhost:3001");

  // Fix: If BASE_URL is just "/", clear it so we don't get "//api/chat"
  if (BASE_URL === "/") BASE_URL = "";

  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}