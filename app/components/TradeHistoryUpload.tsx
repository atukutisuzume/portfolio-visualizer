"use client";
import React, { useState, useRef } from "react";

interface TradeHistoryUploadProps {
  onUploadSuccess?: (message: string, count: number, source: string) => void;
}

export default function TradeHistoryUpload({ onUploadSuccess }: TradeHistoryUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.toLowerCase().endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setMessage({ type: 'error', text: 'CSVファイルを選択してください。' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/trades/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `${result.message} (${result.count}件の取引を取り込みました)` 
        });
        onUploadSuccess?.(result.message, result.count, result.source);
      } else {
        setMessage({ type: 'error', text: result.error || '取り込みに失敗しました。' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'アップロード中にエラーが発生しました。' });
    } finally {
      setIsUploading(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📊</div>
          {isUploading ? (
            <div className="space-y-2">
              <div className="text-lg font-medium text-indigo-600">取り込み中...</div>
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="text-lg font-medium text-gray-700">
                取引履歴CSVをアップロード
              </div>
              <div className="text-sm text-gray-500">
                ファイルをドラッグ&ドロップするか、クリックして選択
              </div>
              <div className="text-xs text-gray-400 mt-2">
                対応形式: 楽天証券・moomoo証券の取引履歴CSV
              </div>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`
          p-4 rounded-lg border-l-4 
          ${message.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-700' 
            : 'bg-red-50 border-red-400 text-red-700'
          }
        `}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">対応するCSVファイル</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 楽天証券: 取引履歴CSV（約定日,受渡日,銘柄コード...）</li>
          <li>• moomoo証券: 現物取引履歴CSV</li>
          <li>• moomoo証券: 信用取引履歴CSV</li>
        </ul>
      </div>
    </div>
  );
}
