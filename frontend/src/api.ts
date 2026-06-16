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

