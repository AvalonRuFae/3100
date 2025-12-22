import React from 'react';
import { Button } from '@heroui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface SimpleThemeToggleProps {
  className?: string;
}

const SimpleThemeToggle: React.FC<SimpleThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      isIconOnly
      variant="light"
      className={`text-gray-600 dark:text-gray-400 hover:text-primary ${className}`}
      onClick={toggleTheme}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
};

export default SimpleThemeToggle;