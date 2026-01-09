import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortIconProps {
  column: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
}

export default function SortIcon({ column, sortColumn, sortDirection }: SortIconProps) {
  if (sortColumn !== column) {
    return <ArrowUpDown size={14} />;
  }
  return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}
