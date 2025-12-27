'use client'

import { FloatButton, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import DxfEditor from './components/DxfEditor'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            DXF Shape Editor Pro
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Professional CAD tool for editing DXF files with real-time customization, 
            measurement tools, and advanced shape manipulation features
          </p>
        </div>
        
        <DxfEditor />
        
        <FloatButton.Group shape="circle" className="right-6 bottom-6">
          <Tooltip title="Help & Documentation" placement="left">
            <FloatButton 
              icon={<QuestionCircleOutlined />}
              onClick={() => window.open('/help', '_blank')}
            />
          </Tooltip>
        </FloatButton.Group>
      </main>
      
      <footer className="text-center py-6 text-gray-500 text-sm border-t border-gray-200 mt-8">
        <p>DXF Shape Editor Pro © 2024 - Professional CAD Editing Tool</p>
        <p className="mt-2">Supports .dxf file format with real-time calculation and editing</p>
      </footer>
    </div>
  )
}