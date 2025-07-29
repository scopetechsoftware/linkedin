import { useEffect } from "react";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";

export default function ProjectShareToastListener() {
  const { lastSharedProject } = useSocket();
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => (await axiosInstance.get("/auth/me")).data,
  });

  useEffect(() => {
    if (
      lastSharedProject &&
      authUser &&
      lastSharedProject.sender &&
      lastSharedProject.project &&
      lastSharedProject.project.collaborators?.some(
        (user) => user._id === authUser._id
      )
    ) {
      toast.success(
        <div>
          <b>{lastSharedProject.sender.name}</b> shared a project with you!<br />
          <span>Project: <b>{lastSharedProject.project.name}</b></span>
        </div>,
        { duration: 6000 }
      );
    }
  }, [lastSharedProject, authUser]);

  return null;
} 