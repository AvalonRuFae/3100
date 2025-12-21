import { Route, Routes, Navigate } from "react-router-dom";

import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/mainpage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

function App() {
	const { user } = useAuth();

	return (
		<Routes>
			<Route element={<IndexPage />} path="/" />

			{/* Authentication Routes */}
			<Route
				element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
				path="/login"
			/>
			<Route
				element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
				path="/register"
			/>

			{/* Protected Routes */}
			<Route
				element={
					<ProtectedRoute>
						<DashboardPage />
					</ProtectedRoute>
				}
				path="/dashboard"
			/>
		</Routes>
	);
}

export default App;
