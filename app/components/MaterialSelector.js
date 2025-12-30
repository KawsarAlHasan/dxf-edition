"use client";
import { Card, Button, Space, Select, Input, Upload, Alert, Divider, Radio, Image, message, Tag } from "antd";
import { UploadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import React, { useState } from "react";

const { Option } = Select;
const { TextArea } = Input;

// Material Options
const materials = [
  { 
    id: "granite", 
    name: "Granite", 
    description: "Natural stone, durable and heat resistant",
    priceMultiplier: 1.0,
    icon: "🪨"
  },
  { 
    id: "quartz", 
    name: "Quartz", 
    description: "Engineered stone, non-porous and low maintenance",
    priceMultiplier: 1.2,
    icon: "💎"
  },
  { 
    id: "marble", 
    name: "Marble", 
    description: "Elegant natural stone with unique veining",
    priceMultiplier: 1.5,
    icon: "🏛️"
  },
  { 
    id: "solid-surface", 
    name: "Solid Surface", 
    description: "Seamless, repairable, various colors",
    priceMultiplier: 0.8,
    icon: "📋"
  },
  { 
    id: "laminate", 
    name: "Laminate", 
    description: "Affordable, wide variety of patterns",
    priceMultiplier: 0.5,
    icon: "📄"
  },
  { 
    id: "stainless-steel", 
    name: "Stainless Steel", 
    description: "Professional grade, hygienic",
    priceMultiplier: 1.3,
    icon: "🔩"
  },
];

// Thickness Options (in mm)
const thicknessOptions = [
  { value: 12, label: "12mm", description: "Standard thin" },
  { value: 20, label: "20mm", description: "Standard" },
  { value: 30, label: "30mm", description: "Premium" },
  { value: 40, label: "40mm", description: "Extra thick" },
  { value: 50, label: "50mm", description: "Ultra premium" },
];

// Standard Colors
const standardColors = [
  { id: "white", name: "Arctic White", hex: "#FFFFFF", popular: true },
  { id: "cream", name: "Cream Beige", hex: "#F5F5DC" },
  { id: "gray", name: "Stone Gray", hex: "#808080", popular: true },
  { id: "charcoal", name: "Charcoal", hex: "#36454F" },
  { id: "black", name: "Absolute Black", hex: "#1a1a1a", popular: true },
  { id: "brown", name: "Warm Brown", hex: "#8B4513" },
  { id: "navy", name: "Navy Blue", hex: "#000080" },
  { id: "green", name: "Forest Green", hex: "#228B22" },
  { id: "terracotta", name: "Terracotta", hex: "#E2725B" },
  { id: "sand", name: "Desert Sand", hex: "#EDC9AF" },
];

// Coating/Finish Options
const finishOptions = [
  { id: "polished", name: "Polished", description: "High gloss, reflective" },
  { id: "matte", name: "Matte", description: "Non-reflective, modern" },
  { id: "honed", name: "Honed", description: "Smooth, satin finish" },
  { id: "leathered", name: "Leathered", description: "Textured, tactile" },
  { id: "brushed", name: "Brushed", description: "Linear texture" },
];

function MaterialSelector({
  selectedMaterial,
  setSelectedMaterial,
  selectedThickness,
  setSelectedThickness,
  selectedColor,
  setSelectedColor,
  specialColorRequest,
  setSpecialColorRequest,
  specialColorFile,
  setSpecialColorFile,
}) {
  const [selectedFinish, setSelectedFinish] = useState(null);
  const [showSpecialColor, setShowSpecialColor] = useState(false);

  // Handle file upload
  const handleFileUpload = (info) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      setSpecialColorFile(info.file.originFileObj || info.file);
      message.success("Color reference uploaded");
    }
  };

  // Custom upload props
  const uploadProps = {
    name: 'file',
    accept: 'image/*',
    maxCount: 1,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      setSpecialColorFile(file);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setSpecialColorFile(null);
    },
  };

  return (
    <Card 
      title="🎨 Material & Color" 
      size="small" 
      className="shadow-md"
    >
      <Space orientation="vertical" className="w-full" size="middle">
        {/* Material Selection */}
        <div>
          <div className="text-sm font-medium mb-2">Select Material</div>
          <div className="grid grid-cols-2 gap-2">
            {materials.map((material) => (
              <Button
                key={material.id}
                type={selectedMaterial === material.id ? "primary" : "default"}
                onClick={() => setSelectedMaterial(material.id)}
                className={`h-auto py-2 text-left ${
                  selectedMaterial === material.id ? '' : 'hover:border-blue-400'
                }`}
                block
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{material.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{material.name}</div>
                    <div className="text-xs opacity-70 truncate">{material.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          {selectedMaterial && (
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
              <CheckCircleOutlined />
              {materials.find(m => m.id === selectedMaterial)?.name} selected
            </div>
          )}
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Thickness Selection */}
        <div>
          <div className="text-sm font-medium mb-2">Select Thickness</div>
          <Radio.Group
            value={selectedThickness}
            onChange={(e) => setSelectedThickness(e.target.value)}
            className="w-full"
          >
            <div className="grid grid-cols-5 gap-1">
              {thicknessOptions.map((thickness) => (
                <Radio.Button
                  key={thickness.value}
                  value={thickness.value}
                  className="text-center"
                  style={{ width: '100%' }}
                >
                  <div>
                    <div className="font-medium">{thickness.label}</div>
                    <div className="text-xs opacity-70">{thickness.description}</div>
                  </div>
                </Radio.Button>
              ))}
            </div>
          </Radio.Group>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Color Selection */}
        <div>
          <div className="text-sm font-medium mb-2">Select Color</div>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {standardColors.map((color) => (
              <div
                key={color.id}
                onClick={() => {
                  setSelectedColor(color.id);
                  setShowSpecialColor(false);
                  setSpecialColorRequest("");
                }}
                className={`
                  relative cursor-pointer rounded-lg p-1 transition-all
                  ${selectedColor === color.id 
                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                    : 'hover:ring-2 hover:ring-gray-300'
                  }
                `}
              >
                <div
                  className="w-full h-10 rounded-md border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="text-xs text-center mt-1 truncate">{color.name}</div>
                {color.popular && (
                  <Tag color="gold" className="absolute -top-1 -right-1 text-xs px-1">
                    Hot
                  </Tag>
                )}
              </div>
            ))}
          </div>

          {/* Special Color Toggle */}
          <Button
            type={showSpecialColor ? "primary" : "dashed"}
            onClick={() => {
              setShowSpecialColor(!showSpecialColor);
              if (!showSpecialColor) {
                setSelectedColor(null);
              }
            }}
            block
            className="mb-2"
          >
            🌈 Request Special Color
          </Button>

          {/* Special Color Request */}
          {showSpecialColor && (
            <div className="bg-purple-50 p-3 rounded-lg space-y-3">
              <Alert
                type="info"
                message="Special Color Request"
                description="Describe your desired color or upload a reference image. Additional charges may apply."
                showIcon
                className="mb-2"
              />
              
              <TextArea
                placeholder="Describe the color you want (e.g., 'Deep burgundy with gold veins', RAL color code, Pantone number, etc.)"
                value={specialColorRequest}
                onChange={(e) => setSpecialColorRequest(e.target.value)}
                rows={3}
              />

              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />} block>
                  Upload Color Reference Image
                </Button>
              </Upload>

              {specialColorFile && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircleOutlined />
                  Reference image uploaded: {specialColorFile.name}
                </div>
              )}
            </div>
          )}
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Finish Selection */}
        <div>
          <div className="text-sm font-medium mb-2">Select Finish</div>
          <Select
            value={selectedFinish}
            onChange={setSelectedFinish}
            placeholder="Choose a finish"
            style={{ width: '100%' }}
          >
            {finishOptions.map((finish) => (
              <Option key={finish.id} value={finish.id}>
                <div>
                  <span className="font-medium">{finish.name}</span>
                  <span className="text-gray-500 ml-2">- {finish.description}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        {/* Selection Summary */}
        {(selectedMaterial || selectedThickness || selectedColor || specialColorRequest) && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-green-700 mb-2">Current Selection</div>
              <div className="space-y-1 text-sm">
                {selectedMaterial && (
                  <div>Material: <strong>{materials.find(m => m.id === selectedMaterial)?.name}</strong></div>
                )}
                {selectedThickness && (
                  <div>Thickness: <strong>{selectedThickness}mm</strong></div>
                )}
                {selectedColor && (
                  <div className="flex items-center gap-2">
                    Color: 
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: standardColors.find(c => c.id === selectedColor)?.hex }}
                    />
                    <strong>{standardColors.find(c => c.id === selectedColor)?.name}</strong>
                  </div>
                )}
                {specialColorRequest && (
                  <div>Special Color: <strong>"{specialColorRequest.substring(0, 30)}..."</strong></div>
                )}
                {selectedFinish && (
                  <div>Finish: <strong>{finishOptions.find(f => f.id === selectedFinish)?.name}</strong></div>
                )}
              </div>
            </div>
          </>
        )}
      </Space>
    </Card>
  );
}

export default MaterialSelector;