import React, {useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Inventory from './components/Inventory';
import AddDonation from './components/AddDonation';
import Donors from './components/Donors';
import Users from './components/Users';
import SendDonations from './components/SendDonations';
import DonationHistory from './components/History';
import WelcomePage from './components/WelcomePage';
import HelpRequest from './components/HelpRequest';
import Campains from './components/Campains';
import Almacenes from './components/Almacen';
import Salidas from './components/Salidas';
import './App.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';


axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      alert('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
      localStorage.clear();
      window.location.href = '/login'; // redirige forzosamente
    }
    return Promise.reject(error);
  }
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (token && usuarioGuardado) {
      setIsLoggedIn(true);
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch (e) {
        console.error('Error al parsear el usuario', e);
      }
    }
  }, []);

  const handleLogin = () => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUsuario(null);
  };
  return (
    <Router>
      <div className="app">
        {isLoggedIn && <Sidebar usuario={usuario} onLogout={handleLogout} />}
        <div className={isLoggedIn ? "content with-sidebar" : "content"}>
          <Routes>
            <Route path="/login" element={!isLoggedIn ? <Login onLogin={handleLogin} /> : <Navigate to="/welcome" />} />
            <Route path="/welcome" element={isLoggedIn ? <WelcomePage usuario={usuario} /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={isLoggedIn ? <Dashboard usuario={usuario} /> : <Navigate to="/login" />} />
            <Route path="/inventory" element={isLoggedIn ? <Inventory /> : <Navigate to="/login" />} />
            <Route path="/add-donation" element={isLoggedIn ? <AddDonation /> : <Navigate to="/login" />} />
            <Route path="/donors" element={isLoggedIn ? <Donors /> : <Navigate to="/login" />} />
            <Route path="/users" element={isLoggedIn ? <Users /> : <Navigate to="/login" />} />
            <Route path="/send-donations" element={isLoggedIn ? <SendDonations /> : <Navigate to="/login" />} />
            <Route path="/history" element={isLoggedIn ? <DonationHistory /> : <Navigate to="/login" />} />
            <Route path="/campains" element={isLoggedIn ? <Campains /> : <Navigate to="/login" />} />
            <Route path='/almacenes' element={isLoggedIn ? <Almacenes /> : <Navigate to="/login" />} />
            <Route path="/help-request" element={isLoggedIn ? <HelpRequest /> : <Navigate to="/login" />} />
            <Route path="/salidas" element={isLoggedIn ? <Salidas /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={isLoggedIn ? "/welcome" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}


export default App;