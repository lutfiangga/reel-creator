import { twMerge } from 'tailwind-merge';

export const cn = (...classes) => twMerge(classes.filter(Boolean).join(' '));
export const seconds = (value) => `${Number(value || 0).toFixed(1)}s`;
