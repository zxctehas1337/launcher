import React from 'react'
import { IconProps } from './types'

export const IconCommunity: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg
        className={`roulette-community-icon ${className || ''}`}
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <defs>
            <filter id="eliteGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Roulette Track */}
        <circle cx="24" cy="24" r="16" className="roulette-track" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.2" />

        {/* Rotation Container */}
        <g className="roulette-container">
            {/* Person 1 - 0deg (Top) */}
            <g className="person-wrapper p1">
                <g className="person-icon">
                    <circle cx="24" cy="12" r="4.5" className="h" />
                    <path d="M16 22c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" className="b" />
                </g>
            </g>

            {/* Person 2 - 120deg */}
            <g className="person-wrapper p2">
                <g className="person-icon">
                    <circle cx="24" cy="12" r="4.5" className="h" />
                    <path d="M16 22c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" className="b" />
                </g>
            </g>

            {/* Person 3 - 240deg */}
            <g className="person-wrapper p3">
                <g className="person-icon">
                    <circle cx="24" cy="12" r="4.5" className="h" />
                    <path d="M16 22c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" className="b" />
                </g>
            </g>
        </g>

        {/* Selection Frame / Marker */}
        <path d="M24 4l3 5h-6z" fill="var(--accent-primary, #ff8c00)" className="marker" />

        <style>{`
      .roulette-community-icon { overflow: visible; }
      
      .roulette-container {
        animation: rouletteSpin 6s infinite cubic-bezier(0.65, 0, 0.35, 1);
        transform-origin: 24px 24px;
      }

      @keyframes rouletteSpin {
        0% { transform: rotate(0deg); }
        33.33% { transform: rotate(120deg); }
        66.66% { transform: rotate(240deg); }
        100% { transform: rotate(360deg); }
      }

      .person-wrapper {
        transform-origin: 24px 24px;
      }
      
      .p1 { transform: rotate(0deg); }
      .p2 { transform: rotate(120deg); }
      .p3 { transform: rotate(240deg); }

      /* Counter-rotation to keep people upright */
      .person-icon {
        animation: counterRotate 6s infinite cubic-bezier(0.65, 0, 0.35, 1);
        transform-origin: 24px 12px;
      }

      @keyframes counterRotate {
        0% { transform: rotate(0deg); }
        33.33% { transform: rotate(-120deg); }
        66.66% { transform: rotate(-240deg); }
        100% { transform: rotate(-360deg); }
      }

      .h, .b {
        stroke: currentColor;
        fill: rgba(255,140,0,0.05);
        transition: all 0.3s ease;
      }

      /* Highlight effect when at the top */
      .p1 .person-icon { animation: counterRotate 6s infinite cubic-bezier(0.65, 0, 0.35, 1), p1Highlight 6s infinite cubic-bezier(0.65, 0, 0.35, 1); }
      .p2 .person-icon { animation: counterRotate 6s infinite cubic-bezier(0.65, 0, 0.35, 1), p2Highlight 6s infinite cubic-bezier(0.65, 0, 0.35, 1); }
      .p3 .person-icon { animation: counterRotate 6s infinite cubic-bezier(0.65, 0, 0.35, 1), p3Highlight 6s infinite cubic-bezier(0.65, 0, 0.35, 1); }

      @keyframes p1Highlight {
        0%, 15%, 85%, 100% { stroke: var(--accent-primary, #ff8c00); fill: rgba(255,140,0,0.2); filter: drop-shadow(0 0 2px var(--accent-primary, #ff8c00)); }
        25%, 75% { stroke: currentColor; fill: rgba(255,140,0,0.05); filter: none; }
      }
      @keyframes p2Highlight {
        18%, 48% { stroke: var(--accent-primary, #ff8c00); fill: rgba(255,140,0,0.2); filter: drop-shadow(0 0 2px var(--accent-primary, #ff8c00)); }
        0%, 10%, 55%, 100% { stroke: currentColor; fill: rgba(255,140,0,0.05); filter: none; }
      }
      @keyframes p3Highlight {
        51%, 81% { stroke: var(--accent-primary, #ff8c00); fill: rgba(255,140,0,0.2); filter: drop-shadow(0 0 2px var(--accent-primary, #ff8c00)); }
        0%, 45%, 85%, 100% { stroke: currentColor; fill: rgba(255,140,0,0.05); filter: none; }
      }

      .marker {
        animation: markerBounce 2s infinite ease-in-out;
      }
      @keyframes markerBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(2px); }
      }
    `}</style>
    </svg>
)
