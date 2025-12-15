import { useState, useRef, useCallback } from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "../ui/modal";
import Button from "../ui/button/Button";
import { LoadingSpinner, SpinnerIcon } from "../ui/loading";
import { userApi, ImportUserPreviewData, ImportUserValidationError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { CloseIcon, TrashBinIcon } from "../../icons";
import Input from "../form/input/InputField";

interface ImportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function ImportUserModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportUserModalProps) {
  const { showSuccess, showError } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportUserPreviewData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportUserValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (
      !selectedFile.name.endsWith('.xlsx') &&
      !selectedFile.name.endsWith('.xls')
    ) {
      showError('File harus berupa Excel (.xlsx atau .xls)');
      return;
    }

    setFile(selectedFile);
    setPreviewData([]);
    setValidationErrors([]);
    setIsLoading(true);

    try {
      const response = await userApi.previewImport(selectedFile);
      if (response.success && response.data) {
        setPreviewData(response.data);
        if (response.errors && response.errors.length > 0) {
          setValidationErrors(response.errors);
        }
      } else {
        showError(response.message || 'Gagal memuat preview data');
        setFile(null);
      }
    } catch (error: any) {
      console.error('Error preview import:', error);
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat memuat preview data';
      showError(errorMessage);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await userApi.downloadTemplate();
      showSuccess('Template berhasil diunduh');
    } catch (error: any) {
      console.error('Error downloading template:', error);
      showError(error.response?.data?.message || 'Gagal mengunduh template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    // Check if there are validation errors
    if (validationErrors.length > 0) {
      showError('Silakan perbaiki error validasi terlebih dahulu sebelum import');
      return;
    }

    setIsImporting(true);
    try {
      // Create a new Excel file from edited data
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet data
      const headers = ['NO', 'NAMA', 'EMAIL', 'USERNAME', 'TELEPON', 'EMPLOYEE_ID', 'JABATAN', 'PASSWORD'];
      const rows = previewData.map((row) => [
        row.no,
        row.nama,
        row.email,
        row.username || '',
        row.telepon || '',
        row.employee_id || '',
        row.jabatan || '',
        row.password,
      ]);
      
      const worksheetData = [headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      
      // Convert to blob
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const editedFile = new File([blob], file.name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const response = await userApi.import(editedFile);
      if (response.success) {
        showSuccess(
          `Import berhasil! ${response.data?.imported || 0} user berhasil diimport.`
        );
        handleClose();
        onImportSuccess();
      }
    } catch (error: any) {
      console.error('Error importing:', error);
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat import data';
      showError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const [checkingDuplicates, setCheckingDuplicates] = useState<Set<string>>(new Set());

  const updatePreviewData = useCallback((index: number, field: keyof ImportUserPreviewData, value: string) => {
    setPreviewData((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      
      // Re-validate after edit
      const rowNumber = index + 2;
      const columnMap: Record<string, string> = {
        'nama': 'NAMA',
        'email': 'EMAIL',
        'username': 'USERNAME',
        'telepon': 'TELEPON',
        'employee_id': 'EMPLOYEE_ID',
        'jabatan': 'JABATAN',
        'password': 'PASSWORD',
      };
      const columnName = columnMap[field] || field.toUpperCase();
      
      // Remove ALL old errors for this cell immediately (including all types of errors)
      // This ensures error is cleared before re-validation
      setValidationErrors((prevErrors) =>
        prevErrors.filter(
          (error) => !(error.row === rowNumber && error.column === columnName)
        )
      );

      const newErrors: ImportUserValidationError[] = [];

      // Validate based on field - synchronous validations first
      if (field === 'nama') {
        if (!value.trim()) {
          newErrors.push({
            row: rowNumber,
            column: 'NAMA',
            message: 'Nama wajib diisi.',
          });
        }
      }

      if (field === 'email') {
        if (!value.trim()) {
          newErrors.push({
            row: rowNumber,
            column: 'EMAIL',
            message: 'Email wajib diisi.',
          });
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.push({
            row: rowNumber,
            column: 'EMAIL',
            message: 'Email tidak valid.',
          });
        } else {
          const trimmedValue = value.trim().toLowerCase();
          // Check duplicate in preview data
          const duplicateInPreview = updated.some(
            (r, idx) => idx !== index && r.email && r.email.toLowerCase() === trimmedValue
          );
          if (duplicateInPreview) {
            newErrors.push({
              row: rowNumber,
              column: 'EMAIL',
              message: `Email "${value}" duplikat dalam file Excel. Setiap email harus unik.`,
            });
          } else {
            // Check duplicate in database (async)
            const checkKey = `email-${rowNumber}`;
            setCheckingDuplicates((prev) => new Set(prev).add(checkKey));
            const currentRowNumber = rowNumber; // Capture row number for async callback
            userApi.checkDuplicate('email', value.trim())
              .then((response) => {
                // Verify the row still exists and email hasn't changed
                setPreviewData((currentData) => {
                  const currentRow = currentData[index];
                  if (!currentRow || currentRow.email?.toLowerCase() !== value.trim().toLowerCase()) {
                    // Row was deleted or email changed, skip error update
                    return currentData;
                  }
                  
                  if (response.success && response.data?.exists) {
                    setValidationErrors((prevErrors) => {
                      // Check if error already exists
                      const exists = prevErrors.some(
                        (e) => e.row === currentRowNumber && e.column === 'EMAIL' && e.message.includes('sudah digunakan')
                      );
                      if (!exists) {
                        return [...prevErrors, {
                          row: currentRowNumber,
                          column: 'EMAIL',
                          message: `Email "${value}" sudah digunakan. Email harus unik.`,
                        }];
                      }
                      return prevErrors;
                    });
                  } else {
                    // Remove error if it exists and data is now valid
                    setValidationErrors((prevErrors) =>
                      prevErrors.filter(
                        (e) => !(e.row === currentRowNumber && e.column === 'EMAIL' && e.message.includes('sudah digunakan'))
                      )
                    );
                  }
                  return currentData;
                });
              })
              .catch(() => {
                // Silently fail - don't show error for check failures
              })
              .finally(() => {
                setCheckingDuplicates((prev) => {
                  const next = new Set(prev);
                  next.delete(checkKey);
                  return next;
                });
              });
          }
        }
        
        // Re-check all other rows for duplicate with this email
        updated.forEach((r, idx) => {
          if (idx !== index && r.email) {
            const otherRowNumber = idx + 2;
            const trimmedEmail = r.email.trim().toLowerCase();
            const trimmedCurrentEmail = value.trim().toLowerCase();
            const isDuplicate = trimmedEmail === trimmedCurrentEmail || updated.some(
              (otherRow, otherIdx) => otherIdx !== idx && otherIdx !== index && otherRow.email && otherRow.email.trim().toLowerCase() === trimmedEmail
            );
            
            setValidationErrors((prevErrors) => {
              const hasDuplicateError = prevErrors.some(
                (e) => e.row === otherRowNumber && e.column === 'EMAIL' && e.message.includes('duplikat dalam file Excel')
              );
              
              if (isDuplicate && !hasDuplicateError) {
                return [...prevErrors, {
                  row: otherRowNumber,
                  column: 'EMAIL',
                  message: `Email "${r.email}" duplikat dalam file Excel. Setiap email harus unik.`,
                }];
              } else if (!isDuplicate && hasDuplicateError) {
                return prevErrors.filter(
                  (e) => !(e.row === otherRowNumber && e.column === 'EMAIL' && e.message.includes('duplikat dalam file Excel'))
                );
              }
              return prevErrors;
            });
          }
        });
      }

      if (field === 'username') {
        if (value.trim()) {
          const trimmedValue = value.trim().toLowerCase();
          // Check duplicate in preview data
          const duplicateInPreview = updated.some(
            (r, idx) => idx !== index && r.username && r.username.toLowerCase() === trimmedValue
          );
          if (duplicateInPreview) {
            newErrors.push({
              row: rowNumber,
              column: 'USERNAME',
              message: `Username "${value}" duplikat dalam file Excel. Setiap username harus unik.`,
            });
          } else {
            // Check duplicate in database (async)
            const checkKey = `username-${rowNumber}`;
            setCheckingDuplicates((prev) => new Set(prev).add(checkKey));
            const currentRowNumber = rowNumber; // Capture row number for async callback
            userApi.checkDuplicate('username', value.trim())
              .then((response) => {
                // Verify the row still exists and username hasn't changed
                setPreviewData((currentData) => {
                  const currentRow = currentData[index];
                  if (!currentRow || currentRow.username?.toLowerCase() !== value.trim().toLowerCase()) {
                    // Row was deleted or username changed, skip error update
                    return currentData;
                  }
                  
                  if (response.success && response.data?.exists) {
                    setValidationErrors((prevErrors) => {
                      const exists = prevErrors.some(
                        (e) => e.row === currentRowNumber && e.column === 'USERNAME' && e.message.includes('sudah digunakan')
                      );
                      if (!exists) {
                        return [...prevErrors, {
                          row: currentRowNumber,
                          column: 'USERNAME',
                          message: `Username "${value}" sudah digunakan. Username harus unik.`,
                        }];
                      }
                      return prevErrors;
                    });
                  } else {
                    setValidationErrors((prevErrors) =>
                      prevErrors.filter(
                        (e) => !(e.row === currentRowNumber && e.column === 'USERNAME' && e.message.includes('sudah digunakan'))
                      )
                    );
                  }
                  return currentData;
                });
              })
              .catch(() => {})
              .finally(() => {
                setCheckingDuplicates((prev) => {
                  const next = new Set(prev);
                  next.delete(checkKey);
                  return next;
                });
              });
          }
          
          // Re-check all other rows for duplicate with this username
          updated.forEach((r, idx) => {
            if (idx !== index && r.username) {
              const otherRowNumber = idx + 2;
              const trimmedUsername = r.username.trim().toLowerCase();
              const trimmedCurrentUsername = trimmedValue;
              const isDuplicate = trimmedUsername === trimmedCurrentUsername || updated.some(
                (otherRow, otherIdx) => otherIdx !== idx && otherIdx !== index && otherRow.username && otherRow.username.trim().toLowerCase() === trimmedUsername
              );
              
              setValidationErrors((prevErrors) => {
                const hasDuplicateError = prevErrors.some(
                  (e) => e.row === otherRowNumber && e.column === 'USERNAME' && e.message.includes('duplikat dalam file Excel')
                );
                
                if (isDuplicate && !hasDuplicateError) {
                  return [...prevErrors, {
                    row: otherRowNumber,
                    column: 'USERNAME',
                    message: `Username "${r.username}" duplikat dalam file Excel. Setiap username harus unik.`,
                  }];
                } else if (!isDuplicate && hasDuplicateError) {
                  return prevErrors.filter(
                    (e) => !(e.row === otherRowNumber && e.column === 'USERNAME' && e.message.includes('duplikat dalam file Excel'))
                  );
                }
                return prevErrors;
              });
            }
          });
        } else {
          // Remove errors if username is cleared
          setValidationErrors((prevErrors) =>
            prevErrors.filter(
              (e) => !(e.row === rowNumber && e.column === 'USERNAME')
            )
          );
        }
      }

      if (field === 'employee_id') {
        if (value.trim()) {
          const trimmedValue = value.trim().toLowerCase();
          // Check duplicate in preview data
          const duplicateInPreview = updated.some(
            (r, idx) => idx !== index && r.employee_id && r.employee_id.toLowerCase() === trimmedValue
          );
          if (duplicateInPreview) {
            newErrors.push({
              row: rowNumber,
              column: 'EMPLOYEE_ID',
              message: `Employee ID "${value}" duplikat dalam file Excel. Setiap Employee ID harus unik.`,
            });
          } else {
            // Check duplicate in database (async)
            const checkKey = `employee_id-${rowNumber}`;
            setCheckingDuplicates((prev) => new Set(prev).add(checkKey));
            const currentRowNumber = rowNumber; // Capture row number for async callback
            userApi.checkDuplicate('employee_id', value.trim())
              .then((response) => {
                // Verify the row still exists and employee_id hasn't changed
                setPreviewData((currentData) => {
                  const currentRow = currentData[index];
                  if (!currentRow || currentRow.employee_id?.toLowerCase() !== value.trim().toLowerCase()) {
                    // Row was deleted or employee_id changed, skip error update
                    return currentData;
                  }
                  
                  if (response.success && response.data?.exists) {
                    setValidationErrors((prevErrors) => {
                      const exists = prevErrors.some(
                        (e) => e.row === currentRowNumber && e.column === 'EMPLOYEE_ID' && e.message.includes('sudah digunakan')
                      );
                      if (!exists) {
                        return [...prevErrors, {
                          row: currentRowNumber,
                          column: 'EMPLOYEE_ID',
                          message: `Employee ID "${value}" sudah digunakan. Employee ID harus unik.`,
                        }];
                      }
                      return prevErrors;
                    });
                  } else {
                    setValidationErrors((prevErrors) =>
                      prevErrors.filter(
                        (e) => !(e.row === currentRowNumber && e.column === 'EMPLOYEE_ID' && e.message.includes('sudah digunakan'))
                      )
                    );
                  }
                  return currentData;
                });
              })
              .catch(() => {})
              .finally(() => {
                setCheckingDuplicates((prev) => {
                  const next = new Set(prev);
                  next.delete(checkKey);
                  return next;
                });
              });
          }
          
          // Re-check all other rows for duplicate with this employee_id
          updated.forEach((r, idx) => {
            if (idx !== index && r.employee_id) {
              const otherRowNumber = idx + 2;
              const trimmedEmployeeId = r.employee_id.trim().toLowerCase();
              const trimmedCurrentEmployeeId = trimmedValue;
              const isDuplicate = trimmedEmployeeId === trimmedCurrentEmployeeId || updated.some(
                (otherRow, otherIdx) => otherIdx !== idx && otherIdx !== index && otherRow.employee_id && otherRow.employee_id.trim().toLowerCase() === trimmedEmployeeId
              );
              
              setValidationErrors((prevErrors) => {
                const hasDuplicateError = prevErrors.some(
                  (e) => e.row === otherRowNumber && e.column === 'EMPLOYEE_ID' && e.message.includes('duplikat dalam file Excel')
                );
                
                if (isDuplicate && !hasDuplicateError) {
                  return [...prevErrors, {
                    row: otherRowNumber,
                    column: 'EMPLOYEE_ID',
                    message: `Employee ID "${r.employee_id}" duplikat dalam file Excel. Setiap Employee ID harus unik.`,
                  }];
                } else if (!isDuplicate && hasDuplicateError) {
                  return prevErrors.filter(
                    (e) => !(e.row === otherRowNumber && e.column === 'EMPLOYEE_ID' && e.message.includes('duplikat dalam file Excel'))
                  );
                }
                return prevErrors;
              });
            }
          });
        } else {
          // Remove errors if employee_id is cleared
          setValidationErrors((prevErrors) =>
            prevErrors.filter(
              (e) => !(e.row === rowNumber && e.column === 'EMPLOYEE_ID')
            )
          );
        }
      }

      if (field === 'telepon') {
        if (value.trim()) {
          const cleanedPhone = value.replace(/[\s\-]/g, '');
          if (!/^\+?[0-9]{8,15}$/.test(cleanedPhone)) {
            newErrors.push({
              row: rowNumber,
              column: 'TELEPON',
              message: 'Nomor telepon tidak valid. Format: +6281234567890 atau 081234567890.',
            });
          }
        }
        // If telepon is cleared, error already removed above
      }

      if (field === 'password') {
        if (!value.trim()) {
          newErrors.push({
            row: rowNumber,
            column: 'PASSWORD',
            message: 'Password wajib diisi.',
          });
        } else if (value.length < 8) {
          newErrors.push({
            row: rowNumber,
            column: 'PASSWORD',
            message: 'Password minimal 8 karakter.',
          });
        }
      }

      // Add synchronous errors immediately
      if (newErrors.length > 0) {
        setValidationErrors((prevErrors) => [...prevErrors, ...newErrors]);
      }
      
      return updated;
    });
  }, []);

  const handleDeleteRow = useCallback((index: number) => {
    const deletedRowNumber = index + 2;
    
    // Remove the row from preview data
    setPreviewData((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      // Update NO for remaining rows
      const renumbered = updated.map((row, idx) => ({
        ...row,
        no: idx + 1,
      }));

      // Update validation errors after deletion
      setValidationErrors((prevErrors) => {
        // 1. Remove errors for deleted row
        let filtered = prevErrors.filter((e) => e.row !== deletedRowNumber);
        
        // 2. Update row numbers for remaining errors (shift down by 1 for rows after deleted row)
        filtered = filtered.map((error) => {
          if (error.row > deletedRowNumber) {
            return {
              ...error,
              row: error.row - 1,
            };
          }
          return error;
        });

        // 3. Re-validate duplicates with updated data
        const newErrors: ImportUserValidationError[] = [];
        
        renumbered.forEach((row, idx) => {
          const newRowNumber = idx + 2;
          
          // Check email duplicates
          if (row.email) {
            const duplicateEmail = renumbered.some(
              (r, otherIdx) => otherIdx !== idx && r.email && r.email.toLowerCase() === row.email.toLowerCase()
            );
            const hasDuplicateError = filtered.some(
              (e) => e.row === newRowNumber && e.column === 'EMAIL' && e.message.includes('duplikat dalam file Excel')
            );
            if (duplicateEmail && !hasDuplicateError) {
              newErrors.push({
                row: newRowNumber,
                column: 'EMAIL',
                message: `Email "${row.email}" duplikat dalam file Excel. Setiap email harus unik.`,
              });
            } else if (!duplicateEmail) {
              // Remove duplicate error if no longer duplicate
              filtered = filtered.filter(
                (e) => !(e.row === newRowNumber && e.column === 'EMAIL' && e.message.includes('duplikat dalam file Excel'))
              );
            }
          }

          // Check username duplicates
          if (row.username) {
            const duplicateUsername = renumbered.some(
              (r, otherIdx) => otherIdx !== idx && r.username && r.username.toLowerCase() === row.username.toLowerCase()
            );
            const hasDuplicateError = filtered.some(
              (e) => e.row === newRowNumber && e.column === 'USERNAME' && e.message.includes('duplikat dalam file Excel')
            );
            if (duplicateUsername && !hasDuplicateError) {
              newErrors.push({
                row: newRowNumber,
                column: 'USERNAME',
                message: `Username "${row.username}" duplikat dalam file Excel. Setiap username harus unik.`,
              });
            } else if (!duplicateUsername) {
              filtered = filtered.filter(
                (e) => !(e.row === newRowNumber && e.column === 'USERNAME' && e.message.includes('duplikat dalam file Excel'))
              );
            }
          }

          // Check employee_id duplicates
          if (row.employee_id) {
            const duplicateEmployeeId = renumbered.some(
              (r, otherIdx) => otherIdx !== idx && r.employee_id && r.employee_id.toLowerCase() === row.employee_id.toLowerCase()
            );
            const hasDuplicateError = filtered.some(
              (e) => e.row === newRowNumber && e.column === 'EMPLOYEE_ID' && e.message.includes('duplikat dalam file Excel')
            );
            if (duplicateEmployeeId && !hasDuplicateError) {
              newErrors.push({
                row: newRowNumber,
                column: 'EMPLOYEE_ID',
                message: `Employee ID "${row.employee_id}" duplikat dalam file Excel. Setiap Employee ID harus unik.`,
              });
            } else if (!duplicateEmployeeId) {
              filtered = filtered.filter(
                (e) => !(e.row === newRowNumber && e.column === 'EMPLOYEE_ID' && e.message.includes('duplikat dalam file Excel'))
              );
            }
          }
        });

        // Remove all old duplicate errors and add new ones
        const withoutDuplicates = filtered.filter(
          (e) => !e.message.includes('duplikat dalam file Excel')
        );
        
        return [...withoutDuplicates, ...newErrors];
      });

      return renumbered;
    });
  }, []);

  const getErrorForCell = (rowIndex: number, column: string): ImportUserValidationError | undefined => {
    // Backend returns row number starting from 2 (row 1 is header)
    // Frontend preview starts from index 0, so row number = index + 2
    const rowNumber = rowIndex + 2;
    return validationErrors.find(
      (error) => error.row === rowNumber && error.column.toLowerCase() === column.toLowerCase()
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const hasErrors = validationErrors.length > 0;
  const canImport = file && previewData.length > 0 && !hasErrors && !isLoading;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-5xl m-2 sm:m-4">
      <div className="relative w-full max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 overflow-hidden" style={{ maxWidth: '1200px' }}>
        <div className="flex-shrink-0 p-3 sm:p-4 lg:p-8">
          <ModalHeader
            title="Import User"
            description="Template Aplikasi - Preview dan validasi data sebelum import"
          />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 lg:px-8 min-h-0">
          <div className="space-y-4 pb-4">
          {/* Download Template Button */}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              type="button"
            >
              {isDownloadingTemplate ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon size="sm" />
                  Mengunduh...
                </span>
              ) : (
                "Download Template"
              )}
            </Button>
          </div>

          {/* File Upload */}
          <div>
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Klik untuk memilih file Excel
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    Format: .xlsx atau .xls
                  </span>
                </label>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  type="button"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Memuat preview data..." />
            </div>
          )}

          {/* Validation Errors */}
          {hasErrors && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Error Validasi ({validationErrors.length} error)
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <ul className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <li
                      key={index}
                      className="text-sm text-red-700 dark:text-red-400"
                    >
                      • {error.message} (Baris {error.row}, Kolom {error.column})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {previewData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Preview Data ({previewData.length} user)
                </h3>
                {file && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    File: {file.name}
                  </span>
                )}
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto overflow-x-auto custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        NO
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        NAMA
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        EMAIL
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        USERNAME
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        TELEPON
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        EMPLOYEE ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        JABATAN
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        PASSWORD
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.map((row, index) => {
                      const namaError = getErrorForCell(index, 'NAMA');
                      const emailError = getErrorForCell(index, 'EMAIL');
                      const usernameError = getErrorForCell(index, 'USERNAME');
                      const teleponError = getErrorForCell(index, 'TELEPON');
                      const employeeIdError = getErrorForCell(index, 'EMPLOYEE_ID');
                      const jabatanError = getErrorForCell(index, 'JABATAN');
                      const passwordError = getErrorForCell(index, 'PASSWORD');

                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {row.no}
                          </td>
                          <td className={`px-2 py-1 ${namaError ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                            <Input
                              type="text"
                              value={row.nama}
                              onChange={(e) => updatePreviewData(index, 'nama', e.target.value)}
                              className={`h-8 text-xs sm:text-sm px-2 ${
                                namaError
                                  ? "border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                  : ""
                              }`}
                              placeholder="Nama lengkap"
                            />
                          </td>
                          <td className={`px-2 py-1 ${emailError ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                            <Input
                              type="email"
                              value={row.email}
                              onChange={(e) => updatePreviewData(index, 'email', e.target.value)}
                              className={`h-8 text-xs sm:text-sm px-2 ${
                                emailError
                                  ? "border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                  : ""
                              }`}
                              placeholder="email@example.com"
                            />
                          </td>
                          <td className={`px-2 py-1 ${usernameError ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                            <Input
                              type="text"
                              value={row.username || ""}
                              onChange={(e) => updatePreviewData(index, 'username', e.target.value)}
                              className={`h-8 text-xs sm:text-sm px-2 ${
                                usernameError
                                  ? "border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                  : ""
                              }`}
                              placeholder="Username"
                            />
                          </td>
                          <td className={`px-2 py-1 ${teleponError ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                            <Input
                              type="tel"
                              value={row.telepon || ""}
                              onChange={(e) => updatePreviewData(index, 'telepon', e.target.value)}
                              className={`h-8 text-xs sm:text-sm px-2 ${
                                teleponError
                                  ? "border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                  : ""
                              }`}
                              placeholder="+6281234567890"
                            />
                          </td>
                          <td className={`px-2 py-1 ${employeeIdError ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                            <Input
                              type="text"
                              value={row.employee_id || ""}
                              onChange={(e) => updatePreviewData(index, 'employee_id', e.target.value)}
                              className={`h-8 text-xs sm:text-sm px-2 ${
                                employeeIdError
                                  ? "border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                  : ""
                              }`}
                              placeholder="Employee ID"
                            />
                          </td>
                          <td className={`px-2 py-1 ${jabatanError ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                            <Input
                              type="text"
                              value={row.jabatan || ""}
                              onChange={(e) => updatePreviewData(index, 'jabatan', e.target.value)}
                              className={`h-8 text-xs sm:text-sm px-2 ${
                                jabatanError
                                  ? "border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                  : ""
                              }`}
                              placeholder="Jabatan"
                            />
                          </td>
                          <td className={`px-2 py-1 ${passwordError ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                            <Input
                              type="password"
                              value={row.password}
                              onChange={(e) => updatePreviewData(index, 'password', e.target.value)}
                              className={`h-8 text-xs sm:text-sm px-2 ${
                                passwordError
                                  ? "border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                  : ""
                              }`}
                              placeholder="Min 8 karakter"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => handleDeleteRow(index)}
                              className="text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10"
                              title="Hapus baris"
                            >
                              <TrashBinIcon className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-8">
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={handleImport}
              disabled={!canImport || isImporting}
              className="w-full sm:w-auto"
            >
              {isImporting ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon size="sm" />
                  Mengimport...
                </span>
              ) : (
                "Import"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

