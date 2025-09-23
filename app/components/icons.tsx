import { createElement, forwardRef, type SVGProps } from 'react'

// Paths copied from lucide-react (ISC license)
// https://github.com/lucide-icons/lucide

type IconTag = 'path' | 'circle' | 'rect' | 'line' | 'polyline'

type IconNode = Array<[IconTag, Record<string, string>]>

type IconProps = SVGProps<SVGSVGElement>

const defaultSvgProps: IconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

const createIcon = (iconName: string, iconNode: IconNode) => {
  const Component = forwardRef<SVGSVGElement, IconProps>(({ className, ...props }, ref) => (
    <svg ref={ref} className={className} {...defaultSvgProps} {...props}>
      {iconNode.map(([tag, attrs], index) =>
        createElement(tag, { ...attrs, key: `${iconName}-${index}` })
      )}
    </svg>
  ))

  Component.displayName = iconName
  return Component
}

const icons: Record<string, IconNode> = {
  ArrowLeft: [
    ['path', { d: 'm12 19-7-7 7-7' }],
    ['path', { d: 'M19 12H5' }]
  ],
  ArrowRight: [
    ['path', { d: 'M5 12h14' }],
    ['path', { d: 'm12 5 7 7-7 7' }]
  ],
  AlertCircle: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
    ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }]
  ],
  AlertTriangle: [
    ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }],
    ['path', { d: 'M12 9v4' }],
    ['path', { d: 'M12 17h.01' }]
  ],
  Calendar: [
    ['path', { d: 'M8 2v4' }],
    ['path', { d: 'M16 2v4' }],
    ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }],
    ['path', { d: 'M3 10h18' }]
  ],
  CheckCircle: [
    ['path', { d: 'M21.801 10A10 10 0 1 1 17 3.335' }],
    ['path', { d: 'm9 11 3 3L22 4' }]
  ],
  ChevronDown: [
    ['path', { d: 'm6 9 6 6 6-6' }]
  ],
  DollarSign: [
    ['line', { x1: '12', x2: '12', y1: '2', y2: '22' }],
    ['path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }]
  ],
  Download: [
    ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
    ['polyline', { points: '7 10 12 15 17 10' }],
    ['line', { x1: '12', x2: '12', y1: '15', y2: '3' }]
  ],
  FileText: [
    ['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }],
    ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }],
    ['path', { d: 'M10 9H8' }],
    ['path', { d: 'M16 13H8' }],
    ['path', { d: 'M16 17H8' }]
  ],
  Info: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M12 16v-4' }],
    ['path', { d: 'M12 8h.01' }]
  ],
  Loader2: [
    ['path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' }]
  ],
  TrendingUp: [
    ['polyline', { points: '22 7 13.5 15.5 8.5 10.5 2 17' }],
    ['polyline', { points: '16 7 22 7 22 13' }]
  ],
  Upload: [
    ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
    ['polyline', { points: '17 8 12 3 7 8' }],
    ['line', { x1: '12', x2: '12', y1: '3', y2: '15' }]
  ],
  XCircle: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'm15 9-6 6' }],
    ['path', { d: 'm9 9 6 6' }]
  ]
}

type IconName = keyof typeof icons

const exports: Record<IconName, ReturnType<typeof createIcon>> = Object.entries(icons).reduce((acc, [name, node]) => {
  acc[name as IconName] = createIcon(name, node)
  return acc
}, {} as Record<IconName, ReturnType<typeof createIcon>>)

export const ArrowLeft = exports.ArrowLeft
export const ArrowRight = exports.ArrowRight
export const AlertCircle = exports.AlertCircle
export const AlertTriangle = exports.AlertTriangle
export const Calendar = exports.Calendar
export const CheckCircle = exports.CheckCircle
export const ChevronDown = exports.ChevronDown
export const DollarSign = exports.DollarSign
export const Download = exports.Download
export const FileText = exports.FileText
export const Info = exports.Info
export const Loader2 = exports.Loader2
export const TrendingUp = exports.TrendingUp
export const Upload = exports.Upload
export const XCircle = exports.XCircle

export type { IconProps }
