import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import { useApp } from "./context/AppContext";
import OtherUserProfile from "./pages/otherUserProfile";

function App() {
  const { state } = useApp();
  const { user } = state;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Navigate to="/home" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/home" />} />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
        <Route path="/user/:id" element={user ? <OtherUserProfile /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
