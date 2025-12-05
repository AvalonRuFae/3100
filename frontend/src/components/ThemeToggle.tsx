import React from 'react';
import { Button } from '@heroui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      isIconOnly
      variant="flat"
      className="fixed top-4 right-4 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700"
      onClick={toggleTheme}
    >
      <span className="text-lg">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </Button>
  );
};

export default ThemeToggle;