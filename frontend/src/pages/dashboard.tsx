import React, { useState, useEffect } from "react";
import SimpleThemeToggle from "@/components/SimpleThemeToggle";
import axios from "axios";

const Dashboard: React.FC<{ user: any }> = ({ user }) => {
	// Dashboard data states
	const [taskHistory, setTaskHistory] = useState<any[]>([]);
	const [transactions, setTransactions] = useState<any[]>([]);
	const [availableTasksCount, setAvailableTasksCount] = useState(0);
	const [activeTasksCount, setActiveTasksCount] = useState(0);
	const [completionRate, setCompletionRate] = useState(0);
	const [loading, setLoading] = useState(true);

	// Fetch dashboard data
	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem('token');
				const config = { headers: { Authorization: `Bearer ${token}` } };

				// Fetch task history
				const tasksResponse = await axios.get(`http://localhost:3000/api/v1/users/${user.id}/tasks`, config);
				const tasks = tasksResponse.data.data || [];
				setTaskHistory(tasks);

				// Calculate completion rate from user's tasks
				const completed = tasks.filter((t: any) => t.status === 'COMPLETED').length;
				const total = tasks.length;
				setCompletionRate(total > 0 ? Math.round((completed / total) * 100) : 0);

				// Count active tasks (assigned to user and not completed)
				const active = tasks.filter((t: any) => 
					t.status === 'IN_PROGRESS' || t.status === 'REVIEW'
				).length;
				setActiveTasksCount(active);

				// Fetch available tasks
				const availableResponse = await axios.get('http://localhost:3000/api/v1/tasks?status=AVAILABLE', config);
				setAvailableTasksCount(availableResponse.data.data?.length || 0);

				// Fetch transactions
				const transactionsResponse = await axios.get(`http://localhost:3000/api/v1/bounties/transactions/${user.id}`, config);
				setTransactions(transactionsResponse.data.data || []);

				setLoading(false);
			} catch (error) {
				console.error('Error fetching dashboard data:', error);
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [user.id, user.role]);

	// Refetch data when page becomes visible (user navigates back to dashboard)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				const fetchDashboardData = async () => {
					try {
						const token = localStorage.getItem('token');
						const config = { headers: { Authorization: `Bearer ${token}` } };

						// Fetch task historys
						const tasksResponse = await axios.get(`http://localhost:3000/api/v1/users/${user.id}/tasks`, config);
						const tasks = tasksResponse.data.data || [];
						setTaskHistory(tasks);

						// Calculate completion rate from user's tasks
						const completed = tasks.filter((t: any) => t.status === 'COMPLETED').length;
						const total = tasks.length;
						setCompletionRate(total > 0 ? Math.round((completed / total) * 100) : 0);

						// Count active tasks (assigned to user and not completed)
						const active = tasks.filter((t: any) => 
							t.status === 'IN_PROGRESS' || t.status === 'REVIEW'
						).length;
						setActiveTasksCount(active);

						// Fetch available tasks
						const availableResponse = await axios.get('http://localhost:3000/api/v1/tasks?status=AVAILABLE', config);
						setAvailableTasksCount(availableResponse.data.data?.length || 0);

						// Fetch transactions
						const transactionsResponse = await axios.get(`http://localhost:3000/api/v1/bounties/transactions/${user.id}`, config);
						setTransactions(transactionsResponse.data.data || []);
					} catch (error) {
						console.error('Error fetching dashboard data:', error);
					}
				};

				fetchDashboardData();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	}, [user.id, user.role]);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex w-full">
			{/* Main Content */}
			<div className="flex-1 lg:ml-0 transition-all duration-300">
				{/* Header */}
				<header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center space-x-4">
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								Demon Slayer Corps Dashboard
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<div className="text-sm text-gray-600 dark:text-gray-400">
								Welcome back,{" "}
								<span className="font-semibold text-primary">
									{user?.username}
								</span>
								!
							</div>
							{/* Theme Toggle */}
							<SimpleThemeToggle />
						</div>
					</div>
				</header>

				{/* Dashboard Content */}
				<div className="p-6">
					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
							<div className="flex items-center">
								<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
									<svg
										className="w-6 h-6 text-blue-600 dark:text-blue-300"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
										Available Tasks
									</p>
									<p className="text-2xl font-semibold text-gray-900 dark:text-white">
										{loading ? '...' : availableTasksCount}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
							<div className="flex items-center">
								<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
									<svg
										className="w-6 h-6 text-green-600 dark:text-green-300"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
										My Active Tasks
									</p>
									<p className="text-2xl font-semibold text-gray-900 dark:text-white">
										{loading ? '...' : activeTasksCount}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
							<div className="flex items-center">
								<div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
									<svg
										className="w-6 h-6 text-yellow-600 dark:text-yellow-300"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
										Total Earnings
									</p>
									<p className="text-2xl font-semibold text-gray-900 dark:text-white">
										${user?.balance ? Number(user.balance).toFixed(2) : "0.00"}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
							<div className="flex items-center">
								<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
									<svg
										className="w-6 h-6 text-purple-600 dark:text-purple-300"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
										Completion Rate
									</p>
									<p className="text-2xl font-semibold text-gray-900 dark:text-white">
										{loading ? '...' : `${completionRate}%`}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Task History Widget - All Users */}
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Task History
						</h2>
						{loading ? (
							<p className="text-gray-600 dark:text-gray-400">Loading...</p>
						) : taskHistory.length > 0 ? (
							<div className="overflow-x-auto overflow-y-auto max-h-64">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b dark:border-gray-700">
											<th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Task</th>
											<th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Status</th>
											<th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Bounty</th>
											<th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Deadline</th>
										</tr>
									</thead>
									<tbody>
										{taskHistory.slice(0, 5).map((task) => (
											<tr key={task.id} className="border-b dark:border-gray-700">
												<td className="py-2 px-2 text-gray-900 dark:text-white">{task.title}</td>
												<td className="py-2 px-2">
													<span className={`px-2 py-1 rounded-full text-xs ${
														task.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
														task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
														'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
													}`}>
														{task.status}
													</span>
												</td>
												<td className="py-2 px-2 text-gray-900 dark:text-white">${task.bountyAmount}</td>
												<td className="py-2 px-2 text-gray-600 dark:text-gray-400">
													{new Date(task.deadline).toLocaleDateString()}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-gray-600 dark:text-gray-400">No task history available.</p>
						)}
					</div>

					{/* Transaction History Widget - All Users */}
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Transaction History
						</h2>
						{loading ? (
							<p className="text-gray-600 dark:text-gray-400">Loading...</p>
						) : transactions.length > 0 ? (
							<div className="overflow-x-auto overflow-y-auto max-h-64">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b dark:border-gray-700">
											<th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Type</th>
											<th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Amount</th>
											<th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Description</th>
											<th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Date</th>
										</tr>
									</thead>
									<tbody>
										{transactions.slice(0, 5).map((txn) => (
											<tr key={txn.id} className="border-b dark:border-gray-700">
												<td className="py-2 px-2">
													<span className={`px-2 py-1 rounded-full text-xs ${
														txn.type === 'BOUNTY' || txn.type === 'ADJUSTMENT' && txn.amount > 0 
															? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
															: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
													}`}>
														{txn.type}
													</span>
												</td>
												<td className="py-2 px-2 text-gray-900 dark:text-white">
													{txn.amount >= 0 ? '+' : '-'}${Math.abs(txn.amount)}
												</td>
												<td className="py-2 px-2 text-gray-600 dark:text-gray-400">{txn.description}</td>
												<td className="py-2 px-2 text-gray-600 dark:text-gray-400">
													{new Date(txn.created_at).toLocaleDateString()}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-gray-600 dark:text-gray-400">No transactions available.</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
