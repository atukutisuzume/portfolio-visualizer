"use client";

import { useState, useEffect } from "react";

type LabelType = {
  id: string;
  name: string;
};

async function fetchLabelTypes(): Promise<LabelType[]> {
  const res = await fetch('/api/label-types');
  if (!res.ok) {
    throw new Error('ラベルタイプの取得に失敗しました。');
  }
  return res.json();
}

async function saveLabel(name: string, typeId: string) {
  const res = await fetch('/api/labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type_id: typeId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'ラベルの保存に失敗しました。');
  }
  return data;
}

export function useLabel() {
  const [labelName, setLabelName] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [labelTypes, setLabelTypes] = useState<LabelType[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadLabelTypes = async () => {
      try {
        const types = await fetchLabelTypes();
        setLabelTypes(types);
        if (types.length > 0) {
          setSelectedTypeId(types[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    loadLabelTypes();
  }, []);

  const isSaveDisabled = isSaving || !labelName.trim() || !selectedTypeId;

  const handleSave = async () => {
    if (isSaveDisabled) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await saveLabel(labelName.trim(), selectedTypeId);
      setSuccessMessage(`✅ ラベル「${labelName}」を保存しました！`);
      setLabelName(''); // Reset input after save
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました。');
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
  };

  return {
    labelName,
    setLabelName,
    selectedTypeId,
    setSelectedTypeId,
    labelTypes,
    handleSave,
    isLoading,
    isSaving,
    isSaveDisabled,
    error,
    successMessage,
  };
}
