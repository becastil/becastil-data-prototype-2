import { Metadata } from 'next'
import CSVDataVisualizer from '@/app/components/CSVDataVisualizer'

export const metadata: Metadata = {
  title: 'CSV Data Visualizer',
  description: 'Upload CSV files and generate automated insights powered by AI-generated analysis code.',
}

export const dynamic = 'force-static'

export default function CSVDataVisualizerPage() {
  return <CSVDataVisualizer />
}
