import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import Listings from '@/pages/Listings';
import ListingDetails from '@/pages/ListingDetails';
import CreateListing from '@/pages/CreateListing';
import Login from '@/pages/Login';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { AuthProvider } from '@/utils/AuthProvider';
import { ToastProvider } from '@/utils/ToastProvider';
import { ThemeProvider } from '@/utils/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { ChatManager } from '@/components/ChatManager';
import { ChatProvider } from '@/utils/ChatProvider';
import Profile from '@/pages/Profile'
import GroupBuys from '@/pages/GroupBuys'
import GroupBuyDetails from '@/pages/GroupBuyDetails'
import AdminRoute from '@/routes/AdminRoute'
import GroupBuysAdmin from '@/pages/admin/GroupBuysAdmin'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
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
              <Route path="/group-buys" element={<GroupBuys />} />
              <Route path="/group-buys/:id" element={<GroupBuyDetails />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<GroupBuysAdmin />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}