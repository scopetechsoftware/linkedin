import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";

const SocketContext = createContext();

export const useSocket = () => {
	return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	useEffect(() => {
		if (!authUser) return;

		// Get JWT token from cookies
		const getCookie = (name) => {
			const value = `; ${document.cookie}`;
			const parts = value.split(`; ${name}=`);
			if (parts.length === 2) return parts.pop().split(";").shift();
		};

		const token = getCookie("jwt-linkedin");
		if (!token) return;

		// Connect to socket server
		const socketInstance = io(import.meta.env.MODE === "development" ? "http://localhost:5000" : "", {
			auth: { token },
			withCredentials: true,
		});

		socketInstance.on("connect", () => {
			console.log("Connected to socket server");
		});

		socketInstance.on("connect_error", (err) => {
			console.error("Socket connection error:", err.message);
		});

		setSocket(socketInstance);

		return () => {
			socketInstance.disconnect();
		};
	}, [authUser]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};