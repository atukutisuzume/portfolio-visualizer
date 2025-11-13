"use client";

import { useState } from "react";

async function saveLabelType(name: string) {
  const res = await fetch('/api/label-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'ラベルタイプの保存に失敗しました。');
  }
  return data;
}

export function useLabelType() {
  const [labelName, setLabelName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSaveDisabled = isSaving || !labelName.trim();

  const handleSave = async () => {
    if (isSaveDisabled) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await saveLabelType(labelName.trim());
      setSuccessMessage(`✅ ラベルタイプ「${labelName}」を保存しました！`);
      setLabelName(''); // Reset input after save
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました。');
    } finally {
      setIsSaving(false);
      // Hide success/error message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
  };

  return {
    labelName,
    setLabelName,
    handleSave,
    isSaving,
    isSaveDisabled,
    error,
    successMessage,
  };
}
