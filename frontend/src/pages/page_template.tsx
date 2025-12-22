import React, { useState, useEffect } from "react";

const PageTemplate: React.FC<{ user: any }> = ({ user }) => {
	// Mock bounties data - replace with actual API call
	useEffect(() => {}, [user]);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
			fuck you this is PageTemplate
		</div>
	);
};

export default PageTemplate;
