// src/api.js
// CRUD para Contact API de 4Geeks usando el slug "sasha"

const BASE = "https://playground.4geeks.com/contact";
const AGENDA_SLUG = "sasha"; // tu agenda

// Utilidad: parsea JSON y lanza errores legibles (muestra detail/msg)
const jsonOrThrow = async (res) => {
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    try {
      const data = JSON.parse(text || "{}");
      const msg =
        data?.msg ||
        data?.message ||
        (Array.isArray(data?.details) && data.details[0]) ||
        (Array.isArray(data?.detail) && data.detail.map(d => d.msg).join(", ")) ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
};

// Asegura que exista la agenda (POST /agendas/:slug sin body)
const ensureAgenda = async () => {
  const listUrl = `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}/contacts`;
  let res = await fetch(listUrl);

  if (res.status === 404) {
    const createRes = await fetch(
      `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}`,
      { method: "POST" } // sin body ni headers
    );
    if (!createRes.ok && createRes.status !== 409) {
      const txt = await createRes.text().catch(() => "");
      throw new Error(txt || `No se pudo crear la agenda (HTTP ${createRes.status})`);
    }
    // Reintento el listado (probablemente vacío)
    res = await fetch(listUrl);
  }

  if (!res.ok && res.status !== 404) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Error listando contactos (HTTP ${res.status})`);
  }

  return res;
};

// Normaliza un contacto del servidor a la forma que usa tu UI
// --- reemplaza tu normalizeContact por este ---
const normalizeContact = (c) => ({
  ...c,
  id: c.id ?? c.contact_id ?? c.uid ?? c._id, // id robusto
  full_name: c.full_name || c.name || "",
});


export const getContacts = async () => {
  const res = await ensureAgenda();
  if (res.status === 404) return [];

  const data = await jsonOrThrow(res);
  const list = Array.isArray(data?.contacts)
    ? data.contacts
    : Array.isArray(data)
      ? data
      : [];

  return list.map(normalizeContact);
};

// CREATE o UPDATE
// Reemplaza tu función upsertContact COMPLETA por esta
export const upsertContact = async (form, id) => {
  const basePayload = {
    // La API exige "name" (no full_name)
    name: (form.full_name || "").trim(),
    email: (form.email || "").trim(),
    phone: (form.phone || "").trim(),
    address: (form.address || "").trim(),
  };

  if (!basePayload.name || !basePayload.email) {
    throw new Error("Nombre y email son obligatorios.");
  }

  if (id) {
    // UPDATE con fallback: primero por agenda, luego /contacts/:id
    // 1) Intento principal: PUT /agendas/:slug/contacts/:id
    let res = await fetch(
      `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}/contacts/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload), // NO enviamos agenda_slug
      }
    );

    // 2) Fallback si 404: PUT /contacts/:id
    if (res.status === 404) {
      res = await fetch(`${BASE}/contacts/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload),
      });
    }

    const updated = await jsonOrThrow(res);
    return normalizeContact(updated);
  } else {
    // CREATE (ya lo tenías OK)
    await ensureAgenda();
    const res = await fetch(
      `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}/contacts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload),
      }
    );
    const created = await jsonOrThrow(res);
    return normalizeContact(created);
  }
};


export const deleteContact = async (id) => {
  if (!id) throw new Error("Falta el id del contacto.");

  // 1) Intento principal: por agenda (es el que suele funcionar en este playground)
  let res = await fetch(
    `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}/contacts/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  // 2) Fallback: por /contacts/:id
  if (res.status === 404) {
    res = await fetch(`${BASE}/contacts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `No se pudo eliminar (HTTP ${res.status})`);
  }
  return true;
};