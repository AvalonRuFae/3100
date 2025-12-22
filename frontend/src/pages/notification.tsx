import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { NotificationIcon } from "@/components/icons";
const baseApiUrl = "http://localhost:3000/api/v1";

interface NotificationItem {
	id: number;
	userId: number;
	type: string;
	message: string;
	relatedId: number;
	readStatus: boolean;
	createdAt: string;
}

const mockNotifications: NotificationItem[] = [
	{
		id: 1,
		userId: 1,
		type: "TASK_ASSIGNED",
		message: "You have been assigned a new task!",
		relatedId: 101,
		readStatus: false,
		createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
	},
	{
		id: 2,
		userId: 1,
		type: "BOUNTY_COMPLETED",
		message: "Your bounty has been completed!",
		relatedId: 102,
		readStatus: true,
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
	},
	{
		id: 3,
		userId: 1,
		type: "DEADLINE_REMINDER",
		message: "A task deadline is approaching soon.",
		relatedId: 103,
		readStatus: false,
		createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
	},
];

const Notification: React.FC<{ user: any }> = ({ user }) => {
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [showUnreadOnly, setShowUnreadOnly] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);

	// Fetch notifications from backend
	const fetchNotifications = async (unreadOnly = false) => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const url = `${baseApiUrl}/notifications?${unreadOnly ? "unread=true" : ""}`;
			const res = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setNotifications(data.data);
			} else {
				setNotifications([]);
			}
		} catch {
			setNotifications([]);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchNotifications(showUnreadOnly);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, showUnreadOnly]);

	const unreadCount = notifications.filter((n) => !n.readStatus).length;

	const filteredNotifications = notifications.filter((n) => {
		if (showUnreadOnly && n.readStatus) return false;
		if (
			searchTerm &&
			!n.message.toLowerCase().includes(searchTerm.toLowerCase())
		)
			return false;
		return true;
	});

	// Mark a notification as read (API)
	const handleMarkAsRead = async (id: number) => {
		try {
			console.log("Marking as read:", id);
			const token = localStorage.getItem("token");
			const res = await fetch(`${baseApiUrl}/notifications/${id}/read`, {
				method: "PUT",
				headers: { Authorization: `Bearer ${token}` },
			});
			console.log("Marked as read, ok?", res.ok);
			if (res.ok) {
				fetchNotifications(showUnreadOnly);
			}
		} catch {}
	};

	// Mark all notifications as read (API)
	const handleMarkAllAsRead = async () => {
		try {
			const token = localStorage.getItem("token");
			const res = await fetch(`${baseApiUrl}/notifications/read-all`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
			}
		} catch {}
	};

	// Delete a notification (API)
	const handleDelete = async (id: number) => {
		try {
			const token = localStorage.getItem("token");
			const res = await fetch(`${baseApiUrl}/notifications/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				setNotifications((prev) => prev.filter((n) => n.id !== id));
			}
		} catch {}
	};

	// Expand notification and mark as read if unread
	const handleExpand = async (notification: NotificationItem) => {
		setExpandedId(expandedId === notification.id ? null : notification.id);
		if (!notification.readStatus) await handleMarkAsRead(notification.id);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex w-full">
			<div className="flex-1 lg:ml-0 transition-all duration-300 mx-auto">
				{/* Header */}
				<header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center space-x-4">
							<NotificationIcon className="w-8 h-8 text-primary" />
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								Notifications
							</h1>
							{unreadCount > 0 && (
								<span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
									{unreadCount} Unread
								</span>
							)}
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant={showUnreadOnly ? "solid" : "bordered"}
								onPress={() => setShowUnreadOnly((v) => !v)}
							>
								{showUnreadOnly ? "Show All" : "Show Unread"}
							</Button>
							<Button
								variant="bordered"
								onPress={handleMarkAllAsRead}
								disabled={unreadCount === 0}
							>
								Mark All as Read
							</Button>
						</div>
					</div>
				</header>

				<div className="p-6">
					{/* Search Bar */}
					<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex gap-4 items-center">
						<Input
							placeholder="Search notifications..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="flex-1"
						/>
					</div>

					{/* Notification List - Email/Inbox Style */}
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
						{filteredNotifications.length === 0 ? (
							<div className="p-8 text-center text-gray-500 dark:text-gray-400">
								No notifications found.
							</div>
						) : (
							filteredNotifications.map((n) => (
								<div key={n.id}>
									<div
										className={`flex items-center px-4 py-3 cursor-pointer transition group ${
											!n.readStatus
												? "bg-primary-50 dark:bg-primary-900/30 font-semibold border-l-4 border-primary-500"
												: "hover:bg-gray-100 dark:hover:bg-gray-900"
										}`}
										onClick={() => handleExpand(n)}
									>
										<NotificationIcon className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="truncate">
													{n.type.replace(/_/g, " ")}
												</span>
												{!n.readStatus && (
													<span className="ml-2 px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-semibold">
														New
													</span>
												)}
											</div>
											<div className="truncate text-gray-700 dark:text-gray-300 text-sm">
												{n.message}
											</div>
										</div>
										<div className="ml-4 flex flex-col items-end">
											<span className="text-xs text-gray-500 dark:text-gray-400">
												{new Date(n.createdAt).toLocaleString()}
											</span>
											<div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button
													size="sm"
													variant="light"
													onClick={(e) => {
														e.stopPropagation();
														handleDelete(n.id);
													}}
												>
													Delete
												</Button>
												{!n.readStatus && (
													<Button
														size="sm"
														variant="light"
														onClick={(e) => {
															e.stopPropagation();
															handleMarkAsRead(n.id);
														}}
													>
														Mark as Read
													</Button>
												)}
											</div>
										</div>
									</div>
									{/* Inline Expansion for Details */}
									{expandedId === n.id && (
										<div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 border-t border-gray-200 dark:border-gray-800 animate-fade-in">
											<div className="mb-2 text-gray-700 dark:text-gray-300">
												{n.message}
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
												{new Date(n.createdAt).toLocaleString()}
											</div>
											<div className="flex gap-2">
												<Button
													variant="light"
													onClick={() => setExpandedId(null)}
												>
													Close
												</Button>
												{!n.readStatus && (
													<Button
														color="primary"
														onClick={() => handleMarkAsRead(n.id)}
													>
														Mark as Read
													</Button>
												)}
												<Button
													color="danger"
													onClick={() => handleDelete(n.id)}
												>
													Delete
												</Button>
											</div>
										</div>
									)}
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Notification;
