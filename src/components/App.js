// Dependencies
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

// Components
import { RequireAuth, Authorized, RequireAdminAuth } from '../authorization';
import SignIn from './SignIn';
import ForgotPassword from './ForgotPassword';
import ChangePassword from './ChangePassword';
import SignUp from './SignUp';
import Dashboard from './Dashboard';
import AccountSettings from './AccountSettings';

// Admin Portal
import Admin from './admin/Admin';
import Accounts from './admin/Accounts';
import CreateMeet from './admin/CreateMeet';
import EditMeet from './admin/EditMeet';
import MeetRequests from './admin/MeetRequests';

import { UserProvider } from './Context';

const App = () => {
    const [viewingRules, setViewingRules] = useState(false);
    const parseJwtPayload = payload => JSON.parse(atob(payload));
    const payload = Cookies.get("headerPayload") ? parseJwtPayload(Cookies.get("headerPayload").split(".")[1]) : null;
    const details = Cookies.get("headerPayload") ? payload : null;
    const [user, setUser] = useState({details});

    const updateViewingRules = status => {
        setViewingRules(status);
    };

    const updateLoginStatus = details => {
        setUser({details});
    };

    return(
        <BrowserRouter>
            <UserProvider value={user}>
                <Routes>
                    <Route element={<Authorized />}>
                        <Route path="/" element={
                            <SignIn
                                viewingRules={viewingRules}
                                updateViewingRules={updateViewingRules}
                                updateLoginStatus={updateLoginStatus}
                            />
                        } />
                        <Route path="signup" element={
                            <SignUp
                                viewingRules={viewingRules}
                                updateViewingRules={updateViewingRules}
                                updateLoginStatus={updateLoginStatus}
                            />
                        } />
                        <Route path="forgotPassword" element={
                            <ForgotPassword
                                viewingRules={viewingRules}
                                updateViewingRules={updateViewingRules}
                            />
                        } />
                        <Route path="forgotPassword/:path" element={
                            <ChangePassword
                                viewingRules={viewingRules}
                                updateViewingRules={updateViewingRules}
                            />
                        } />
                    </Route>
                    <Route element={<RequireAuth />}>
                        <Route path="dashboard" element={<Dashboard updateLoginStatus={updateLoginStatus} />} />
                        <Route path="accountSettings" element={<AccountSettings updateLoginStatus={updateLoginStatus} />} />
                    </Route>
                    <Route element={<RequireAdminAuth />}>
                        <Route path="admin" element={<Admin updateLoginStatus={updateLoginStatus} />} />
                        <Route path="admin/accounts" element={<Accounts updateLoginStatus={updateLoginStatus} />} />
                        <Route path="admin/createMeet" element={<CreateMeet updateLoginStatus={updateLoginStatus} />} />
                        <Route path="admin/editMeet" element={<EditMeet updateLoginStatus={updateLoginStatus} />} />
                        <Route path="admin/meetRequests" element={<MeetRequests updateLoginStatus={updateLoginStatus} />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </UserProvider>
        </BrowserRouter>
    );
};

export default App;