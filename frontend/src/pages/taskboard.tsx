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
import axios from "axios";

const Taskboard: React.FC<{ user: any }> = ({ user }) => {
	const [bounties, setBounties] = useState<Bounty[]>([]);
	const [filteredBounties, setFilteredBounties] = useState<Bounty[]>([]);
	const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [priorityFilter, setPriorityFilter] = useState("ALL");
	const [tagFilter, setTagFilter] = useState("ALL");
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [showConfirmTake, setShowConfirmTake] = useState(false);
	const [pendingTakeBounty, setPendingTakeBounty] = useState<Bounty | null>(
		null
	);
	const [showMyTakenTasks, setShowTakenTasks] = useState(true);
	const [showCreateTask, setShowCreateTask] = useState(false);
	const [createTaskForm, setCreateTaskForm] = useState({
		title: "",
		description: "",
		bountyAmount: "",
		deadline: "",
		priority: "MEDIUM",
		tags: "",
		estimatedHours: "",
	});
	const [bountyMin, setBountyMin] = useState(""); // for bounty amount filter
	const [showConfirmReview, setShowConfirmReview] = useState(false);
	const [pendingReviewTask, setPendingReviewTask] = useState<Bounty | null>(null);

	// Fetch tasks from API
	useEffect(() => {
		const fetchTasks = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await axios.get('http://localhost:3000/api/v1/tasks', {
					headers: { Authorization: `Bearer ${token}` }
				});
				const apiTasks = response.data.data.map((task: any) => ({
					id: task.id.toString(),
					title: task.title,
					description: task.description,
					bountyAmount: Number(task.bountyAmount),
					deadline: task.deadline,
					status: task.status,
					priority: task.priority,
					createdBy: task.creator?.username || 'Unknown',
					assignedTo: task.assignee?.username,				assignedAt: task.assignedAt,					tags: Array.isArray(task.tags) ? task.tags : [],
					estimatedHours: 0
				}));
				setBounties(apiTasks);
			} catch (error) {
				console.error('Failed to fetch tasks:', error);
				// Fallback to empty array on error
				setBounties([]);
			}
		};
		fetchTasks();

		// Refetch tasks every 5 seconds to keep data in sync
		const interval = setInterval(fetchTasks, 5000);

		return () => clearInterval(interval);
	}, []);

	// Keep old mock data as comment for reference
	/*
	const mockBounties: Bounty[] = [
		{
			id: "1",
			title: "Fix Authentication Bug",
			description: "There is a critical bug...",
			bountyAmount: 250.0,
			deadline: "2025-12-10T23:59:59Z",
			status: "AVAILABLE",
			priority: "HIGH",
			createdBy: "Hashira_Master",
			tags: ["Backend", "Authentication", "Critical"],
			estimatedHours: 4,
		},
		// ... more mock items
	];
	setBounties(mockBounties);
	setFilteredBounties(mockBounties);
	*/

	// Collect all unique tags from ALL bounties (not just filtered)
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
			filtered = filtered.filter((bounty) => bounty.tags.includes(tagFilter));
		}

		if (bountyMin) {
			const min = parseFloat(bountyMin);
			if (!isNaN(min)) {
				filtered = filtered.filter((bounty) => bounty.bountyAmount >= min);
			}
		}

		setFilteredBounties(filtered);
	}, [searchTerm, priorityFilter, tagFilter, bountyMin, bounties]);

	// Only show available and not taken bounties in main board
	const availableBounties = filteredBounties.filter(
		(b) => b.status === "AVAILABLE" && !b.assignedTo
	);

	// Sort priorities: HIGH > MEDIUM > LOW
	const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
	const myTasks = filteredBounties
		.filter((b) => 
			b.assignedTo === user?.username && 
			b.status !== "COMPLETED" && 
			b.status !== "CANCELLED"
		)
		.sort((a, b) => {
			const dateA = new Date(a.deadline).getTime();
			const dateB = new Date(b.deadline).getTime();
			if (dateA !== dateB) return dateA - dateB;
			return (
				(priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) -
				(priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3)
			);
		});

	const handleBountyClick = (bounty: Bounty) => {
		setSelectedBounty(bounty);
		onOpen();
	};

	const handleTakeTask = async (bountyId: string) => {
		try {
			const token = localStorage.getItem('token');
			const response = await axios.post(
				`http://localhost:3000/api/v1/tasks/${bountyId}/assign`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			const updatedTask = response.data.data;
			setBounties((prevBounties) =>
				prevBounties.map((bounty) =>
					bounty.id === bountyId
						? {
								...bounty,
								status: updatedTask.status,
								assignedTo: user?.username,
							}
						: bounty
				)
			);
		} catch (error) {
			console.error('Failed to take task:', error);
			alert('Failed to take task. Please try again.');
		}
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

	// Add handleUpdateStatus for In Progress and Review
	const handleUpdateStatus = (bounty: Bounty, newStatus: "IN_PROGRESS" | "REVIEW") => {
		if (newStatus === "REVIEW") {
			setPendingReviewTask(bounty);
			setShowConfirmReview(true);
			return;
		}
		setBounties((prev) =>
			prev.map((b) =>
				b.id === bounty.id
					? { ...b, status: newStatus }
					: b
			)
		);
		setSelectedBounty((b) =>
			b && b.id === bounty.id ? { ...b, status: newStatus } : b
		);
	};

	const confirmSetReview = async () => {
		if (pendingReviewTask) {
			try {
				const token = localStorage.getItem('token');
				await axios.put(
					`http://localhost:3000/api/v1/tasks/${pendingReviewTask.id}/status`,
					{ status: "REVIEW" },
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setBounties((prev) =>
					prev.map((b) =>
						b.id === pendingReviewTask.id
							? { ...b, status: "REVIEW" }
							: b
					)
				);
				setSelectedBounty((b) =>
					b && b.id === pendingReviewTask.id ? { ...b, status: "REVIEW" } : b
				);
			} catch (error) {
				console.error('Failed to update status:', error);
				alert('Failed to update task status. Please try again.');
			}
		}
		setShowConfirmReview(false);
		setPendingReviewTask(null);
	};

	const isHashiraOrOyakata =
		user?.role === "HASHIRA" || user?.role === "OYAKATASAMA";

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex w-full">
			{/* Main Content */}
			<div className={`flex-1 lg:ml-0 transition-all duration-300 ${showMyTakenTasks ? "mr-80" : ""}`}>
				{/* Header */}
				<header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center space-x-4">
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								Taskboard
							</h1>
						</div>
						{/* Button Bar */}
						<div className="flex items-center space-x-2">
							<Button
								variant={showMyTakenTasks ? "solid" : "bordered"}
								onPress={() => setShowTakenTasks((v) => !v)}
							>
								Taken Tasks
							</Button>
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
								{allTags.map((tag) => (
									<SelectItem key={tag}>{tag}</SelectItem>
								))}
							</Select>
							<Input
								placeholder="Bounty Amount (Min)"
								type="number"
								value={bountyMin}
								onChange={(e) => setBountyMin(e.target.value)}
								className="w-full lg:w-48"
							/>
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
										isUserTask={true}
										// Do NOT pass onTakeTask, disables take task button on card
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* My Tasks Sidebar */}
			{showMyTakenTasks && (
				<div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-lg z-50 border-l border-gray-200 dark:border-gray-700 flex flex-col">
					<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
							 Taken Tasks
						</h2>
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
										<div className="font-semibold text-gray-900 dark:text-white truncate">
											{bounty.title}
										</div>
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
			)}

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
							{/* Submit and Cancel buttons for tasks assigned to user */}
							{selectedBounty.assignedTo === user?.username &&
								!["", "COMPLETED", "CANCELLED"].includes(selectedBounty.status) && (
									<>
										<Button
											color="success"
											onPress={() => handleUpdateStatus(selectedBounty, "REVIEW")}
											disabled={selectedBounty.status === "REVIEW"}
										>
											Submit for Review
										</Button>
										<Button variant="light" onPress={onClose}>
											Cancel
										</Button>
									</>
								)}
							{/* Close button for all other cases */}
							{(selectedBounty.assignedTo !== user?.username ||
								["", "COMPLETED", "CANCELLED"].includes(selectedBounty.status)) && (
								<Button variant="light" onPress={onClose}>
									Close
								</Button>
							)}
							{/* Take Task button for available tasks */}
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

			{/* Confirm Review Status Modal */}
			<Modal isOpen={showConfirmReview} onClose={() => { setShowConfirmReview(false); setPendingReviewTask(null); }}>
				<ModalContent>
					<ModalHeader>Confirm Status Change</ModalHeader>
					<ModalBody>
						Are you sure you want to set this task to <b>In Review</b>?
						{pendingReviewTask && (
							<div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
								<strong>{pendingReviewTask.title}</strong>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button variant="light" onPress={() => { setShowConfirmReview(false); setPendingReviewTask(null); }}>
							Cancel
						</Button>
						<Button color="primary" onPress={confirmSetReview}>
							Confirm
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
};

export default Taskboard;
