import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  Download, 
  FileCheck, 
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { DocumentAttachment } from '../types';

interface DocumentUploadZoneProps {
  section: 'schedule' | 'tasks' | 'workout' | 'academics';
  sectionTitle: string;
  attachments?: DocumentAttachment[];
  onAddAttachment: (attachment: DocumentAttachment) => void;
  onDeleteAttachment: (id: string) => void;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  section,
  sectionTitle,
  attachments = [],
  onAddAttachment,
  onDeleteAttachment,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [previewItem, setPreviewItem] = useState<DocumentAttachment | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sectionAttachments = attachments.filter((att) => att.section === section);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadError(null);

    // Validate size (max 5MB for base64 storage)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds 5MB limit. Please upload a smaller PDF or PNG.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let fileType: 'pdf' | 'png' | 'jpg' | 'other' = 'other';
    if (ext === 'pdf') fileType = 'pdf';
    else if (ext === 'png') fileType = 'png';
    else if (ext === 'jpg' || ext === 'jpeg') fileType = 'jpg';

    if (fileType === 'other') {
      setUploadError('Only PDF and PNG / JPG images are supported.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const newAttachment: DocumentAttachment = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: '',
        section,
        fileName: file.name,
        fileType,
        fileData: base64Data,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        notes: customNote.trim() || undefined,
      };

      onAddAttachment(newAttachment);
      setCustomNote('');
      setIsUploading(false);
    };

    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (att: DocumentAttachment) => {
    const link = document.createElement('a');
    link.href = att.fileData;
    link.download = att.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="mt-6 rounded-2xl bg-[#0e1424]/90 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {sectionTitle} Attachments & Documents
            </h4>
            <p className="text-xs text-slate-400">
              Upload PDF or PNG files (syllabi, routine sheets, checklists)
            </p>
          </div>
        </div>

        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {sectionAttachments.length} {sectionAttachments.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              {isUploading ? 'Uploading file...' : 'Drop your PDF or PNG here, or click to browse'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports .pdf, .png, .jpg up to 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Optional Note / Tag input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add optional note/tag before uploading (e.g. 'Midterm Syllabus', 'Leg Day Routine')..."
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          className="flex-1 bg-[#131b2e] border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Uploaded Documents List */}
      {sectionAttachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {sectionAttachments.map((att) => (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {att.fileType === 'pdf' ? (
                  <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 overflow-hidden">
                    {att.fileData.startsWith('data:image') ? (
                      <img src={att.fileData} alt={att.fileName} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate max-w-[160px] sm:max-w-[200px]" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="uppercase font-semibold text-slate-500">{att.fileType}</span>
                    <span>•</span>
                    <span>{formatSize(att.fileSize)}</span>
                    {att.notes && (
                      <>
                        <span>•</span>
                        <span className="text-blue-400 truncate max-w-[100px]" title={att.notes}>{att.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewItem(att)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="View"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(att)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteAttachment(att.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e1424] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white truncate max-w-md">
                    {previewItem.fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(previewItem)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewItem(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/30 min-h-[300px]">
                {previewItem.fileType === 'pdf' ? (
                  <div className="w-full h-[500px]">
                    <iframe
                      src={previewItem.fileData}
                      title={previewItem.fileName}
                      className="w-full h-full rounded-lg border border-slate-800"
                    />
                  </div>
                ) : (
                  <img
                    src={previewItem.fileData}
                    alt={previewItem.fileName}
                    className="max-w-full max-h-[500px] object-contain rounded-lg border border-slate-800 shadow-md"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
