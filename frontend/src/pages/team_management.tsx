import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

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
	const [team, setTeam] = useState<any | null>(mockTeam); // Replace with API call
	const [showCreate, setShowCreate] = useState(false);
	const [createForm, setCreateForm] = useState({
		teamName: "",
		description: "",
		licenseKey: "",
	});
	const [addMemberId, setAddMemberId] = useState("");
	const [addMemberRole, setAddMemberRole] = useState("GOON");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Handlers for create team
	const handleCreateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCreateForm({ ...createForm, [e.target.name]: e.target.value });
	};
	const handleCreateTeam = () => {
		setLoading(true);
		setTimeout(() => {
			setTeam({
				...mockTeam,
				name: createForm.teamName,
				description: createForm.description,
				license: {
					licenseKey: createForm.licenseKey,
					expirationDate: "2026-01-01",
				},
			});
			setShowCreate(false);
			setLoading(false);
			setSuccess("Team created successfully!");
		}, 1000);
	};

	// Handlers for add/remove member (mock)
	const handleAddMember = () => {
		if (!addMemberId) return;
		setTeam((prev: any) => ({
			...prev,
			members: [
				...prev.members,
				{ id: Date.now(), username: addMemberId, role: addMemberRole },
			],
			statistics: {
				...prev.statistics,
				memberCount: prev.statistics.memberCount + 1,
			},
		}));
		setAddMemberId("");
		setAddMemberRole("GOON");
	};
	const handleRemoveMember = (id: number) => {
		setTeam((prev: any) => ({
			...prev,
			members: prev.members.filter((m: any) => m.id !== id),
			statistics: {
				...prev.statistics,
				memberCount: prev.statistics.memberCount - 1,
			},
		}));
	};

	// Handler for edit team info (mock)
	const handleEditTeam = () => {
		setSuccess("Team info updated (mock)");
	};

	// Handler for deactivate team (mock)
	const handleDeactivateTeam = () => {
		setTeam((prev: any) => ({ ...prev, isActive: false }));
		setSuccess("Team deactivated (mock)");
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
								<span className="font-mono">{team.license.licenseKey}</span>{" "}
								(expires {team.license.expirationDate})
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
								Members ({team.statistics.memberCount})
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
									placeholder="Add member by username"
									value={addMemberId}
									onChange={(e) => setAddMemberId(e.target.value)}
									className="flex-1"
								/>
								<select
									className="rounded border border-gray-300 dark:bg-gray-700 dark:text-white px-2 py-1"
									value={addMemberRole}
									onChange={e => setAddMemberRole(e.target.value)}
								>
									<option value="GOON">Goon</option>
									<option value="HASHIRA">Hashira</option>
								</select>
								<Button color="primary" onClick={handleAddMember}>
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
										{team.statistics.totalTasks}
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
									<div className="text-xs text-gray-500">Completed</div>
									<div className="text-xl font-bold">
										{team.statistics.completedTasks}
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
									<div className="text-xs text-gray-500">In Progress</div>
									<div className="text-xl font-bold">
										{team.statistics.inProgressTasks}
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center col-span-2 md:col-span-1">
									<div className="text-xs text-gray-500">Total Earnings</div>
									<div className="text-xl font-bold">
										${team.statistics.totalEarnings}
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
