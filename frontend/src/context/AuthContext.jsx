import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginUser, registerUser, logoutUser } from '../api/auth';

const AuthContext = createContext();



export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(!!localStorage.getItem('authToken'));

    // On initial mount, restore user from the token stored in localStorage.
    // Without this, user is null after every page refresh even though the
    // token is still valid, causing the dashboard to break (e.g. user?.email crashes).
    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);

                // Check if the token has actually expired
                const isExpired = decoded.exp * 1000 < Date.now();
                if (isExpired) {
                    handleLogout();
                } else {
                    setUser({ id: decoded.id, email: decoded.email });
                }
            } catch (error) {
                // Token is malformed — clear everything
                console.error('Invalid token, logging out:', error);
                handleLogout();
            }
        }
        setLoading(false);
    }, []); // ← run once on mount only, not on every token change

    const handleLogin = async (email, password) => {
    try {
        const data = await loginUser(email, password);
        console.log('Login response:', data); // ← add this
        localStorage.setItem('authToken', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
    } catch (error) {
        console.log('Login error:', error); // ← add this
        return { 
            success: false, 
            message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
        };
    }
};

    const handleRegister = async (email, password) => {
        try {
            const data = await registerUser(email, password);
            return { success: true, message: data.message };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Registration failed.' 
            };
        }
    };

    const handleLogout = () => {
        console.trace('handleLogout called');
        logoutUser(); // Clears localStorage via the api/auth service
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        handleLogin,
        handleRegister,
        logout: handleLogout,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};