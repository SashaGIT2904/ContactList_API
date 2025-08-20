// URL base de la API y el "slug" de tu agenda
export const API = "https://playground.4geeks.com/contact";
export const AGENDA = "sasha1"; // cámbialo si necesitas otra agenda

// Lee y formatea el error de la API (intenta JSON, si no, texto)
const readError = async (res) => {
  try {
    const data = await res.json();
    if (typeof data === "string") return data;
    if (data?.msg) return data.msg;
    if (data?.detail)
      return Array.isArray(data.detail) ? data.detail.join(", ") : data.detail;
    return JSON.stringify(data);
  } catch {
    try {
      return await res.text();
    } catch {
      return "Error desconocido";
    }
  }
};

// Normaliza el nombre: si el backend devuelve "name", lo mapeamos a "full_name"
const normalize = (c) => ({ ...c, full_name: c.full_name ?? c.name ?? "" });

// Crea la agenda si no existe (POST /agendas/:slug)
export const crearAgenda = async () => {
  const res = await fetch(`${API}/agendas/${AGENDA}`, { method: "POST" });
  return res.ok; // true si respondió 2xx
};

// Obtiene los contactos de la agenda; si no existe, la crea y reintenta
export const getContacts = async () => {
  let res = await fetch(`${API}/agendas/${AGENDA}/contacts`, {
    headers: { accept: "application/json" },
  });

  // Si falla, intenta crear la agenda y vuelve a pedir la lista
  if (!res.ok) {
    await crearAgenda();
    res = await fetch(`${API}/agendas/${AGENDA}/contacts`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(await readError(res));
  }

  // La API puede devolver array directo o { contacts: [...] }
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.contacts || [];
  return list.map(normalize);
};

// Crea o actualiza un contacto (POST si no hay id, PUT si hay id)
export const upsertContact = async (contact, id) => {
  // El backend espera "name" (no "full_name"), por eso lo mapeamos aquí
  const payload = {
    name: (contact.full_name || "").trim(),
    email: (contact.email || "").trim(),
    phone: String(contact.phone || "").replace(/\s+/g, ""), // sin espacios
    address: (contact.address || "").trim(),
    agenda_slug: AGENDA, // debe coincidir con el slug de la URL
  };

  // Validaciones básicas en front para evitar 422
  if (!payload.name || !payload.email || !payload.phone || !payload.address) {
    throw new Error("Todos los campos son obligatorios.");
  }
  if (!/\S+@\S+\.\S+/.test(payload.email)) {
    throw new Error("Email no válido.");
  }
  if (!/^\+?\d{6,}$/.test(payload.phone)) {
    throw new Error("Teléfono debe ser numérico (mín. 6 dígitos).");
  }

  const url = id
    ? `${API}/agendas/${AGENDA}/contacts/${id}`
    : `${API}/agendas/${AGENDA}/contacts`;

  const res = await fetch(url, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // Imprime el motivo exacto (muy útil cuando la API responde 422)
    const raw = await res.text();
    console.error(`[${res.status}] ${url}`, raw);
    throw new Error(raw || "La API rechazó la operación (422).");
  }

  return res.json();
};

// Elimina un contacto por id (DELETE)
export const deleteContact = async (id) => {
  const res = await fetch(`${API}/agendas/${AGENDA}/contacts/${id}`, {
    method: "DELETE",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(await readError(res));
  return true;
};
