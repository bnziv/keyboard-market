import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import Listings from '@/pages/Listings';
import ListingDetails from '@/pages/ListingDetails';
import CreateListing from '@/pages/CreateListing';
import Login from '@/pages/Login';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { AuthProvider } from '@/utils/AuthProvider';
import { ToastProvider } from '@/utils/ToastProvider';
import { Toaster } from '@/components/ui/sonner';
import { ChatManager } from '@/components/ChatManager';
import { ChatProvider } from '@/utils/ChatProvider';
import Profile from '@/pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
            <Toaster duration={3000} position="top-center"/>
            <ChatManager />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/:id" element={<ListingDetails />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/create-listing" element={<CreateListing />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/profile/:username" element={<Profile />} />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}