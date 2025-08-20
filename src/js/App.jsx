// App.jsx — Define las rutas de la aplicación (SPA) usando React Router.
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Contact from "./pages/Contact.jsx"; // Vista: lista de contactos
import AddContact from "./pages/AddContact.jsx"; // Vista: formulario (crear/editar)

export default function App() {
  return (
    // BrowserRouter habilita navegación sin recargar la página
    <BrowserRouter>
      {/* Routes agrupa todas las rutas de la app */}
      <Routes>
        {/* Ruta raíz: muestra la lista de contactos */}
        <Route path="/" element={<Contact />} />
        {/* Ruta para crear un contacto nuevo */}
        <Route path="/new" element={<AddContact />} />
        {/* Ruta para editar, recibe :id del contacto a editar */}
        <Route path="/edit/:id" element={<AddContact />} />
        {/* Cualquier ruta no existente redirige a "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
