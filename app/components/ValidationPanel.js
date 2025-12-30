"use client";
import { Card, Button, Space, Alert, List, Badge, Progress, message } from "antd";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import React from "react";

function ValidationPanel({ validationErrors, validateOrder }) {
  const isValid = validationErrors.length === 0;

  // Run validation
  const handleValidate = () => {
    const isValid = validateOrder();
    if (isValid) {
      message.success("All validations passed! Ready to submit.");
    } else {
      message.error(`Found ${validationErrors.length} issue(s). Please fix before submitting.`);
    }
  };

  // Validation checklist
  const validationChecklist = [
    {
      key: 'shape',
      title: 'Shape Defined',
      description: 'At least one shape must be created or uploaded',
      check: () => !validationErrors.some(e => e.includes('shape')),
    },
    {
      key: 'holes',
      title: 'Drilling Holes (min. 2)',
      description: 'Minimum 2 drilling holes required for mounting',
      check: () => !validationErrors.some(e => e.includes('drilling')),
    },
    {
      key: 'material',
      title: 'Material Selected',
      description: 'Choose a material type',
      check: () => !validationErrors.some(e => e.includes('material')),
    },
    {
      key: 'thickness',
      title: 'Thickness Selected',
      description: 'Choose material thickness',
      check: () => !validationErrors.some(e => e.includes('thickness')),
    },
    {
      key: 'color',
      title: 'Color Selected',
      description: 'Choose a standard color or request special color',
      check: () => !validationErrors.some(e => e.includes('color')),
    },
    {
      key: 'corners',
      title: 'Corner Settings Valid',
      description: 'All corner radii must be valid for edge lengths',
      check: () => !validationErrors.some(e => e.includes('Corner')),
    },
  ];

  const passedCount = validationChecklist.filter(item => item.check()).length;
  const progressPercent = Math.round((passedCount / validationChecklist.length) * 100);

  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <SafetyCertificateOutlined />
          <span>Order Validation</span>
          <Badge 
            count={isValid ? "✓" : validationErrors.length} 
            style={{ backgroundColor: isValid ? '#52c41a' : '#ff4d4f' }}
          />
        </div>
      }
      size="small" 
      className="shadow-md"
    >
      <Space orientation="vertical" className="w-full" size="small">
        {/* Progress */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Completion Progress</span>
            <span className="text-sm text-gray-500">{passedCount}/{validationChecklist.length}</span>
          </div>
          <Progress 
            percent={progressPercent} 
            status={isValid ? "success" : "active"}
            strokeColor={isValid ? "#52c41a" : "#1890ff"}
          />
        </div>

        {/* Validation Checklist */}
        <div className="space-y-2">
          {validationChecklist.map((item) => {
            const passed = item.check();
            return (
              <div 
                key={item.key}
                className={`p-3 rounded-lg border transition-all ${
                  passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {passed ? (
                    <CheckCircleOutlined className="text-green-500 text-lg" />
                  ) : (
                    <CloseCircleOutlined className="text-red-500 text-lg" />
                  )}
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Details */}
        {validationErrors.length > 0 && (
          <>
            <Alert
              type="error"
              title={`${validationErrors.length} Issue(s) Found`}
              description={
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-sm">{error}</li>
                  ))}
                </ul>
              }
              showIcon
              icon={<WarningOutlined />}
            />
          </>
        )}

        {/* Success Message */}
        {isValid && (
          <Alert
            type="success"
            title="All Validations Passed!"
            description="Your order is ready to be submitted. Click 'Submit Order' to proceed."
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}

        {/* Validate Button */}
        <Button
          type={isValid ? "default" : "primary"}
          icon={<ReloadOutlined />}
          onClick={handleValidate}
          block
          size="large"
        >
          {isValid ? "Re-validate" : "Run Validation"}
        </Button>

        {/* QA Notes */}
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <div className="text-sm font-medium text-amber-700 mb-1">⚠️ Quality Assurance</div>
          <ul className="text-xs text-amber-600 space-y-1 list-disc ml-4">
            <li>All shapes will be reviewed by our team</li>
            <li>Complex shapes may require additional verification</li>
            <li>Radius intersections are automatically checked</li>
            <li>Minimum hole distance from edges is validated</li>
          </ul>
        </div>

        {/* Production Info */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-700 mb-1">📋 Next Steps</div>
          <ol className="text-xs text-blue-600 space-y-1 list-decimal ml-4">
            <li>Submit your order</li>
            <li>Receive confirmation email</li>
            <li>Our team reviews your design</li>
            <li>Final quote sent within 24-48 hours</li>
            <li>Production begins after approval</li>
          </ol>
        </div>
      </Space>
    </Card>
  );
}

export default ValidationPanel;