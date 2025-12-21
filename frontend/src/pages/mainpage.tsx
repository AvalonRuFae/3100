import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import Dashboard from "./dashboard";

const DashboardPage: React.FC = () => {
	const { user } = useAuth();

	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			{/* Main Content */}
			<Dashboard user={user} />
		</div>
	);
};

export default DashboardPage;
