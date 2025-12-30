"use client";
import { Card, Space, Divider, Alert, Statistic, Tag, Tooltip } from "antd";
import { DollarOutlined, InfoCircleOutlined, CalculatorOutlined } from "@ant-design/icons";
import React, { useMemo } from "react";

// Pricing Configuration
const PRICING_CONFIG = {
  basePrices: {
    granite: 50,
    quartz: 60,
    marble: 80,
    "solid-surface": 40,
    laminate: 25,
    "stainless-steel": 70,
  },
  thicknessMultipliers: {
    12: 0.8,
    20: 1.0,
    30: 1.3,
    40: 1.6,
    50: 2.0,
  },
  colorMultipliers: {
    white: 1.0,
    cream: 1.0,
    gray: 1.0,
    charcoal: 1.05,
    black: 1.1,
    brown: 1.0,
    navy: 1.15,
    green: 1.15,
    terracotta: 1.1,
    sand: 1.0,
  },
  specialColorSurcharge: 50, // Fixed surcharge for special colors
  complexShapeMultiplier: 1.2, // For shapes with more than 6 points
  radiusCornerCost: 5, // Per rounded corner
  drillingHoleCost: 3, // Per hole
  minimumOrderPrice: 100,
};

function PricingPanel({
  totalArea,
  totalPerimeter,
  selectedMaterial,
  selectedThickness,
  selectedColor,
  specialColorRequest,
  cornerSettings,
  shapes,
}) {
  // Calculate pricing
  const pricing = useMemo(() => {
    let breakdown = [];
    let subtotal = 0;

    // Base price per sq ft
    const basePrice = PRICING_CONFIG.basePrices[selectedMaterial] || 0;
    const areaPrice = basePrice * totalArea;
    
    if (areaPrice > 0) {
      breakdown.push({
        item: `Base Material (${selectedMaterial || 'Not selected'})`,
        calculation: `${totalArea.toFixed(2)} sq ft × €${basePrice}/sq ft`,
        amount: areaPrice,
      });
      subtotal += areaPrice;
    }

    // Thickness multiplier
    const thicknessMultiplier = PRICING_CONFIG.thicknessMultipliers[selectedThickness] || 1;
    if (selectedThickness && thicknessMultiplier !== 1) {
      const thicknessAdjustment = subtotal * (thicknessMultiplier - 1);
      breakdown.push({
        item: `Thickness Adjustment (${selectedThickness}mm)`,
        calculation: `${((thicknessMultiplier - 1) * 100).toFixed(0)}% adjustment`,
        amount: thicknessAdjustment,
      });
      subtotal += thicknessAdjustment;
    }

    // Color multiplier
    const colorMultiplier = PRICING_CONFIG.colorMultipliers[selectedColor] || 1;
    if (selectedColor && colorMultiplier !== 1) {
      const colorAdjustment = subtotal * (colorMultiplier - 1);
      breakdown.push({
        item: `Color Premium (${selectedColor})`,
        calculation: `${((colorMultiplier - 1) * 100).toFixed(0)}% premium`,
        amount: colorAdjustment,
      });
      subtotal += colorAdjustment;
    }

    // Special color surcharge
    if (specialColorRequest) {
      breakdown.push({
        item: 'Special Color Request',
        calculation: 'Custom color handling fee',
        amount: PRICING_CONFIG.specialColorSurcharge,
      });
      subtotal += PRICING_CONFIG.specialColorSurcharge;
    }

    // Complex shape multiplier
    const pointCount = shapes[0]?.points?.length || 0;
    if (pointCount > 6) {
      const complexityCharge = subtotal * (PRICING_CONFIG.complexShapeMultiplier - 1);
      breakdown.push({
        item: 'Complex Shape',
        calculation: `${pointCount} vertices (20% surcharge)`,
        amount: complexityCharge,
      });
      subtotal += complexityCharge;
    }

    // Rounded corners
    const radiusCorners = Object.values(cornerSettings).filter(c => c.type === 'radius').length;
    if (radiusCorners > 0) {
      const cornerCost = radiusCorners * PRICING_CONFIG.radiusCornerCost;
      breakdown.push({
        item: 'Rounded Corners',
        calculation: `${radiusCorners} corners × €${PRICING_CONFIG.radiusCornerCost}`,
        amount: cornerCost,
      });
      subtotal += cornerCost;
    }

    // Drilling holes
    // Note: We'd need to pass drillingHoles count here
    // For now, assuming 2 holes minimum
    const drillingCost = 2 * PRICING_CONFIG.drillingHoleCost;
    breakdown.push({
      item: 'Drilling Holes',
      calculation: `2 holes × €${PRICING_CONFIG.drillingHoleCost}`,
      amount: drillingCost,
    });
    subtotal += drillingCost;

    // Apply minimum order price
    const finalTotal = Math.max(subtotal, PRICING_CONFIG.minimumOrderPrice);
    const minimumApplied = subtotal < PRICING_CONFIG.minimumOrderPrice;

    return {
      breakdown,
      subtotal,
      finalTotal,
      minimumApplied,
    };
  }, [totalArea, selectedMaterial, selectedThickness, selectedColor, specialColorRequest, cornerSettings, shapes]);

  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <CalculatorOutlined />
          <span>Pricing Estimate</span>
        </div>
      }
      size="small" 
      className="shadow-md"
    >
      <Space orientation="vertical" className="w-full" size="small">
        {/* Area & Perimeter Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-xs text-blue-600">Total Area</div>
            <div className="text-xl font-bold text-blue-700">{totalArea.toFixed(2)}</div>
            <div className="text-xs text-blue-500">sq ft</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-xs text-green-600">Perimeter</div>
            <div className="text-xl font-bold text-green-700">{totalPerimeter.toFixed(2)}</div>
            <div className="text-xs text-green-500">ft</div>
          </div>
        </div>

        <Divider style={{ margin: "12px 0" }}>Price Breakdown</Divider>

        {/* Price Breakdown */}
        <div className="space-y-2">
          {pricing.breakdown.map((item, idx) => (
            <div 
              key={idx} 
              className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
            >
              <div>
                <div className="text-sm">{item.item}</div>
                <div className="text-xs text-gray-500">{item.calculation}</div>
              </div>
              <div className="font-medium">
                €{item.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Subtotal */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">€{pricing.subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Minimum Order Notice */}
        {pricing.minimumApplied && (
          <Alert
            type="info"
            title={`Minimum order price of €${PRICING_CONFIG.minimumOrderPrice} applied`}
            showIcon
          />
        )}

        {/* Final Total */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm opacity-90">Estimated Total</div>
              <div className="text-xs opacity-75">VAT not included</div>
            </div>
            <div className="text-3xl font-bold">
              €{pricing.finalTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Price Disclaimer */}
        <Alert
          type="warning"
          title="Pricing Note"
          description={
            <div className="text-xs">
              <p>This is an <strong>estimated price</strong>. Final pricing may vary based on:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>Exact material availability</li>
                <li>Shape complexity verification</li>
                <li>Special color matching</li>
                <li>Current market rates</li>
              </ul>
              <p className="mt-1">You will receive a confirmed quote after order review.</p>
            </div>
          }
          showIcon
          icon={<InfoCircleOutlined />}
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {selectedMaterial && (
            <Tag color="blue">{selectedMaterial}</Tag>
          )}
          {selectedThickness && (
            <Tag color="green">{selectedThickness}mm</Tag>
          )}
          {selectedColor && (
            <Tag color="purple">{selectedColor}</Tag>
          )}
          {specialColorRequest && (
            <Tag color="gold">Custom Color</Tag>
          )}
          {Object.values(cornerSettings).filter(c => c.type === 'radius').length > 0 && (
            <Tag color="cyan">
              {Object.values(cornerSettings).filter(c => c.type === 'radius').length} Rounded Corners
            </Tag>
          )}
        </div>
      </Space>
    </Card>
  );
}

export default PricingPanel;