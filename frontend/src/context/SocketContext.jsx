import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const SocketContext = createContext();

export const useSocket = () => {
	return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [lastSharedProject, setLastSharedProject] = useState(null); // Store last shared project and sender
	const queryClient = useQueryClient();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

useEffect(() => {
	// Always connect to socket server regardless of authentication
	console.log("Connecting socket with userId", authUser?._id);

	// Connect to socket server, pass userId in auth
	const socketInstance = io(import.meta.env.MODE === "development" ? "http://localhost:5000" : "", {
		withCredentials: true,
		auth: { userId: authUser?._id },
		transports: ['websocket', 'polling'],
		reconnectionAttempts: 5,
		reconnectionDelay: 1000,
		autoConnect: true
	});
	
	// Debug socket connection
	console.log("Socket instance created:", {
		url: socketInstance.io.uri,
		transports: socketInstance.io.opts.transports,
		connected: socketInstance.connected
	});

	const handleConnect = () => {
		console.log("Connected to socket server");
		setSocket(socketInstance);
	};
	const handleDisconnect = () => {
		setSocket(null);
	};
	socketInstance.on("connect", handleConnect);
	socketInstance.on("disconnect", handleDisconnect);
	socketInstance.on("connect_error", (err) => {
		console.error("Socket connection error:", err.message);
		console.log("Socket connection details:", {
			url: socketInstance.io.uri,
			transports: socketInstance.io.opts.transports,
			auth: socketInstance.auth,
			connected: socketInstance.connected
		});
		setSocket(null);
	});

	// Listen for project_shared event globally
	socketInstance.on("project_shared", (data) => {
		console.log("Received project_shared event:", data);
		setLastSharedProject(data); // Store project and sender
		queryClient.invalidateQueries(["notifications"]); // Refetch notifications
	});

	return () => {
		socketInstance.off("connect", handleConnect);
		socketInstance.off("disconnect", handleDisconnect);
		socketInstance.off("project_shared");
		socketInstance.disconnect();
		setSocket(null);
	};
}, []);

	return <SocketContext.Provider value={{ socket, onlineUsers, lastSharedProject }}>{children}</SocketContext.Provider>;
};