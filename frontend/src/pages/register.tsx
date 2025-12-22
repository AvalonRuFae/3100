import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useAuth } from "@/contexts/AuthContext";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/icons";

const RegisterPage: React.FC = () => {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role] = useState("OYAKATASAMA");
	const [isVisible, setIsVisible] = useState(false);
	const [error, setError] = useState("");
	const { register, isLoading } = useAuth();
	const navigate = useNavigate();

	const toggleVisibility = () => setIsVisible(!isVisible);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Client-side validation
		if (username.length < 3 || username.length > 50) {
			setError("Username must be between 3 and 50 characters.");
			return;
		}

		// Email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("Please enter a valid email address (e.g., user@example.com).");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters long.");
			return;
		}

		try {
			await register(username, email, password, role);
			navigate("/dashboard");
		} catch (err: any) {
			// Extract error message from API response
			if (
				err.response?.data?.errors &&
				Array.isArray(err.response.data.errors)
			) {
				// Handle validation errors with specific fields
				const errors = err.response.data.errors;
				const errorMessages = errors
					.map((e: any) => `${e.field}: ${e.message}`)
					.join(", ");
				setError(errorMessages);
			} else {
				const errorMsg =
					err.response?.data?.message ||
					"Registration failed. Please try again.";
				setError(errorMsg);
			}
		}
	};

	const roles = [
		{ key: "GOON", label: "Goon - Junior Developer" },
		{ key: "HASHIRA", label: "Hashira - Senior Developer" },
		{ key: "OYAKATASAMA", label: "Oyakatasama - Administrator" },
	];

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
			<div className="absolute inset-0 bg-black opacity-50"></div>
			<Card className="relative z-10 w-full max-w-md mx-4">
				<CardHeader className="flex flex-col gap-3 pb-6">
					<h1 className="text-2xl font-bold text-center">Join the Corps</h1>
					<p className="text-center text-gray-600">
						Create your account to get started
					</p>
				</CardHeader>
				<CardBody>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
								{error}
							</div>
						)}

						<Input
							type="text"
							label="Username"
							placeholder="Choose a username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							variant="bordered"
						/>

						<Input
							type="email"
							label="Email"
							placeholder="Enter your email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							variant="bordered"
						/>

						{/* Disabled role selection control only for OYAKATASAMA registration */}
						{/* <Select
              label="Role"
              placeholder="Select your role"
              selectedKeys={[role]}
              onSelectionChange={(keys) => setRole(Array.from(keys)[0] as string)}
              variant="bordered"
            >
              {roles.map((roleItem) => (
                <SelectItem key={roleItem.key}>
                  {roleItem.label}
                </SelectItem>
              ))}
            </Select> */}

						<Input
							label="Password"
							placeholder="Create a password (min 8 characters)"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							variant="bordered"
							description="Must be at least 8 characters"
							endContent={
								<button
									className="focus:outline-none"
									type="button"
									onClick={toggleVisibility}
								>
									{isVisible ? (
										<EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
									) : (
										<EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
									)}
								</button>
							}
							type={isVisible ? "text" : "password"}
						/>

						<Input
							label="Confirm Password"
							placeholder="Confirm your password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							variant="bordered"
							type={isVisible ? "text" : "password"}
						/>

						<Button
							type="submit"
							color="primary"
							size="lg"
							className="w-full"
							isLoading={isLoading}
						>
							Register
						</Button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-gray-600">
							Already have an account?{" "}
							<Link to="/login" className="text-primary hover:underline">
								Sign in here
							</Link>
						</p>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default RegisterPage;
