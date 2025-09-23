'use client'

export default function MinimalTable() {
  // Static healthcare data - ultra simplified
  const data = [
    { category: 'Medical', items: [
      { name: 'Inpatient', amount: 425600 },
      { name: 'Outpatient', amount: 318900 },
      { name: 'Emergency', amount: 142300 },
      { name: 'Specialty', amount: 89400 }
    ]},
    { category: 'Pharmacy', items: [
      { name: 'Brand', amount: 186500 },
      { name: 'Generic', amount: 94200 },
      { name: 'Specialty', amount: 156800 }
    ]},
    { category: 'Administrative', items: [
      { name: 'Office Rent', amount: 12500 },
      { name: 'IT Infrastructure', amount: 8200 },
      { name: 'Insurance', amount: 6400 }
    ]}
  ]

  const grandTotal = data.reduce((total, category) => 
    total + category.items.reduce((sum, item) => sum + item.amount, 0), 0
  )

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString()
  }

  return (
    <div className="space-y-12 text-left">
      {data.map((category) => (
        <div key={category.category}>
          <div className="mb-6 text-sm text-gray-600">{category.category}</div>
          <div className="space-y-4">
            {category.items.map((item) => (
              <div key={item.name} className="flex justify-between">
                <span>{item.name}</span>
                <span className="tabular-nums">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="pt-8">
        <div className="flex justify-between text-lg">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}