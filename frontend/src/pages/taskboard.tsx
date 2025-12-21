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

const Taskboard: React.FC<{ user: any }> = ({ user }) => {
	const [bounties, setBounties] = useState<Bounty[]>([]);
	const [filteredBounties, setFilteredBounties] = useState<Bounty[]>([]);
	const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [priorityFilter, setPriorityFilter] = useState("ALL");
	const [tagFilter, setTagFilter] = useState("ALL");
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [showConfirmTake, setShowConfirmTake] = useState(false);
	const [pendingTakeBounty, setPendingTakeBounty] = useState<Bounty | null>(null);

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

	// Collect all unique tags from bounties
	const allTags = React.useMemo(() => {
		const tagSet = new Set<string>();
		bounties.forEach((b) => b.tags.forEach((t) => tagSet.add(t)));
		return Array.from(tagSet);
	}, [bounties]);

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

		if (priorityFilter !== "ALL") {
			filtered = filtered.filter(
				(bounty) => bounty.priority === priorityFilter
			);
		}

		if (tagFilter !== "ALL") {
			filtered = filtered.filter((bounty) =>
				bounty.tags.includes(tagFilter)
			);
		}

		setFilteredBounties(filtered);
	}, [searchTerm, priorityFilter, tagFilter, bounties]);

	// Only show available and not taken bounties in main board
	const availableBounties = filteredBounties.filter(
		(b) => b.status === "AVAILABLE" && !b.assignedTo
	);

	// Sort priorities: HIGH > MEDIUM > LOW
	const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
	const myTasks = filteredBounties
		.filter((b) => b.assignedTo === user?.username)
		.sort((a, b) => {
			const dateA = new Date(a.deadline).getTime();
			const dateB = new Date(b.deadline).getTime();
			if (dateA !== dateB) return dateA - dateB;
			return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) -
				(priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3);
		});

	const handleBountyClick = (bounty: Bounty) => {
		setSelectedBounty(bounty);
		onOpen();
	};

	const handleTakeTask = (bountyId: string) => {
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

	const handleRequestTakeTask = (bounty: Bounty) => {
		setPendingTakeBounty(bounty);
		setShowConfirmTake(true);
	};

	const handleConfirmTakeTask = () => {
		if (pendingTakeBounty) {
			handleTakeTask(pendingTakeBounty.id);
			setShowConfirmTake(false);
			onClose();
			setPendingTakeBounty(null);
		}
	};

	const handleCancelTakeTask = () => {
		setShowConfirmTake(false);
		setPendingTakeBounty(null);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
			{/* Main Content */}
			<div className="flex-1 lg:ml-0 transition-all duration-300 mr-80">
				{/* Header */}
				<header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center space-x-4">
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								Taskboard
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
							<SimpleThemeToggle />
						</div>
					</div>
				</header>

				<div className="p-6">
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
							<Select
								placeholder="Filter by Tag"
								selectedKeys={tagFilter === "ALL" ? [] : [tagFilter]}
								onSelectionChange={(keys) =>
									setTagFilter((Array.from(keys)[0] as string) || "ALL")
								}
								className="w-full lg:w-48"
							>
								<SelectItem key="ALL">All Tags</SelectItem>
								{/* allTags.map is correct usage, no error here */}
								{allTags.map((tag) => (
									<SelectItem key={tag}>{tag}</SelectItem>
								))}
							</Select>
						</div>
					</div>

					{/* Only show available bounties */}
					<div>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Available Bounties
						</h2>
						{availableBounties.length === 0 ? (
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
										// Do NOT pass onTakeTask, disables take task button on card
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* My Tasks Fixed Sidebar */}
			<div
				className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-lg z-50 border-l border-gray-200 dark:border-gray-700 flex flex-col"
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
						My Active Tasks
					</h2>
					{/* Remove Close button */}
				</div>
				<div className="p-4 overflow-y-auto flex-1">
					{myTasks.length === 0 ? (
						<p className="text-gray-500 dark:text-gray-400">No active tasks.</p>
					) : (
						<div className="space-y-4">
							{myTasks.map((bounty) => (
								<div
									key={bounty.id}
									className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900 transition"
									onClick={() => handleBountyClick(bounty)}
								>
									<div className="font-semibold text-gray-900 dark:text-white truncate">{bounty.title}</div>
									<div className="flex items-center text-xs mt-1 gap-2">
										<span
											className={`px-2 py-0.5 rounded ${
												bounty.priority === "HIGH"
													? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
													: bounty.priority === "MEDIUM"
													? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
													: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
											}`}
										>
											{bounty.priority}
										</span>
										<span className="text-gray-500 dark:text-gray-400">
											{bounty.status}
										</span>
										<span className="ml-auto text-gray-600 dark:text-gray-300">
											Due: {new Date(bounty.deadline).toLocaleDateString()}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
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
											onPress={() => handleRequestTakeTask(selectedBounty)}
										>
											Take This Task
										</Button>
									)}
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Confirm Take Task Modal */}
			<Modal isOpen={showConfirmTake} onClose={handleCancelTakeTask}>
				<ModalContent>
					<ModalHeader>Confirm Take Task</ModalHeader>
					<ModalBody>
						Are you sure you want to take this task?
						{pendingTakeBounty && (
							<div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
								<strong>{pendingTakeBounty.title}</strong>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button variant="light" onPress={handleCancelTakeTask}>
							Cancel
						</Button>
						<Button color="primary" onPress={handleConfirmTakeTask}>
							Confirm
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
};

export default Taskboard;
