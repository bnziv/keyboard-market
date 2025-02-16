import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Listings from './pages/Listings';
import CreateListing from './pages/CreateListing';
import Login from './pages/Login';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/create-listing" element={<CreateListing />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}