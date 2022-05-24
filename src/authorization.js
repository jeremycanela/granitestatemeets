import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const validation = async () => {
    return await fetch("/api/authenticateUser").then(async res => await res.json()).catch(error => {
        console.error(error);
        return false;
    });
};

export const RequireAuth = () => {
    const [result, setResult] = useState();

    useEffect(() => {
        const authenticateUser = async () => {
            if(Cookies.get("headerPayload")) {
                const user = await validation();
                
                user.id ? setResult(<Outlet />) : setResult(<p>Error: Invalid token</p>);
            } else {
                setResult(<Navigate to="/" replace />);
            }
        };

        authenticateUser();
    }, []);

    return result;
};

export const Authorized = () => {
    return Cookies.get("headerPayload") ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export const RequireAdminAuth = () => {
    const [result, setResult] = useState();

    useEffect(() => {
        const authenticateUser = async () => {
            if(Cookies.get("headerPayload")) {
                const user = await validation();
                
                user.admin ? setResult(<Outlet />) : setResult(<Navigate to="/" replace />);
            } else {
                setResult(<Navigate to="/" replace />);
            }
        };

        authenticateUser();
    }, []);

    return result;
};