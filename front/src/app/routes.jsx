import { Route, Routes } from "react-router-dom";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<h1>Escape rooms</h1>} />
    </Routes>
  );
}
