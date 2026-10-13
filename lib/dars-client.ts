export async function darsRequest<T>(url: string, body?: unknown): Promise<T> {
  const token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token");
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "So‘rov bajarilmadi");
  return data as T;
}
