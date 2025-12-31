import React from 'react'
import { IconProps } from './types'

export const IconBolt: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M26 4L14 24H24L22 44L34 24H24L26 4Z" fill="currentColor" />
    </svg>
)

export const IconDesktop: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="8" width="36" height="26" rx="2" />
        <path d="M6 30H42" />
        <path d="M18 40H30" strokeLinecap="round" />
        <path d="M24 34V40" />
    </svg>
)

export const IconSliders: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="10" width="28" height="4" rx="1" fill="currentColor" />
        <rect x="10" y="18" width="28" height="4" rx="1" fill="currentColor" />
        <rect x="10" y="26" width="28" height="4" rx="1" fill="currentColor" />
        <rect x="10" y="34" width="20" height="4" rx="1" fill="currentColor" />
    </svg>
)

export const IconRefresh: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg className={`${className} animate-spin`} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 24a16 16 0 0 1-28.8 9.6" />
        <path d="M8 24A16 16 0 0 1 36.8 14.4" />
        <path d="M36 8v8h-8" />
        <path d="M12 40v-8h8" />
    </svg>
)
