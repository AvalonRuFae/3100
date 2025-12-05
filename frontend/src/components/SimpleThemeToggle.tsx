import React from 'react';
import { Button } from '@heroui/button';

interface SimpleThemeToggleProps {
  className?: string;
}

const SimpleThemeToggle: React.FC<SimpleThemeToggleProps> = ({ className = '' }) => {
  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  // Initialize theme on component mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <Button
      isIconOnly
      variant="light"
      className={`text-gray-600 dark:text-gray-400 hover:text-primary ${className}`}
      onClick={toggleTheme}
    >
      {isDark ? '☀️' : '🌙'}
    </Button>
  );
};

export default SimpleThemeToggle;