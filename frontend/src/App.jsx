import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import HomePage from "./pages/HomePage/HomePage";
import SignUpPage from "./pages/auth/SignUpPage/SignUpPage";
import LoginPage from "./pages/auth/LoginPage/LoginPage";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./lib/axios.js";
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage.jsx";
import NetworkPage from "./pages/NetworkPage/NetworkPage.jsx";
import PostPage from "./pages/PostPage/PostPage.jsx";
import ProfilePage from "./pages/ProfilePage/ProfilePage.jsx";
import ProjectsPage from "./pages/ProjectsPage/ProjectsPage.jsx";
import AffiliationsPage from "./pages/AffiliationsPage/AffiliationsPage.jsx";
import JobsPage from "./pages/JobsPage/JobsPage";
import JobDetailsPage from "./pages/JobsPage/JobDetailsPage";

export default function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
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
    <Layout>
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to={"/login"} />}/>
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />}/>
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}/>
        <Route path="/notifications" element={authUser ? <NotificationsPage /> : <Navigate to={"/login"} />}/>
        <Route path='/network' element={authUser ? <NetworkPage /> : <Navigate to={"/login"} />} />
        <Route path='/post/:postId' element={authUser ? <PostPage /> : <Navigate to={"/login"} />} />
        <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />} />
        <Route path='/projects' element={authUser ? <ProjectsPage /> : <Navigate to={"/login"} />} />
        <Route path='/affiliations' element={authUser ? <AffiliationsPage /> : <Navigate to={"/login"} />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />
      </Routes>
      <Toaster />
    </Layout>
  )
}