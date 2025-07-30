import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import HomePage from "./pages/HomePage/HomePage";
import SignUpPage from "./pages/auth/SignUpPage/SignUpPage";
import LoginPage from "./pages/auth/LoginPage/LoginPage";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./lib/axios.js";
import { useSetRecoilState } from 'recoil';
import { authUserState } from './atoms/authAtom';
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage.jsx";
import NetworkPage from "./pages/NetworkPage/NetworkPage.jsx";
import PostPage from "./pages/PostPage/PostPage.jsx";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import ProjectsPage from "./pages/ProjectsPage/ProjectsPage.jsx";
import AffiliationsPage from "./pages/AffiliationsPage/AffiliationsPage.jsx";
import JobsPage from "./pages/JobsPage/JobsPage";
import JobDetailsPage from "./pages/JobsPage/JobDetailsPage";
import SearchPage from "./pages/SearchPage/SearchPage";
import { SocketProvider } from "./context/SocketContext";
import ProjectShareToastListener from "./components/ProjectShareToastListener";
import ProfileSharePage from "./pages/ProfileSharePage/ProfileSharePage";

export default function App() {
  const setAuthUser = useSetRecoilState(authUserState);
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        const userData = res.data;
        setAuthUser(userData);
        return userData;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          return null;
        }

        toast.error(error.response.data.message || "Something went wrong");
      }
    }
  });

  console.log("authUser", authUser);

  if (isLoading) return null;

  return (
    <SocketProvider>
      <ProjectShareToastListener />
      <Layout>
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to={"/login"} />}/>
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />}/>
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}/>
          <Route path="/notifications" element={authUser ? <NotificationsPage /> : <Navigate to={"/login"} />}/>
          <Route path='/network' element={authUser ? <NetworkPage /> : <Navigate to={"/login"} />} />
          <Route path='/post/:postId' element={authUser ? <PostPage /> : <Navigate to={"/login"} />} />
          <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />} />
          <Route path='/profile-share/:username' element={authUser ? <ProfileSharePage /> : <Navigate to={"/login"} />} />
          <Route path='/settings' element={authUser ? <SettingsPage /> : <Navigate to={"/login"} />} />
          <Route path='/projects' element={authUser ? <ProjectsPage /> : <Navigate to={"/login"} />} />
          <Route path='/affiliations' element={authUser ? <AffiliationsPage /> : <Navigate to={"/login"} />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/search" element={authUser ? <SearchPage /> : <Navigate to={"/login"} />} />
        </Routes>
        <Toaster />
      </Layout>
    </SocketProvider>
  )
}