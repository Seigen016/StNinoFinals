'use client';

import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import { useState } from 'react';
import Item from './Item';

export type NestedItemProps = {
  label: string;
  icon: LucideIcon;
  children: Array<{
    label: string;
    isSelected: boolean;
    link: string;
    icon: LucideIcon;
  }>;
};

const NestedItem = ({ label, icon: Icon, children }: NestedItemProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasSelectedChild = children.some((child) => child.isSelected);

  return (
    <div>
      <li
        className={`${hasSelectedChild ? 'text-white font-bold' : 'text-gray-400'} flex items-center gap-4 cursor-pointer hover:text-white transition-colors`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon
          size={hasSelectedChild ? 20 : 18}
          className={hasSelectedChild ? 'text-white' : 'text-gray-500'}
        />
        <span className="flex-1">{label}</span>
        {isOpen ? (
          <ChevronDown size={16} className="text-white" />
        ) : (
          <ChevronRight size={16} className="text-white" />
        )}
      </li>
      {isOpen && (
        <ul className="ml-8 mt-4 flex flex-col gap-6">
          {children.map((child, index) => (
            <Item
              key={index}
              label={child.label}
              isSelected={child.isSelected}
              link={child.link}
              icon={child.icon}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default NestedItem;
