"use client"

import { useState, type ChangeEvent, type ReactNode } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Upload, FileText, Loader2 } from '@/app/components/icons'

type LegendPosition = 'left' | 'right' | 'top' | 'bottom'

type BarChartData = {
  labels: string[]
  values: number[]
  title?: string
}

type BarChartConfig = {
  orientation?: 'horizontal' | 'vertical'
  legendPosition?: LegendPosition
  title?: string
}

type LineChartData = {
  labels: string[]
  values: number[]
  title?: string
}

type TableData = {
  headers: string[]
  rows: Array<Array<string | number | boolean | null>>
}

type CountData = {
  value: number
  label?: string
}

type AnalysisResult =
  | { type: 'bar_chart'; data: BarChartData; config?: BarChartConfig }
  | { type: 'line_chart'; data: LineChartData; config?: Record<string, unknown> }
  | { type: 'table'; data: TableData; config?: Record<string, unknown> }
  | { type: 'count'; data: CountData; config?: Record<string, unknown> }

type DisplayRow = Record<string, string>

const CSVDataVisualizer = () => {
  const [csvData, setCsvData] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [displayData, setDisplayData] = useState<DisplayRow[]>([])
  const [analysisQuery, setAnalysisQuery] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [error, setError] = useState('')

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve((e?.target?.result as string) ?? '')
        reader.onerror = reject
        reader.readAsText(file)
      })

      const lines = text.trim().split('\n')
      const parsedHeaders = lines[0]?.split(',').map(h => h.trim()) ?? []
      setHeaders(parsedHeaders)

      const rows: DisplayRow[] = []
      for (let i = 1; i < Math.min(6, lines.length); i += 1) {
        const values = lines[i].split(',').map(v => v.trim())
        const row: DisplayRow = {}
        parsedHeaders.forEach((header, index) => {
          row[header] = values[index] ?? ''
        })
        rows.push(row)
      }

      setDisplayData(rows)
      setCsvData(text)
      setAnalysisResult(null)
      setError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Error reading CSV file: ${message}`)
    }
  }

  const runAnalysis = async () => {
    if (!csvData || !analysisQuery.trim()) {
      setError('Please upload a CSV file and enter an analysis query')
      return
    }

    setIsLoading(true)
    setLoadingStatus('Planning analysis')
    setError('')

    try {
      const lines = csvData.trim().split('\n')
      const sampleData = lines.slice(0, 6).join('\n')

      const prompt = `Given this CSV data (first 5 rows shown):\n${sampleData}\n\nUser's analysis request: "${analysisQuery}"\n\nWrite JavaScript code to perform this analysis. The code should:\n1. Parse the full CSV data (available in variable 'csvData')\n2. Perform the requested analysis\n3. Output the result in the required format\n\nOutput format:\nanalysisResult = { \n  type: 'bar_chart' | 'line_chart' | 'table' | 'count', \n  data: <appropriate data structure>, \n  config: <optional configuration object> \n};\n\nData structure requirements by type:\n- bar_chart: { labels: string[], values: number[], title?: string }\n- line_chart: { labels: string[], values: number[], title?: string }\n- table: { headers: string[], rows: any[][] }\n- count: { value: number, label?: string }\n\nGuidelines:\n- Choose the most appropriate visualization type based on the analysis\n- For numeric aggregations (sum, average, count), use 'count' type\n- For comparisons between categories, use 'bar_chart'\n- For trends over time, use 'line_chart'\n- For detailed data inspection or pivot tables use 'table'\n- Include meaningful labels and titles where appropriate\n- Handle edge cases gracefully (empty data, missing values, etc.)\n\nIMPORTANT: Return ONLY the JavaScript code. Do not include any markdown formatting, backticks, or explanations.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const generatedCode = data?.content?.[0]?.text

      if (typeof generatedCode !== 'string') {
        throw new Error('Analysis generation returned an invalid response')
      }

      setLoadingStatus('Calculating results')

      const executeAnalysis = new Function(
        'csvData',
        `${generatedCode}\nreturn analysisResult;`
      ) as (inputCsv: string) => AnalysisResult

      const result = executeAnalysis(csvData)
      setAnalysisResult(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Error during analysis: ${message}`)
      console.error('Analysis error:', err)
    } finally {
      setIsLoading(false)
      setLoadingStatus('')
    }
  }

  const renderVisualization = () => {
    if (!analysisResult) return null

    const { type, data } = analysisResult

    switch (type) {
      case 'bar_chart': {
        const barData = data as BarChartData
        const barConfig: BarChartConfig = analysisResult.config ?? {}
        const orientation = barConfig.orientation ?? 'horizontal'
        const isHorizontal = orientation === 'horizontal'
        const legendPosition = barConfig.legendPosition ?? 'right'
        const chartTitle = barData.title ?? barConfig.title ?? 'Bar Chart'

        const chartData = barData.labels.map((label, index) => ({
          name: label,
          value: barData.values[index],
        }))

        const legendAlign = legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center'
        const legendVerticalAlign = legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'middle'
        const legendLayout = legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal'

        return (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">{chartTitle}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout={isHorizontal ? 'vertical' : 'horizontal'}
                margin={{ top: 16, right: 32, bottom: 16, left: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {isHorizontal ? (
                  <>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={160} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="name" type="category" />
                    <YAxis type="number" />
                  </>
                )}
                <Tooltip />
                <Legend
                  layout={legendLayout}
                  verticalAlign={legendVerticalAlign}
                  align={legendAlign}
                />
                <Bar dataKey="value" fill="#3B82F6" stroke="#1D4ED8" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      }

      case 'line_chart': {
        const lineData = data as LineChartData
        const chartData = lineData.labels.map((label, index) => ({
          name: label,
          value: lineData.values[index],
        }))

        return (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">{lineData.title || 'Line Chart'}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      }

      case 'table': {
        const tableData = data as TableData
        return (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Table Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    {tableData.headers.map((header, index) => (
                      <th
                        key={header || index}
                        className="border border-gray-300 px-4 py-2 text-left font-semibold"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                          {cell as ReactNode}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      case 'count': {
        const countData = data as CountData
        return (
          <div className="mt-6 text-center">
            <h3 className="text-xl font-semibold mb-4">{countData.label || 'Count Result'}</h3>
            <div className="text-6xl font-bold text-blue-600">{countData.value}</div>
          </div>
        )
      }

      default: {
        const exhaustiveCheck: never = type
        return (
          <div className="mt-6 text-red-600">
            Unknown visualization type: {String(exhaustiveCheck)}
          </div>
        )
      }
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CSV Data Visualizer</h1>

        <div className="mb-6 p-6 bg-blue-50 rounded-lg">
          <p className="text-gray-700 leading-relaxed">
            Upload your CSV file to get started. Then simply describe what you want to know in plain English:
            ask questions like "What's the total revenue?", request charts like "Show me sales trends over time",
            or create tables like "List top 10 customers by order value". We'll automatically answer the question,
            create charts, tables, etc. No formulas or coding required, just ask naturally and we'll handle the rest.
          </p>
        </div>

        <div className="mb-8">
          <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400 focus:outline-none">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-gray-600">Drop CSV file here or click to upload</span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {displayData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Data Preview (First 5 Rows)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {headers.map((header, index) => (
                      <th key={header || index} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {headers.map((header, cellIndex) => (
                        <td key={`${rowIndex}-${cellIndex}`} className="border border-gray-300 px-4 py-2">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {csvData && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Analysis Request</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={analysisQuery}
                onChange={event => setAnalysisQuery(event.target.value)}
                placeholder="Describe the analysis you want to run..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={runAnalysis}
                disabled={isLoading || !analysisQuery.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Run Analysis'}
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="mt-3 text-gray-600">{loadingStatus}</p>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {!isLoading && analysisResult && renderVisualization()}
      </div>
    </div>
  )
}

export default CSVDataVisualizer
