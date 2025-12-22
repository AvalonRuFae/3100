import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
const baseApiUrl = "http://localhost:3000/api/v1";

const roles = [
	{ key: "HASHIRA", label: "HASHIRA" },
	{ key: "GOON", label: "GOON" },
];

// Mock data for demonstration
const mockTeam = {
	id: 1,
	name: "Demon Slayers",
	description: "Elite team of Hashira and Goons",
	isActive: true,
	license: { licenseKey: "ABC-123-XYZ", expirationDate: "2026-01-01" },
	members: [
		{ id: 1, username: "oyakata", role: "OYAKATASAMA" },
		{ id: 2, username: "hashira1", role: "HASHIRA" },
		{ id: 3, username: "goon1", role: "GOON" },
	],
	statistics: {
		memberCount: 3,
		totalTasks: 20,
		completedTasks: 15,
		inProgressTasks: 3,
		totalEarnings: 1200,
	},
};

const TeamManagement: React.FC<{ user: any }> = ({ user }) => {
	const [team, setTeam] = useState<any | null>(null); // Will fetch from API
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Fetch team info
	const fetchTeam = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch(`${baseApiUrl}/teams/my-team`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setTeam(data.data);
			} else {
				setTeam(null);
			}
		} catch {
			setTeam(null);
		}
		setLoading(false);
	};

	// Fetch team statistics
	const fetchTeamStatistics = async (teamId: number) => {
		try {
			const token = localStorage.getItem("token");
			const res = await fetch(`${baseApiUrl}/teams/${teamId}/statistics`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setTeam((prev: any) =>
					prev ? { ...prev, statistics: data.data } : prev
				);
			}
		} catch {}
	};

	useEffect(() => {
		fetchTeam();
	}, []);

	useEffect(() => {
		if (team?.id) {
			fetchTeamStatistics(team.id);
		}
	}, [team?.id]);
	const [showCreate, setShowCreate] = useState(false);
	const [createForm, setCreateForm] = useState({
		teamName: "",
		description: "",
		licenseKey: "",
	});
	const [addMemberForm, setAddMemberForm] = useState({
		username: "",
		email: "",
		password: "",
		role: "GOON",
	});

	// Handlers for create team
	const handleCreateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCreateForm({ ...createForm, [e.target.name]: e.target.value });
	};
	const handleCreateTeam = () => {
		setLoading(true);
		setError("");
		setSuccess("");
		const token = localStorage.getItem("token");
		fetch(`${baseApiUrl}/teams/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				teamName: createForm.teamName,
				description: createForm.description,
				licenseKey: createForm.licenseKey,
			}),
		})
			.then(async (res) => {
				const data = await res.json();
				if (!res.ok || !data.success)
					throw new Error(data.message || "Failed to create team");
				fetchTeam(); // Refresh team info
				setShowCreate(false);
				setSuccess("Team created successfully!");
			})
			.catch((err) => {
				setError(err.message || "Failed to create team");
			})
			.finally(() => setLoading(false));
	};

	// Handler for add member (API call)
	const handleAddMember = async () => {
		const { username, email, password, role } = addMemberForm;
		if (!username || !email || !password || !role) {
			setError("All fields are required");
			return;
		}
		setLoading(true);
		setError("");
		setSuccess("");
		try {
			const token = localStorage.getItem("token");
			const res = await fetch(`${baseApiUrl}/teams/${team.id}/members`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ username, email, password, role }),
			});
			const data = await res.json();
			if (!res.ok || !data.success)
				throw new Error(data.message || "Failed to add member");
			// Add new member to local state
			setTeam((prev: any) => ({
				...prev,
				members: [...prev.members, data.data.user],
			}));
			// Refetch statistics after adding member
			fetchTeamStatistics(team.id);
			setSuccess("Member added successfully!");
			setAddMemberForm({ username: "", email: "", password: "", role: "GOON" });
		} catch (err: any) {
			setError(err.message || "Failed to add member");
		}
		setLoading(false);
	};
	const handleRemoveMember = (id: number) => {
		setLoading(true);
		setError("");
		setSuccess("");
		const token = localStorage.getItem("token");
		fetch(`${baseApiUrl}/teams/${team.id}/members/${id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then(async (res) => {
				const data = await res.json();
				if (!res.ok || !data.success)
					throw new Error(data.message || "Failed to remove member");
				setTeam((prev: any) => ({
					...prev,
					members: prev.members.filter((m: any) => m.id !== id),
				}));
				// Refetch statistics after removing member
				fetchTeamStatistics(team.id);
				setSuccess("Member removed successfully!");
			})
			.catch((err) => {
				setError(err.message || "Failed to remove member");
			})
			.finally(() => setLoading(false));
	};

	// Handler for edit team info (mock)
	const handleEditTeam = () => {
		setLoading(true);
		setError("");
		setSuccess("");
		const token = localStorage.getItem("token");
		fetch(`${baseApiUrl}/teams/${team.id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				name: team.name,
				description: team.description,
				isActive: team.isActive,
			}),
		})
			.then(async (res) => {
				const data = await res.json();
				if (!res.ok || !data.success)
					throw new Error(data.message || "Failed to update team");
				setTeam((prev: any) => ({ ...prev, ...data.data }));
				setSuccess("Team info updated successfully!");
			})
			.catch((err) => {
				setError(err.message || "Failed to update team");
			})
			.finally(() => setLoading(false));
	};

	// Handler for deactivate team (mock)
	const handleDeactivateTeam = () => {
		setLoading(true);
		setError("");
		setSuccess("");
		const token = localStorage.getItem("token");
		fetch(`${baseApiUrl}/teams/${team.id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then(async (res) => {
				const data = await res.json();
				if (!res.ok || !data.success)
					throw new Error(data.message || "Failed to deactivate team");
				setTeam((prev: any) => ({ ...prev, isActive: false }));
				// Optionally, refetch statistics if needed
				fetchTeamStatistics(team.id);
				setSuccess("Team deactivated successfully!");
			})
			.catch((err) => {
				setError(err.message || "Failed to deactivate team");
			})
			.finally(() => setLoading(false));
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-8 w-full h-full">
			<div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow p-8">
				<h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
					Team Management
				</h1>

				{success && <div className="mb-4 text-green-600">{success}</div>}
				{error && <div className="mb-4 text-red-600">{error}</div>}

				{/* If not in a team, show create form */}
				{!team || !team.isActive ? (
					<div>
						{!showCreate ? (
							<Button color="primary" onClick={() => setShowCreate(true)}>
								Create a Team
							</Button>
						) : (
							<div className="space-y-4">
								<Input
									label="Team Name"
									name="teamName"
									value={createForm.teamName}
									onChange={handleCreateInput}
									required
								/>
								<Input
									label="Description"
									name="description"
									value={createForm.description}
									onChange={handleCreateInput}
								/>
								<Input
									label="License Key"
									name="licenseKey"
									value={createForm.licenseKey}
									onChange={handleCreateInput}
									required
								/>
								<Button
									color="primary"
									onClick={handleCreateTeam}
									isLoading={loading}
								>
									Create
								</Button>
							</div>
						)}
					</div>
				) : (
					<>
						{/* Team Overview */}
						<div className="mb-8">
							<div className="flex items-center gap-4 mb-2">
								<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
									{team.name}
								</h2>
								<span className="px-2 py-1 rounded bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs">
									{team.isActive ? "Active" : "Inactive"}
								</span>
							</div>
							<div className="text-gray-700 dark:text-gray-300 mb-2">
								{team.description}
							</div>
							<div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
								License:{" "}
								{team.license && team.license.licenseKey ? (
									<>
										<span className="font-mono">{team.license.licenseKey}</span>{" "}
										(expires {team.license.expirationDate})
									</>
								) : (
									<span className="italic text-gray-400">
										No license assigned
									</span>
								)}
							</div>
							<Button
								size="sm"
								variant="bordered"
								onClick={handleEditTeam}
								className="mr-2"
							>
								Edit Info
							</Button>
							<Button
								size="sm"
								color="danger"
								variant="bordered"
								onClick={handleDeactivateTeam}
							>
								Deactivate Team
							</Button>
						</div>

						{/* Team Members */}
						<div className="mb-8">
							<h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
								Members ({team?.statistics?.memberCount ?? 0})
							</h3>
							<div className="space-y-2 mb-2">
								{team.members.map((m: any) => (
									<div
										key={m.id}
										className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
									>
										<span className="font-medium text-gray-900 dark:text-white">
											{m.username}
										</span>
										<span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
											{m.role}
										</span>
										{user?.role === "OYAKATASAMA" &&
											m.role !== "OYAKATASAMA" && (
												<Button
													size="sm"
													color="danger"
													variant="light"
													onClick={() => handleRemoveMember(m.id)}
												>
													Remove
												</Button>
											)}
									</div>
								))}
							</div>
							<div className="flex gap-2 mt-2 items-center">
								<Input
									placeholder="Username"
									value={addMemberForm.username}
									onChange={(e) =>
										setAddMemberForm((f) => ({
											...f,
											username: e.target.value,
										}))
									}
									className="flex-1"
								/>
								<Input
									placeholder="Email"
									value={addMemberForm.email}
									onChange={(e) =>
										setAddMemberForm((f) => ({ ...f, email: e.target.value }))
									}
									className="flex-1"
								/>
								<Input
									placeholder="Password"
									type="password"
									value={addMemberForm.password}
									onChange={(e) =>
										setAddMemberForm((f) => ({
											...f,
											password: e.target.value,
										}))
									}
									className="flex-1"
								/>
								<Select
									className="w-1/6"
									items={roles}
									selectedKeys={new Set([addMemberForm.role])}
									onSelectionChange={(keys) => {
										const key = Array.from(keys)[0];
										setAddMemberForm((f) => ({ ...f, role: key as string }));
									}}
									placeholder="Select role"
								>
									{(role) => (
										<SelectItem key={role.key}>{role.label}</SelectItem>
									)}
								</Select>
								<Button
									color="primary"
									onClick={handleAddMember}
									isLoading={loading}
								>
									Add
								</Button>
							</div>
						</div>

						{/* Team Statistics */}
						<div className="mb-4">
							<h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
								Team Statistics
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
								<div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
									<div className="text-xs text-gray-500">Total Tasks</div>
									<div className="text-xl font-bold">
										{team?.statistics?.totalTasks ?? 0}
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
									<div className="text-xs text-gray-500">Completed</div>
									<div className="text-xl font-bold">
										{team?.statistics?.completedTasks ?? 0}
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
									<div className="text-xs text-gray-500">In Progress</div>
									<div className="text-xl font-bold">
										{team?.statistics?.inProgressTasks ?? 0}
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center col-span-2 md:col-span-1">
									<div className="text-xs text-gray-500">Total Earnings</div>
									<div className="text-xl font-bold">
										${team?.statistics?.totalEarnings ?? 0}
									</div>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default TeamManagement;
