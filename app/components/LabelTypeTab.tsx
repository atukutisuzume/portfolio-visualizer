"use client";
import React from "react";
import { useLabelType } from "@/hooks/useLabelType";
import LabelTypeInput from "./LabelTypeInput";
import { useLabel } from "@/hooks/useLabel";
import LabelInput from "./LabelInput";
import { useStock } from "@/hooks/useStock";
import StockInput from "./StockInput";

export default function LabelTypeTab() {
  const labelType = useLabelType();
  const label = useLabel();
  const stock = useStock();

  const successMessage = labelType.successMessage || label.successMessage || stock.successMessage;
  const errorMessage = labelType.error || label.error || stock.error;

  return (
    <div className="space-y-8">
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Form for creating Stocks */}
      <section className="bg-white border-l-4 border-sky-400 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-sky-700 mb-4">新しい銘柄の登録</h2>
        <StockInput
          symbol={stock.symbol}
          setSymbol={stock.setSymbol}
          name={stock.name}
          setName={stock.setName}
          currency={stock.currency}
          setCurrency={stock.setCurrency}
          handleSave={stock.handleSave}
          isSaving={stock.isSaving}
          isSaveDisabled={stock.isSaveDisabled}
        />
      </section>

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
