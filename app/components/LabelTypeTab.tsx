"use client";
import React from "react";
import { useLabelType } from "@/hooks/useLabelType";
import LabelTypeInput from "./LabelTypeInput";

export default function LabelTypeTab() {
  const {
    labelName,
    setLabelName,
    handleSave,
    isSaving,
    isSaveDisabled,
    error,
    successMessage,
  } = useLabelType();

  return (
    <div className="space-y-8">
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <section className="bg-white border-l-4 border-blue-400 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-blue-700 mb-4">新しいラベルタイプの登録</h2>
        <LabelTypeInput
          labelName={labelName}
          setLabelName={setLabelName}
          handleSave={handleSave}
          isSaving={isSaving}
          isSaveDisabled={isSaveDisabled}
        />
      </section>
    </div>
  );
}
