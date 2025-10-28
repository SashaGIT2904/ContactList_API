import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Contact from "./pages/Contact.jsx";
import AddContact from "./pages/AddContact.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Contact />} />
      <Route path="/new" element={<AddContact />} />
      <Route path="/edit/:id" element={<AddContact />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
