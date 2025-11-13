"use client";
import React from "react";

type Props = {
  labelName: string;
  setLabelName: (v: string) => void;
  handleSave: () => void;
  isSaving: boolean;
  isSaveDisabled: boolean;
};

export default function LabelTypeInput({
  labelName,
  setLabelName,
  handleSave,
  isSaving,
  isSaveDisabled,
}: Props) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <input
        type="text"
        placeholder="新しいラベルタイプ名"
        value={labelName}
        onChange={(e) => setLabelName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        disabled={isSaving}
      />
      <button
        onClick={handleSave}
        disabled={isSaveDisabled}
        className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-2 px-6 rounded shadow hover:opacity-90 transition disabled:opacity-50"
      >
        {isSaving ? '保存中...' : 'ラベルタイプを保存'}
      </button>
    </div>
  );
}
