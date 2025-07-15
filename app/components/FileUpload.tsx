"use client";
import { ChangeEvent } from "react";

export default function FileUpload({
  onFileSelect,
  disabled,
}: {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-400 rounded p-6 cursor-pointer hover:border-indigo-600 transition-colors">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id="csvFileInput"
      />
      <label htmlFor="csvFileInput" className="text-indigo-700 font-semibold cursor-pointer">
        CSVファイルを選択
      </label>
    </div>
  );
}
