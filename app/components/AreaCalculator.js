'use client'

import { Card, Statistic, Progress, Slider, Select } from 'antd'
import { CalculatorOutlined, ArrowsAltOutlined } from '@ant-design/icons'

const AreaCalculator = ({ area, perimeter, units, onUnitChange }) => {
  const unitOptions = [
    { value: 'sqft', label: 'Square Feet (sq ft)' },
    { value: 'sqm', label: 'Square Meters (sq m)' },
    { value: 'sqin', label: 'Square Inches (sq in)' },
    { value: 'acre', label: 'Acres' }
  ]

  const convertArea = (value, fromUnit, toUnit) => {
    const conversions = {
      sqft: { sqm: 0.092903, sqin: 144, acre: 1/43560, sqft: 1 },
      sqm: { sqft: 10.7639, sqin: 1550, acre: 0.000247105, sqm: 1 },
      sqin: { sqft: 1/144, sqm: 0.00064516, acre: 1/6272640, sqin: 1 },
      acre: { sqft: 43560, sqm: 4046.86, sqin: 6272640, acre: 1 }
    }
    return value * (conversions[fromUnit]?.[toUnit] || 1)
  }

  const convertedArea = convertArea(area, 'sqft', units)
  const convertedPerimeter = perimeter / (units === 'sqm' ? 0.3048 : 1)

  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <CalculatorOutlined />
          <span>Area Calculator</span>
        </div>
      }
      className="shadow-sm"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Statistic
            title="Total Area"
            value={convertedArea.toFixed(2)}
            suffix={units === 'sqft' ? 'sq ft' : 
                   units === 'sqm' ? 'sq m' : 
                   units === 'sqin' ? 'sq in' : 'acres'}
            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
          />
          <Statistic
            title="Total Perimeter"
            value={convertedPerimeter.toFixed(2)}
            suffix={units === 'sqm' ? 'm' : 'ft'}
            valueStyle={{ color: '#52c41a', fontSize: '24px' }}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">
            Measurement Units
          </label>
          <Select
            value={units}
            onChange={onUnitChange}
            options={unitOptions}
            className="w-full"
          />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Area Coverage</span>
              <span className="text-sm font-medium">
                {((convertedArea / 1000) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              percent={(convertedArea / 1000) * 100} 
              size="small"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <ArrowsAltOutlined className="mr-2" />
              <strong>Note:</strong> All measurements are calculated based on 
              shape geometry. 1 drawing unit = 1 inch. Adjust scale for 
              different units.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default AreaCalculator