import React from 'react';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  bountyAmount: number;
  deadline: string;
  status: 'AVAILABLE' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdBy: string;
  assignedTo?: string;
  tags: string[];
  estimatedHours?: number;
}

interface BountyCardProps {
  bounty: Bounty;
  onClick?: (bounty: Bounty) => void;
  onTakeTask?: (bountyId: string) => void;
  isUserTask?: boolean;
}

const BountyCard: React.FC<BountyCardProps> = ({ 
  bounty, 
  onClick, 
  onTakeTask, 
  isUserTask = false 
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'IN_PROGRESS':
        return 'primary';
      case 'REVIEW':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', color: 'text-danger' };
    } else if (diffDays === 0) {
      return { text: 'Due Today', color: 'text-warning' };
    } else if (diffDays === 1) {
      return { text: 'Due Tomorrow', color: 'text-warning' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: 'text-primary' };
    } else {
      return { text: `${diffDays} days left`, color: 'text-success' };
    }
  };

  const deadlineInfo = formatDeadline(bounty.deadline);

  return (
    <Card 
      isPressable
      className="w-full hover:scale-105 transition-transform duration-200 cursor-pointer"
      onClick={() => onClick?.(bounty)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full">
          <div className="flex-1">
            <h3 className="text-lg font-semibold line-clamp-2">{bounty.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              by {bounty.createdBy}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Chip
              size="sm"
              color={getPriorityColor(bounty.priority)}
              variant="flat"
            >
              {bounty.priority}
            </Chip>
            <Chip
              size="sm"
              color={getStatusColor(bounty.status)}
              variant="flat"
            >
              {bounty.status.replace('_', ' ')}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="py-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-4">
          {bounty.description}
        </p>

        {/* Tags */}
        {bounty.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {bounty.tags.map((tag, index) => (
              <Chip
                key={index}
                size="sm"
                variant="bordered"
                className="text-xs"
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}

        {/* Additional Info */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span className={deadlineInfo.color}>
            📅 {deadlineInfo.text}
          </span>
          {bounty.estimatedHours && (
            <span>
              ⏱️ ~{bounty.estimatedHours}h
            </span>
          )}
        </div>
      </CardBody>

      <CardFooter className="pt-2">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-success">
              ${bounty.bountyAmount.toFixed(2)}
            </span>
          </div>
          
          {!isUserTask && bounty.status === 'AVAILABLE' && (
            <Button
              color="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTakeTask?.(bounty.id);
              }}
            >
              Take Task
            </Button>
          )}
          
          {isUserTask && (
            <Button
              variant="bordered"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(bounty);
              }}
            >
              View Details
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default BountyCard;