import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useRecoilValue } from "recoil";
import { authUserState } from "../atoms/authAtom";
import { toast } from "react-hot-toast";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastSharedProject, setLastSharedProject] = useState(null);
    const authUser = useRecoilValue(authUserState);

    useEffect(() => {
        let newSocket = null;

        if (authUser?._id) {
            newSocket = io("http://localhost:5000", {
                auth: {
                    userId: authUser._id
                },
                transports: ["websocket", "polling"]
            });

            newSocket.on("connect", () => {
                console.log("Socket connected!");
                setIsConnected(true);
            });

            newSocket.on("disconnect", () => {
                console.log("Socket disconnected!");
                setIsConnected(false);
            });

            newSocket.on("connect_error", (error) => {
                console.error("Socket connection error:", error.message);
                toast.error("Connection error: " + error.message);
                setIsConnected(false);
            });

            // Listen for project_shared events
            newSocket.on("project_shared", (data) => {
                console.log("Received project_shared event:", data);
                setLastSharedProject(data);
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) {
                newSocket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        };
    }, [authUser?._id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, lastSharedProject }}>
            {children}
        </SocketContext.Provider>
    );
};