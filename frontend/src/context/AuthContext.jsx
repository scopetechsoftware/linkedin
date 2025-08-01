import { createContext, useContext, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { authUserState } from '../atoms/authAtom';
import { axiosInstance } from '../lib/axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const authUser = useRecoilValue(authUserState);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      setUser(null);
    }
  }, [authUser]);

  const value = {
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};