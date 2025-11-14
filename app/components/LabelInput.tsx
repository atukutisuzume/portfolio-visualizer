"use client";
import React from "react";

type LabelType = {
  id: string;
  name: string;
};

type Props = {
  labelName: string;
  setLabelName: (v: string) => void;
  selectedTypeId: string;
  setSelectedTypeId: (v: string) => void;
  labelTypes: LabelType[];
  handleSave: () => void;
  isLoading: boolean;
  isSaving: boolean;
  isSaveDisabled: boolean;
};

export default function LabelInput({
  labelName,
  setLabelName,
  selectedTypeId,
  setSelectedTypeId,
  labelTypes,
  handleSave,
  isLoading,
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
        placeholder="新しいラベル名"
        value={labelName}
        onChange={(e) => setLabelName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        disabled={isSaving || isLoading}
      />
      <select
        value={selectedTypeId}
        onChange={(e) => setSelectedTypeId(e.target.value)}
        className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        disabled={isSaving || isLoading}
      >
        {isLoading ? (
          <option>Loading types...</option>
        ) : (
          labelTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))
        )}
      </select>
      <button
        onClick={handleSave}
        disabled={isSaveDisabled || isLoading}
        className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-2 px-6 rounded shadow hover:opacity-90 transition disabled:opacity-50"
      >
        {isSaving ? '保存中...' : 'ラベルを保存'}
      </button>
    </div>
  );
}
