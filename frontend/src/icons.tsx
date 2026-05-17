import { Feather } from '@expo/vector-icons';
import React from 'react';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
  style?: any;
};

const make = (name: React.ComponentProps<typeof Feather>['name']) => {
  const Icon = ({ color, size = 22, style }: IconProps) =>
    <Feather name={name} size={size} color={color} style={style} />;
  Icon.displayName = `FeatherIcon(${name})`;
  return Icon;
};

export const Bell = make('bell');
export const BellRing = make('bell');
export const ClipboardList = make('clipboard');
export const Plus = make('plus');
export const ChevronRight = make('chevron-right');
export const ArrowLeft = make('arrow-left');
export const Search = make('search');
export const FileText = make('file-text');
export const Calendar = make('calendar');
export const LogOut = make('log-out');
export const Pencil = make('edit-2');
export const Trash2 = make('trash-2');
export const Hash = make('hash');
export const Save = make('save');
export const User = make('user');
