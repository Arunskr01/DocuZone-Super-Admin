const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

export async function fetchCustomers() {
  const res = await fetch(`${API_BASE_URL}/customers`);
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export async function createCustomer(data: any) {
  const res = await fetch(`${API_BASE_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create customer");
  return res.json();
}

export async function updateCustomer(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update customer");
  return res.json();
}

export async function deleteCustomer(id: number) {
  const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete customer");
  return res.json();
}

export async function fetchUsers(customerId: number) {
  const res = await fetch(`${API_BASE_URL}/customers/${customerId}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(data: any) {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function updateUser(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

export async function deleteUser(id: number) {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function fetchCustomerBillingSummary(customerId: number, startDate?: string, endDate?: string) {
  const url = new URL(`${API_BASE_URL}/customers/${customerId}/billing-summary`);
  if (startDate) url.searchParams.append("start_date", startDate);
  if (endDate) url.searchParams.append("end_date", endDate);
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch billing summary");
  return res.json();
}

export async function fetchModelBillingChart(modelId: number, startDate?: string, endDate?: string) {
  const url = new URL(`${API_BASE_URL}/models/${modelId}/billing-chart`);
  if (startDate) url.searchParams.append("start_date", startDate);
  if (endDate) url.searchParams.append("end_date", endDate);
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch billing chart");
  return res.json();
}

export async function loginAdmin(data: any) {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to login");
  }
  
  return res.json();
}

// --- API Keys ---

export async function fetchApiKeys(customerId: number) {
  const res = await fetch(`${API_BASE_URL}/customers/${customerId}/api-keys`);
  if (!res.ok) throw new Error("Failed to fetch API keys");
  return res.json();
}

export async function createApiKey(customerId: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/customers/${customerId}/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create API key");
  return res.json();
}

export async function updateApiKey(customerId: number, apiKeyId: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/customers/${customerId}/api-keys/${apiKeyId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update API key");
  return res.json();
}

export async function revokeApiKey(customerId: number, apiKeyId: number) {
  const res = await fetch(`${API_BASE_URL}/customers/${customerId}/api-keys/${apiKeyId}/revoke`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Failed to revoke API key");
  return res.json();
}

export async function deleteApiKey(customerId: number, apiKeyId: number) {
  const res = await fetch(`${API_BASE_URL}/customers/${customerId}/api-keys/${apiKeyId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete API key");
  return res.json();
}

// --- API Key Scopes ---

export async function fetchApiKeyScopes(apiKeyId: number) {
  const res = await fetch(`${API_BASE_URL}/api-keys/${apiKeyId}/scopes`);
  if (!res.ok) throw new Error("Failed to fetch scopes");
  return res.json();
}

export async function addApiKeyScope(apiKeyId: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/api-keys/${apiKeyId}/scopes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to add scope");
  }
  return res.json();
}

export async function deleteApiKeyScope(scopeId: number) {
  const res = await fetch(`${API_BASE_URL}/scopes/${scopeId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove scope");
  return res.json();
}

// --- Projects/Models lookup ---

export async function fetchCustomerProjectsModels(customerId: number) {
  const res = await fetch(`${API_BASE_URL}/customers/${customerId}/projects-models`);
  if (!res.ok) throw new Error("Failed to fetch projects and models");
  return res.json();
}
