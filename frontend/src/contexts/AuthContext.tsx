import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import axios from "axios";

export interface User {
	id: number;
	username: string;
	email: string;
	role: string;
	balance: number;
	teamId?: number;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	login: (username: string, password: string) => Promise<boolean>;
	register: (
		username: string,
		email: string,
		password: string,
		role: string
	) => Promise<boolean>;
	logout: () => void;
	changePassword: (
		oldPassword: string,
		newPassword: string
	) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	token: null,
	isLoading: false,
	login: async () => false,
	register: async () => false,
	logout: () => {},
	changePassword: async () => ({ success: false }),
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Load user/token from localStorage on mount
	useEffect(() => {
		const storedToken = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");
		if (storedToken && storedUser && storedUser !== "undefined") {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}
	}, []);

	// Helper to set user/token in state and localStorage
	const setAuth = (token: string, user: User) => {
		setToken(token);
		setUser(user);
		localStorage.setItem("token", token);
		localStorage.setItem("user", JSON.stringify(user));
	};

	const login = async (username: string, password: string) => {
		setIsLoading(true);
		try {
			// Backend expects 'username' field (can be username or email)
			const res = await axios.post("http://localhost:3000/api/v1/auth/login", {
				username,
				password,
			});
			const { token, user } = res.data.data;
			setAuth(token, user);
			setIsLoading(false);
			return true;
		} catch (err) {
			setIsLoading(false);
			return false;
		}
	};

	const register = async (
		username: string,
		email: string,
		password: string,
		role: string
	) => {
		setIsLoading(true);
		try {
			const res = await axios.post(
				"http://localhost:3000/api/v1/auth/register",
				{
					username,
					email,
					password,
					role,
				}
			);
			const { token, user } = res.data.data;
			setAuth(token, user);
			setIsLoading(false);
			return true;
		} catch (err: any) {
			setIsLoading(false);
			throw err; // Re-throw to let register page handle specific errors
		}
	};

	const changePassword = async (oldPassword: string, newPassword: string) => {
		try {
			await axios.post("http://localhost:3000/api/v1/auth/change-password", {
				oldPassword,
				newPassword,
			});
			return { success: true, message: "Password changed successfully" };
		} catch (err: any) {
			const message =
				err.response?.data?.message || "Failed to change password";
			return { success: false, message };
		}
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		// Navigate after clearing state
		setTimeout(() => {
			window.location.href = "/login";
		}, 0);
	};

	// Set axios default header for token and add interceptor for auth errors
	useEffect(() => {
		if (token) {
			axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
		} else {
			delete axios.defaults.headers.common["Authorization"];
		}

		// Add response interceptor to handle auth errors globally
		const interceptor = axios.interceptors.response.use(
			(response) => response,
			(error) => {
				if (error.response) {
					// Handle 401 Unauthorized - token expired or invalid
					if (error.response.status === 401) {
						// Don't redirect if we're on login/register pages (let them handle errors)
						const isAuthPage =
							window.location.pathname === "/login" ||
							window.location.pathname === "/register";
						if (!isAuthPage) {
							// Clear auth state without calling logout() to prevent infinite loop
							setUser(null);
							setToken(null);
							localStorage.removeItem("token");
							localStorage.removeItem("user");
							delete axios.defaults.headers.common["Authorization"];
							window.location.href = "/login";
						}
					}
					// Handle 403 Forbidden - typically license issues
					else if (error.response.status === 403) {
						const message = error.response.data?.message || "Access denied";
						// Check if it's a license-related error
						if (message.includes("license") || message.includes("team")) {
							console.error("License Error:", message);
							// You can show a toast/notification here if needed
						}
					}
				}
				return Promise.reject(error);
			}
		);

		// Cleanup interceptor on unmount
		return () => {
			axios.interceptors.response.eject(interceptor);
		};
	}, [token]);

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				isLoading,
				login,
				register,
				logout,
				changePassword,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
