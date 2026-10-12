import { LucideIcon } from 'lucide-react';

export type ItemProps = {
  label: string;
  isSelected: boolean;
  link: string;
  icon: LucideIcon;
  badge?: number;
};

const Item = ({ label, isSelected, link, icon: Icon, badge }: ItemProps) => {
  return (
    <a href={link}>
      <li
        className={`${isSelected ? 'text-white font-bold' : 'text-gray-400'} flex items-center gap-4 cursor-pointer hover:text-white transition-colors`}
      >
        <Icon
          size={isSelected ? 20 : 18}
          className={isSelected ? 'text-white' : 'text-gray-500'}
        />
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
            {badge}
          </span>
        )}
      </li>
    </a>
  );
};

export default Item;
