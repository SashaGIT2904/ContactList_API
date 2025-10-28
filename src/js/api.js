
// CRUD con la API de 4Geeks usando el slug "sasha"

const BASE = "https://playground.4geeks.com/contact";
const AGENDA_SLUG = "sasha"; 

// Funcion que obtiene el json de la respuesta que viene de la API
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

// Funcion que asegura que exista la agenda para el slug "sasha" 
const ensureAgenda = async () => {
  const listUrl = `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}/contacts`;
  let res = await fetch(listUrl);

  if (res.status === 404) {
    const createRes = await fetch(
      `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}`,
      { method: "POST" } 
    );
    if (!createRes.ok && createRes.status !== 409) {
      const txt = await createRes.text().catch(() => "");
      throw new Error(txt || `No se pudo crear la agenda (HTTP ${createRes.status})`);
    }
    
    res = await fetch(listUrl);
  }

  if (!res.ok && res.status !== 404) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Error listando contactos (HTTP ${res.status})`);
  }

  return res;
};

// Funcion que normaliza el contacto en la API
const normalizeContact = (c) => ({
  ...c,
  id: c.id ?? c.contact_id ?? c.uid ?? c._id, 
  full_name: c.full_name || c.name || "",
});
// Funcion que obtiene la lista de contactos
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
// Funcion que guarda o actualiza un contacto mediante POST/PUT
export const upsertContact = async (form, id) => {
  const basePayload = {
    
    name: (form.full_name || "").trim(),
    email: (form.email || "").trim(),
    phone: (form.phone || "").trim(),
    address: (form.address || "").trim(),
  };

  if (!basePayload.name || !basePayload.email) {
    throw new Error("Nombre y email son obligatorios.");
  }

  if (id) {
  
    let res = await fetch(
      `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}/contacts/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload), 
      }
    );

    
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

// DELETE
// Funcion que borra un contacto mediante DELETE
export const deleteContact = async (id) => {
  if (!id) throw new Error("Falta el id del contacto.");

  
  let res = await fetch(
    `${BASE}/agendas/${encodeURIComponent(AGENDA_SLUG)}/contacts/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );


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