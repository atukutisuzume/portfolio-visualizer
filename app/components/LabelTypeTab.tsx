"use client";
import React from "react";
import { useLabelType } from "@/hooks/useLabelType";
import LabelTypeInput from "./LabelTypeInput";
import { useLabel } from "@/hooks/useLabel";
import LabelInput from "./LabelInput";

export default function LabelTypeTab() {
  // Hook for creating Label Types
  const labelType = useLabelType();

  // Hook for creating Labels
  const label = useLabel();

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {labelType.successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow">
          <p className="text-green-700">{labelType.successMessage}</p>
        </div>
      )}
      {label.successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow">
          <p className="text-green-700">{label.successMessage}</p>
        </div>
      )}
      {labelType.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
          <p className="text-red-700">{labelType.error}</p>
        </div>
      )}
      {label.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
          <p className="text-red-700">{label.error}</p>
        </div>
      )}

      {/* Form for creating Label Types */}
      <section className="bg-white border-l-4 border-indigo-400 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">新しいラベルタイプの登録</h2>
        <LabelTypeInput
          labelName={labelType.labelName}
          setLabelName={labelType.setLabelName}
          handleSave={labelType.handleSave}
          isSaving={labelType.isSaving}
          isSaveDisabled={labelType.isSaveDisabled}
        />
      </section>

      {/* Form for creating Labels */}
      <section className="bg-white border-l-4 border-emerald-400 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-emerald-700 mb-4">新しいラベルの登録</h2>
        <LabelInput
          labelName={label.labelName}
          setLabelName={label.setLabelName}
          selectedTypeId={label.selectedTypeId}
          setSelectedTypeId={label.setSelectedTypeId}
          labelTypes={label.labelTypes}
          handleSave={label.handleSave}
          isLoading={label.isLoading}
          isSaving={label.isSaving}
          isSaveDisabled={label.isSaveDisabled}
        />
      </section>
    </div>
  );
}