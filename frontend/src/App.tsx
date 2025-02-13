import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Listings from './pages/Listings';
import CreateListing from './pages/CreateListing';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/create-listing" element={<CreateListing />} />
      </Routes>
    </BrowserRouter>
  );
}