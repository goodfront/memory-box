'use client';

import { useState, useRef } from 'react';
import { exportDatabaseToFile, importDatabaseFromFile, importDatabaseFromFileMerge, validateImportFile } from '@/lib/utils/exportImport';

interface ExportImportSectionProps {
  onImportComplete?: () => void;
}

export default function ExportImportSection({ onImportComplete }: ExportImportSectionProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    stats?: {
      cardCount: number;
      boxCount: number;
      exportDate?: string;
      version?: string;
    };
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await exportDatabaseToFile();
      setMessage({
        type: 'success',
        text: 'Database exported successfully!'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to export database'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setMessage(null);
    setValidationResult(null);

    // Validate the file
    try {
      const result = await validateImportFile(file);
      setValidationResult(result);

      if (!result.valid) {
        setMessage({
          type: 'error',
          text: result.error || 'Invalid import file'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to validate file'
      });
    }
  };

  const handleImport = async (mergeMode: boolean = false) => {
    if (!selectedFile || !validationResult?.valid) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      if (mergeMode) {
        const result = await importDatabaseFromFileMerge(selectedFile);
        setMessage({
          type: 'success',
          text: `Merge complete! Added ${result.cardsAdded} cards, updated ${result.cardsUpdated} cards. Added ${result.boxesAdded} boxes, updated ${result.boxesUpdated} boxes.`
        });
      } else {
        const result = await importDatabaseFromFile(selectedFile);
        setMessage({
          type: 'success',
          text: `Successfully imported ${result.cardsImported} cards and ${result.boxesImported} boxes!`
        });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      setValidationResult(null);

      // Notify parent component
      onImportComplete?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to import database'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    setValidationResult(null);
    setMessage(null);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Export Section */}
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Export Database
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Download all your cards and boxes as a JSON file. This creates a backup that you can import later.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Exporting...' : 'Export Database'}
        </button>
      </div>

      {/* Import Section */}
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Import Database
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Import cards and boxes from a backup file.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="import-file"
            className="w-full cursor-pointer rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-3 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {selectedFile ? selectedFile.name : 'Choose File to Import'}
          </label>
          <input
            id="import-file"
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileSelect}
            className="hidden"
          />

          {validationResult?.valid && validationResult.stats && (
            <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Valid import file
              </p>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>{validationResult.stats.cardCount} cards</li>
                <li>{validationResult.stats.boxCount} boxes</li>
                {validationResult.stats.exportDate && (
                  <li>Exported: {new Date(validationResult.stats.exportDate).toLocaleString()}</li>
                )}
                {validationResult.stats.version && (
                  <li>Version: {validationResult.stats.version}</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {selectedFile && (
              <button
                onClick={handleClearSelection}
                disabled={loading}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => handleImport(true)}
              disabled={loading || !selectedFile || !validationResult?.valid}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Merging...' : 'Merge Import (Preserve Existing)'}
            </button>
            <button
              onClick={() => handleImport(false)}
              disabled={loading || !selectedFile || !validationResult?.valid}
              className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Replacing...' : 'Replace Import (Delete All)'}
            </button>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="sm:col-span-2">
          <div
            className={`rounded-lg border p-4 ${
              message.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                : 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
}
