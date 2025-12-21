import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
} from "@heroui/modal";
import BountyCard, { Bounty } from "@/components/BountyCard";
import { SearchIcon } from "@/components/icons";
import SimpleThemeToggle from "@/components/SimpleThemeToggle";

const Dashboard: React.FC<{ user: any }> = ({ user }) => {
	const [bounties, setBounties] = useState<Bounty[]>([]);
	const [filteredBounties, setFilteredBounties] = useState<Bounty[]>([]);
	const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [priorityFilter, setPriorityFilter] = useState("ALL");
	const { isOpen, onOpen, onClose } = useDisclosure();

	// Mock bounties data - replace with actual API call
	useEffect(() => {
		const mockBounties: Bounty[] = [
			{
				id: "1",
				title: "Fix Authentication Bug",
				description:
					"There is a critical bug in the login system that prevents users from accessing their accounts. Need to investigate and fix the JWT token validation.",
				bountyAmount: 250.0,
				deadline: "2025-12-10T23:59:59Z",
				status: "AVAILABLE",
				priority: "HIGH",
				createdBy: "Hashira_Master",
				tags: ["Backend", "Authentication", "Critical"],
				estimatedHours: 4,
			},
			{
				id: "2",
				title: "Implement Dark Mode",
				description:
					"Add dark mode support to the entire application. This includes updating all components to respect the theme preference.",
				bountyAmount: 150.0,
				deadline: "2025-12-15T23:59:59Z",
				status: "AVAILABLE",
				priority: "MEDIUM",
				createdBy: "UI_Hashira",
				tags: ["Frontend", "UI/UX", "Theme"],
				estimatedHours: 8,
			},
			{
				id: "3",
				title: "Database Optimization",
				description:
					"Optimize database queries for better performance. Focus on the user and task tables that are experiencing slow response times.",
				bountyAmount: 300.0,
				deadline: "2025-12-20T23:59:59Z",
				status: "IN_PROGRESS",
				priority: "HIGH",
				createdBy: "DB_Hashira",
				assignedTo: user?.username,
				tags: ["Database", "Performance", "SQL"],
				estimatedHours: 12,
			},
			{
				id: "4",
				title: "Create User Profile Page",
				description:
					"Design and implement a comprehensive user profile page where users can view and edit their information.",
				bountyAmount: 200.0,
				deadline: "2025-12-25T23:59:59Z",
				status: "AVAILABLE",
				priority: "MEDIUM",
				createdBy: "Frontend_Hashira",
				tags: ["Frontend", "Profile", "Forms"],
				estimatedHours: 6,
			},
			{
				id: "5",
				title: "API Documentation",
				description:
					"Write comprehensive API documentation for all endpoints. Include examples and error handling scenarios.",
				bountyAmount: 100.0,
				deadline: "2025-12-30T23:59:59Z",
				status: "AVAILABLE",
				priority: "LOW",
				createdBy: "API_Hashira",
				tags: ["Documentation", "API", "Backend"],
				estimatedHours: 10,
			},
			{
				id: "6",
				title: "Mobile Responsive Design",
				description:
					"Ensure all pages are fully responsive and work seamlessly on mobile devices.",
				bountyAmount: 180.0,
				deadline: "2025-12-12T23:59:59Z",
				status: "REVIEW",
				priority: "HIGH",
				createdBy: "Mobile_Hashira",
				assignedTo: "another_goon",
				tags: ["Frontend", "Mobile", "CSS"],
				estimatedHours: 5,
			},
		];

		setBounties(mockBounties);
		setFilteredBounties(mockBounties);
	}, [user]);

	// Filter bounties based on search and filters
	useEffect(() => {
		let filtered = bounties;

		if (searchTerm) {
			filtered = filtered.filter(
				(bounty) =>
					bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					bounty.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
					bounty.tags.some((tag) =>
						tag.toLowerCase().includes(searchTerm.toLowerCase())
					)
			);
		}

		if (statusFilter !== "ALL") {
			filtered = filtered.filter((bounty) => bounty.status === statusFilter);
		}

		if (priorityFilter !== "ALL") {
			filtered = filtered.filter(
				(bounty) => bounty.priority === priorityFilter
			);
		}

		setFilteredBounties(filtered);
	}, [searchTerm, statusFilter, priorityFilter, bounties]);

	const handleBountyClick = (bounty: Bounty) => {
		setSelectedBounty(bounty);
		onOpen();
	};

	const handleTakeTask = (bountyId: string) => {
		// Simulate taking a task - replace with actual API call
		setBounties((prevBounties) =>
			prevBounties.map((bounty) =>
				bounty.id === bountyId
					? {
							...bounty,
							status: "IN_PROGRESS" as const,
							assignedTo: user?.username,
						}
					: bounty
			)
		);
	};

	const availableBounties = filteredBounties.filter(
		(b) => b.status === "AVAILABLE" || b.assignedTo !== user?.username
	);
	const myTasks = filteredBounties.filter(
		(b) => b.assignedTo === user?.username
	);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
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
										{availableBounties.length}
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
										{myTasks.length}
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
										${user?.balance?.toFixed(2) || "0.00"}
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
										87%
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Filters */}
					<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
						<div className="flex flex-col lg:flex-row gap-4">
							<Input
								placeholder="Search bounties..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								startContent={<SearchIcon />}
								className="flex-1"
							/>
							<Select
								placeholder="Filter by Status"
								selectedKeys={statusFilter === "ALL" ? [] : [statusFilter]}
								onSelectionChange={(keys) =>
									setStatusFilter((Array.from(keys)[0] as string) || "ALL")
								}
								className="w-full lg:w-48"
							>
								<SelectItem key="ALL">All Statuses</SelectItem>
								<SelectItem key="AVAILABLE">Available</SelectItem>
								<SelectItem key="IN_PROGRESS">In Progress</SelectItem>
								<SelectItem key="REVIEW">In Review</SelectItem>
								<SelectItem key="COMPLETED">Completed</SelectItem>
							</Select>
							<Select
								placeholder="Filter by Priority"
								selectedKeys={priorityFilter === "ALL" ? [] : [priorityFilter]}
								onSelectionChange={(keys) =>
									setPriorityFilter((Array.from(keys)[0] as string) || "ALL")
								}
								className="w-full lg:w-48"
							>
								<SelectItem key="ALL">All Priorities</SelectItem>
								<SelectItem key="HIGH">High</SelectItem>
								<SelectItem key="MEDIUM">Medium</SelectItem>
								<SelectItem key="LOW">Low</SelectItem>
							</Select>
						</div>
					</div>

					{/* My Tasks Section */}
					{myTasks.length > 0 && (
						<div className="mb-8">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
								My Active Tasks
							</h2>
							<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
								{myTasks.map((bounty) => (
									<BountyCard
										key={bounty.id}
										bounty={bounty}
										onClick={handleBountyClick}
										isUserTask={true}
									/>
								))}
							</div>
						</div>
					)}

					{/* Available Bounties */}
					<div>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Available Bounties
						</h2>
						{filteredBounties.length === 0 ? (
							<div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
								<p className="text-gray-500 dark:text-gray-400">
									No bounties found matching your criteria.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
								{availableBounties.map((bounty) => (
									<BountyCard
										key={bounty.id}
										bounty={bounty}
										onClick={handleBountyClick}
										onTakeTask={handleTakeTask}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Bounty Detail Modal */}
			<Modal size="2xl" isOpen={isOpen} onClose={onClose}>
				<ModalContent>
					{selectedBounty && (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<h2 className="text-xl font-bold">{selectedBounty.title}</h2>
								<p className="text-sm text-gray-600">
									Created by {selectedBounty.createdBy}
								</p>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<div>
										<h3 className="font-semibold mb-2">Description</h3>
										<p className="text-gray-700 dark:text-gray-300">
											{selectedBounty.description}
										</p>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<h4 className="font-semibold">Bounty Amount</h4>
											<p className="text-2xl font-bold text-success">
												${selectedBounty.bountyAmount.toFixed(2)}
											</p>
										</div>
										<div>
											<h4 className="font-semibold">Deadline</h4>
											<p>
												{new Date(selectedBounty.deadline).toLocaleDateString()}
											</p>
										</div>
									</div>

									<div>
										<h4 className="font-semibold mb-2">Tags</h4>
										<div className="flex flex-wrap gap-2">
											{selectedBounty.tags.map((tag, index) => (
												<span
													key={index}
													className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded text-sm"
												>
													{tag}
												</span>
											))}
										</div>
									</div>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={onClose}>
									Close
								</Button>
								{selectedBounty.status === "AVAILABLE" &&
									selectedBounty.assignedTo !== user?.username && (
										<Button
											color="primary"
											onPress={() => {
												handleTakeTask(selectedBounty.id);
												onClose();
											}}
										>
											Take This Task
										</Button>
									)}
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
};

export default Dashboard;
